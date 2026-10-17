import { z } from 'zod';
import { cookies } from 'next/headers';
import { handle } from '@/lib/api';
import { requireUser, SESSION_COOKIE } from '@/lib/auth/session';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { getDb, now } from '@/lib/db';
import { sha256 } from '@/lib/ids';
import { HttpError, readJson } from '@/lib/security/request';

const body = z.object({ current: z.string().max(200), next: z.string().max(200) });

export const POST = handle(async (req) => {
  const user = await requireUser();
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Enter your current and new password.');
  const db = getDb();
  const row = db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id) as { password_hash: string };
  if (!(await verifyPassword(parsed.data.current, row.password_hash))) throw new HttpError(403, 'wrong_password', 'Your current password is not correct.', { field: 'current' });
  const problem = passwordProblem(parsed.data.next);
  if (problem) throw new HttpError(422, 'weak_password', problem, { field: 'next' });
  const hash = await hashPassword(parsed.data.next);
  const keep = (await cookies()).get(SESSION_COOKIE)?.value;
  db.transaction(() => {
    db.prepare('UPDATE users SET password_hash=?, updated_at=? WHERE id=?').run(hash, now(), user.id);
    // Sign out other devices, keep this one.
    db.prepare('DELETE FROM sessions WHERE user_id=? AND id_hash != ?').run(user.id, keep ? sha256(keep) : '');
  })();
  return Response.json({ ok: true });
});
