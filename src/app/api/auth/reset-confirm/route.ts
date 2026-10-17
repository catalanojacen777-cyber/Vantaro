import { z } from 'zod';
import { handle } from '@/lib/api';
import { resetPassword } from '@/lib/auth/accounts';
import { createSession } from '@/lib/auth/session';
import { HttpError, readJson } from '@/lib/security/request';

const body = z.object({ token: z.string().min(10).max(100), password: z.string().max(200) });

export const POST = handle(async (req) => {
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Choose a new password.');
  const userId = await resetPassword(parsed.data.token, parsed.data.password);
  await createSession(userId, req.headers.get('user-agent'));
  return Response.json({ ok: true });
});
