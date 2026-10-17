import { config, type Plan } from '@/config/site';
import { getDb, now } from '@/lib/db';
import { newId } from '@/lib/ids';

export type UsageKind = 'generation' | 'strategy';

export type Actor =
  | { type: 'user'; userId: string; plan: Plan }
  | { type: 'anon'; anonId: string; ipHash: string | null };

export type QuotaResult =
  | { ok: true; usageEventId: string; remaining: number }
  | { ok: false; limit: number; used: number; windowHours: number };

export function limitsFor(actor: Actor, kind: UsageKind): { limit: number; windowHours: number } {
  if (actor.type === 'anon') {
    // Anonymous visitors can try tools, not run full strategies.
    return kind === 'generation'
      ? { limit: config.limits.anonymousGenerationsPerDay, windowHours: 24 }
      : { limit: 0, windowHours: 24 * 30 };
  }
  const l = actor.plan === 'paid' ? config.limits.paid : config.limits.free;
  return kind === 'generation'
    ? { limit: l.generationsPerDay, windowHours: 24 }
    : { limit: l.strategiesPer30Days, windowHours: 24 * 30 };
}

function since(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

/** Count reserved + finalized usage (released usage does not count). */
export function usedCount(subject: string, kind: UsageKind, windowHours: number, column: 'subject' | 'subject2' = 'subject'): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM usage_events WHERE ${column} = ? AND kind = ? AND status != 'released' AND created_at >= ?`,
    )
    .get(subject, kind, since(windowHours)) as { n: number };
  return row.n;
}

export function usageSummary(actor: Actor, kind: UsageKind) {
  const { limit, windowHours } = limitsFor(actor, kind);
  const subject = actor.type === 'user' ? `user:${actor.userId}` : `anon:${actor.anonId}`;
  const used = usedCount(subject, kind, windowHours);
  return { limit, used, remaining: Math.max(0, limit - used), windowHours };
}

/**
 * Atomically check the quota and reserve one unit. better-sqlite3 runs the
 * transaction synchronously, so two concurrent requests cannot both pass the
 * check and exceed the limit.
 */
export function reserveUsage(actor: Actor, kind: UsageKind, jobId: string | null): QuotaResult {
  const db = getDb();
  const { limit, windowHours } = limitsFor(actor, kind);
  return db
    .transaction((): QuotaResult => {
      const subject = actor.type === 'user' ? `user:${actor.userId}` : `anon:${actor.anonId}`;
      const subject2 = actor.type === 'anon' && actor.ipHash ? `ip:${actor.ipHash}` : null;
      const used = usedCount(subject, kind, windowHours);
      if (used >= limit) return { ok: false, limit, used, windowHours };
      if (subject2) {
        // Shared networks (offices, campuses) get headroom, but not unlimited.
        const ipUsed = usedCount(subject2, kind, windowHours, 'subject2');
        if (ipUsed >= limit * 3) return { ok: false, limit, used: Math.max(used, limit), windowHours };
      }
      const id = newId('use');
      const ts = now();
      db.prepare(
        `INSERT INTO usage_events (id, subject, subject2, kind, status, job_id, created_at, updated_at)
         VALUES (?,?,?,?, 'reserved', ?, ?, ?)`,
      ).run(id, subject, subject2, kind, jobId, ts, ts);
      return { ok: true, usageEventId: id, remaining: limit - used - 1 };
    })
    .immediate();
}

export function finalizeUsage(usageEventId: string) {
  getDb()
    .prepare(`UPDATE usage_events SET status='finalized', updated_at=? WHERE id=? AND status='reserved'`)
    .run(now(), usageEventId);
}

/** Policy: failed or cancelled generations are not charged. */
export function releaseUsage(usageEventId: string) {
  getDb()
    .prepare(`UPDATE usage_events SET status='released', updated_at=? WHERE id=? AND status='reserved'`)
    .run(now(), usageEventId);
}

export function getPlan(userId: string): Plan {
  const row = getDb()
    .prepare(`SELECT 1 FROM entitlements WHERE user_id = ? AND plan = 'paid' AND revoked_at IS NULL LIMIT 1`)
    .get(userId);
  return row ? 'paid' : 'free';
}
