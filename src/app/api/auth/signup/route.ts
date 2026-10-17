import { z } from 'zod';
import { handle } from '@/lib/api';
import { registerUser } from '@/lib/auth/accounts';
import { createSession, setWorkspaceCookie } from '@/lib/auth/session';
import { rateLimit } from '@/lib/security/rate-limit';
import { HttpError, ipHash, readJson } from '@/lib/security/request';
import { track } from '@/lib/analytics';

const body = z.object({
  name: z.string().max(80).optional(),
  email: z.string().max(254),
  password: z.string().max(200),
});

export const POST = handle(async (req) => {
  const ip = ipHash(req);
  if (ip && !rateLimit(`signup:${ip}`, 8, 3600)) {
    throw new HttpError(429, 'rate_limited', 'Too many sign-up attempts from this network. Try again in an hour.');
  }
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Enter your email and a password.');
  const { userId, workspaceId } = await registerUser(parsed.data);
  await createSession(userId, req.headers.get('user-agent'));
  await setWorkspaceCookie(workspaceId);
  track('signup_completed');
  return Response.json({ ok: true });
});
