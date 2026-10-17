#!/usr/bin/env node
// Apply pending database migrations without starting the app.
// The app also applies them automatically on first database access.
// Requires Node 22.18+ (built-in TypeScript type stripping) to read the migration list.
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const { migrations } = await import('../src/lib/db/migrations/index.ts');
const file = process.env.DATABASE_PATH || './data/vantaro.db';
fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
const db = new Database(file);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
const applied = new Set(db.prepare('SELECT id FROM schema_migrations').all().map((r) => r.id));
let ran = 0;
for (const m of migrations) {
  if (applied.has(m.id)) continue;
  db.transaction(() => {
    db.exec(m.sql);
    db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(m.id, new Date().toISOString());
  })();
  console.log(`applied ${m.id}`);
  ran++;
}
console.log(ran ? `${ran} migration(s) applied to ${file}` : `Database ${file} is up to date`);
