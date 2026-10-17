import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { config } from '@/config/site';
import { getDb, now } from '@/lib/db';
import { newId, newToken, sha256 } from '@/lib/ids';
import { HttpError } from '@/lib/security/request';

export const SESSION_COOKIE = 'vt_session';
export const WORKSPACE_COOKIE = 'vt_ws';

export type User = { id: string; email: string; name: string | null; created_at: string };
export type Role = 'owner' | 'editor' | 'viewer';
export type WorkspaceAccess = { id: string; name: string; role: Role };

const secureCookies = () => config.site.url.startsWith('https://');

export async function createSession(userId: string, userAgent: string | null): Promise<void> {
  const token = newToken();
  const expires = new Date(Date.now() + config.security.sessionDays * 86_400_000);
  getDb()
    .prepare('INSERT INTO sessions (id_hash, user_id, expires_at, created_at, user_agent) VALUES (?,?,?,?,?)')
    .run(sha256(token), userId, expires.toISOString(), now(), userAgent?.slice(0, 200) ?? null);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare('DELETE FROM sessions WHERE id_hash=?').run(sha256(token));
  jar.delete(SESSION_COOKIE);
  jar.delete(WORKSPACE_COOKIE);
}

export function revokeAllSessions(userId: string) {
  getDb().prepare('DELETE FROM sessions WHERE user_id=?').run(userId);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.created_at, s.expires_at FROM sessions s
       JOIN users u ON u.id = s.user_id WHERE s.id_hash = ?`,
    )
    .get(sha256(token)) as (User & { expires_at: string }) | undefined;
  if (!row) return null;
  if (row.expires_at < now()) {
    getDb().prepare('DELETE FROM sessions WHERE id_hash=?').run(sha256(token));
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, created_at: row.created_at };
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'unauthenticated', 'Log in to continue.');
  return user;
}

export function listWorkspaces(userId: string): WorkspaceAccess[] {
  return getDb()
    .prepare(
      `SELECT w.id, w.name, m.role FROM memberships m JOIN workspaces w ON w.id = m.workspace_id
       WHERE m.user_id = ? ORDER BY w.created_at`,
    )
    .all(userId) as WorkspaceAccess[];
}

export function workspaceAccess(userId: string, workspaceId: string): WorkspaceAccess | null {
  return (
    (getDb()
      .prepare(
        `SELECT w.id, w.name, m.role FROM memberships m JOIN workspaces w ON w.id = m.workspace_id
         WHERE m.user_id = ? AND w.id = ?`,
      )
      .get(userId, workspaceId) as WorkspaceAccess | undefined) ?? null
  );
}

const RANK: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 };

/**
 * Resolve the workspace for this request. The cookie is only a preference;
 * membership is always re-checked against the database.
 */
export const getCurrentWorkspace = cache(async (): Promise<WorkspaceAccess | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const jar = await cookies();
  const preferred = jar.get(WORKSPACE_COOKIE)?.value;
  if (preferred) {
    const access = workspaceAccess(user.id, preferred);
    if (access) return access;
  }
  return listWorkspaces(user.id)[0] ?? null;
});

export async function requireWorkspace(min: Role = 'viewer'): Promise<{ user: User; workspace: WorkspaceAccess }> {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new HttpError(404, 'no_workspace', 'No workspace found for this account.');
  if (RANK[workspace.role] < RANK[min]) {
    throw new HttpError(403, 'forbidden', 'Your role in this workspace does not allow that.');
  }
  return { user, workspace };
}

export async function setWorkspaceCookie(workspaceId: string) {
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function createWorkspace(userId: string, name: string): string {
  const db = getDb();
  const id = newId('ws');
  const ts = now();
  db.transaction(() => {
    db.prepare('INSERT INTO workspaces (id, name, owner_id, created_at, updated_at) VALUES (?,?,?,?,?)').run(
      id,
      name,
      userId,
      ts,
      ts,
    );
    db.prepare('INSERT INTO memberships (workspace_id, user_id, role, created_at) VALUES (?,?,?,?)').run(
      id,
      userId,
      'owner',
      ts,
    );
  })();
  return id;
}
