import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { migrations } from './migrations';

type DB = Database.Database;

const g = globalThis as unknown as { __vantaroDb?: DB; __vantaroDbPath?: string };

function resolvePath(): string {
  return process.env.DATABASE_PATH?.trim() || './data/vantaro.db';
}

export function migrate(db: DB): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
  const applied = new Set(
    (db.prepare('SELECT id FROM schema_migrations').all() as { id: string }[]).map((r) => r.id),
  );
  const ran: string[] = [];
  for (const m of migrations) {
    if (applied.has(m.id)) continue;
    db.transaction(() => {
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(m.id, now());
    })();
    ran.push(m.id);
  }
  return ran;
}

/**
 * Jobs run in-process. If the server stopped mid-generation, those jobs can
 * never finish: mark them failed and release their reserved usage so the
 * person is not charged for work that did not complete.
 */
function recoverInterruptedJobs(db: DB) {
  const stuck = db
    .prepare(`SELECT id, usage_event_id, strategy_id, section_key, kind FROM generation_jobs WHERE status IN ('queued','running')`)
    .all() as { id: string; usage_event_id: string | null; strategy_id: string | null; section_key: string | null; kind: string }[];
  if (!stuck.length) return;
  const ts = now();
  db.transaction(() => {
    for (const j of stuck) {
      db.prepare(
        `UPDATE generation_jobs SET status='failed', error_code='interrupted',
         error_message='The server restarted before this finished. Nothing was charged; try again.', finished_at=? WHERE id=?`,
      ).run(ts, j.id);
      if (j.usage_event_id) {
        db.prepare(`UPDATE usage_events SET status='released', updated_at=? WHERE id=? AND status='reserved'`).run(ts, j.usage_event_id);
      }
      if (j.kind === 'assist') {
        db.prepare(`UPDATE assistant_messages SET status='failed', error='The server restarted before this finished. Nothing was charged; ask again.' WHERE job_id=? AND status='pending'`).run(j.id);
        continue;
      }
      if (j.strategy_id) {
        db.prepare(`UPDATE strategy_sections SET status='failed', error='Interrupted' WHERE strategy_id=? AND status='generating'`).run(j.strategy_id);
        db.prepare(`UPDATE strategies SET status=CASE WHEN status='generating' THEN 'partial' ELSE status END WHERE id=?`).run(j.strategy_id);
      }
    }
  })();
}

/**
 * Housekeeping: anonymous tool runs are kept 7 days (long enough to save
 * them after signing up), expired sessions/reset tokens and old rate-limit
 * windows are removed. Runs at startup and hourly.
 */
export function maintenance(db: DB) {
  const nowIso = now();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  db.transaction(() => {
    db.prepare(`DELETE FROM generation_jobs WHERE anon_id IS NOT NULL AND user_id IS NULL AND created_at < ? AND status NOT IN ('queued','running')`).run(weekAgo);
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso);
    db.prepare('DELETE FROM password_resets WHERE expires_at < ?').run(nowIso);
    db.prepare('DELETE FROM rate_limits WHERE window_start < ?').run(Math.floor(Date.now() / 1000) - 2 * 86_400);
    db.prepare(`DELETE FROM usage_events WHERE created_at < ?`).run(new Date(Date.now() - 45 * 86_400_000).toISOString());
  })();
}

export function openDb(file: string): DB {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  migrate(db);
  recoverInterruptedJobs(db);
  maintenance(db);
  if (file !== ':memory:') {
    setInterval(() => {
      try {
        maintenance(db);
      } catch {
        // best effort
      }
    }, 3_600_000).unref();
  }
  return db;
}

export function getDb(): DB {
  const file = resolvePath();
  if (!g.__vantaroDb || g.__vantaroDbPath !== file) {
    g.__vantaroDb = openDb(file);
    g.__vantaroDbPath = file;
  }
  return g.__vantaroDb;
}

/** Test helper: swap the singleton for an isolated database. */
export function __setDbForTests(db: DB, file = ':memory:') {
  g.__vantaroDb = db;
  g.__vantaroDbPath = file;
  process.env.DATABASE_PATH = file;
}

export function now(): string {
  return new Date().toISOString();
}

export function json<T>(value: string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
