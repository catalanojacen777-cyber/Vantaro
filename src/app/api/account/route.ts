import { z } from 'zod';
import { handle } from '@/lib/api';
import { destroySession, requireUser } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import { getDb, now } from '@/lib/db';
import { HttpError, readJson } from '@/lib/security/request';

const patch = z.object({ name: z.string().trim().max(80) });

export const PATCH = handle(async (req) => {
  const user = await requireUser();
  const parsed = patch.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, 'invalid', 'Use 80 characters or fewer.');
  getDb().prepare('UPDATE users SET name=?, updated_at=? WHERE id=?').run(parsed.data.name || null, now(), user.id);
  return Response.json({ ok: true });
});

const del = z.object({ password: z.string().max(200) });

/** Deletes the user, their sessions, and every workspace they own (and its contents). */
export const DELETE = handle(async (req) => {
  const user = await requireUser();
  const parsed = del.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Enter your password to confirm.');
  const row = getDb().prepare('SELECT password_hash FROM users WHERE id=?').get(user.id) as { password_hash: string };
  if (!(await verifyPassword(parsed.data.password, row.password_hash))) {
    throw new HttpError(403, 'wrong_password', 'That password is not correct.', { field: 'password' });
  }
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM workspaces WHERE owner_id=?').run(user.id);
    db.prepare('DELETE FROM users WHERE id=?').run(user.id);
  })();
  await destroySession();
  return Response.json({ ok: true });
});
