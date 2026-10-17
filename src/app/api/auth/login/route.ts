import { z } from 'zod';
import { handle } from '@/lib/api';
import { authenticate } from '@/lib/auth/accounts';
import { createSession } from '@/lib/auth/session';
import { rateLimit } from '@/lib/security/rate-limit';
import { HttpError, ipHash, readJson } from '@/lib/security/request';
import { sha256 } from '@/lib/ids';

const body = z.object({ email: z.string().max(254), password: z.string().max(200) });

export const POST = handle(async (req) => {
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Enter your email and password.');
  const emailKey = sha256(parsed.data.email.trim().toLowerCase()).slice(0, 24);
  const ip = ipHash(req);
  const allowed = rateLimit(`login:e:${emailKey}`, 10, 900) && (!ip || rateLimit(`login:i:${ip}`, 40, 900));
  if (!allowed) throw new HttpError(429, 'rate_limited', 'Too many attempts. Wait 15 minutes, or reset your password.');
  const userId = await authenticate(parsed.data.email, parsed.data.password);
  if (!userId) throw new HttpError(401, 'invalid_credentials', 'That email and password do not match an account.');
  await createSession(userId, req.headers.get('user-agent'));
  return Response.json({ ok: true });
});
