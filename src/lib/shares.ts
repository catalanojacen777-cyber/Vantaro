import { getDb, now } from '@/lib/db';
import { newId, newToken, sha256 } from '@/lib/ids';
import { HttpError } from '@/lib/security/request';
import { getStrategy, requireStrategy, type Strategy } from '@/lib/strategy/repo';

export type ShareRow = {
  id: string;
  strategy_id: string;
  strategy_title: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  last_viewed_at: string | null;
};

/** Returns the raw token once. Only its hash is stored. */
export function createShare(workspaceId: string, strategyId: string, userId: string, expiresInDays: number | null) {
  requireStrategy(workspaceId, strategyId);
  const token = newToken();
  const id = newId('shr');
  const expires = expiresInDays ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString() : null;
  getDb()
    .prepare('INSERT INTO share_links (id, token_hash, strategy_id, created_by, expires_at, created_at) VALUES (?,?,?,?,?,?)')
    .run(id, sha256(token), strategyId, userId, expires, now());
  return { id, token, expiresAt: expires };
}

export function listShares(workspaceId: string, strategyId?: string): ShareRow[] {
  const where = strategyId ? 'AND s.id = ?' : '';
  const params = strategyId ? [workspaceId, strategyId] : [workspaceId];
  return getDb()
    .prepare(
      `SELECT l.id, l.strategy_id, s.title AS strategy_title, l.expires_at, l.revoked_at, l.created_at, l.last_viewed_at
       FROM share_links l JOIN strategies s ON s.id = l.strategy_id
       WHERE s.workspace_id = ? ${where} ORDER BY l.created_at DESC LIMIT 200`,
    )
    .all(...params) as ShareRow[];
}

export function revokeShare(workspaceId: string, shareId: string) {
  const res = getDb()
    .prepare(
      `UPDATE share_links SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL
       AND strategy_id IN (SELECT id FROM strategies WHERE workspace_id = ?)`,
    )
    .run(now(), shareId, workspaceId);
  if (res.changes === 0) throw new HttpError(404, 'not_found', 'That share link was not found or is already revoked.');
}

/** Resolve a public token to a read-only strategy, or null if invalid/revoked/expired. */
export function resolveShare(token: string): Strategy | null {
  if (!token || token.length > 100) return null;
  const db = getDb();
  const link = db.prepare('SELECT id, strategy_id, expires_at, revoked_at FROM share_links WHERE token_hash=?').get(sha256(token)) as
    | { id: string; strategy_id: string; expires_at: string | null; revoked_at: string | null }
    | undefined;
  if (!link || link.revoked_at || (link.expires_at && link.expires_at < now())) return null;
  const ws = db.prepare('SELECT workspace_id FROM strategies WHERE id=?').get(link.strategy_id) as { workspace_id: string } | undefined;
  if (!ws) return null;
  db.prepare('UPDATE share_links SET last_viewed_at=? WHERE id=?').run(now(), link.id);
  return getStrategy(ws.workspace_id, link.strategy_id);
}
