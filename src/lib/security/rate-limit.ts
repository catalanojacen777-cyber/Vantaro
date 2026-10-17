import { getDb } from '@/lib/db';

/**
 * Fixed-window limiter backed by SQLite so limits survive restarts and are
 * shared by every request handled by this process. Returns true if allowed.
 */
export function rateLimit(key: string, limit: number, windowSeconds: number): boolean {
  const db = getDb();
  const nowS = Math.floor(Date.now() / 1000);
  const windowStart = nowS - (nowS % windowSeconds);
  return db.transaction(() => {
    const row = db.prepare('SELECT count, window_start FROM rate_limits WHERE key=?').get(key) as
      | { count: number; window_start: number }
      | undefined;
    if (!row || row.window_start !== windowStart) {
      db.prepare(
        'INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count=1, window_start=excluded.window_start',
      ).run(key, windowStart);
      return true;
    }
    if (row.count >= limit) return false;
    db.prepare('UPDATE rate_limits SET count=count+1 WHERE key=?').run(key);
    return true;
  })();
}
