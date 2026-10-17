import { z } from 'zod';
import { config } from '@/config/site';
import { handle } from '@/lib/api';
import { requestPasswordReset } from '@/lib/auth/accounts';
import { rateLimit } from '@/lib/security/rate-limit';
import { HttpError, ipHash, readJson } from '@/lib/security/request';
import { sha256 } from '@/lib/ids';

const body = z.object({ email: z.string().max(254) });

export const POST = handle(async (req) => {
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Enter your email address.');
  const ip = ipHash(req);
  const key = sha256(parsed.data.email.trim().toLowerCase()).slice(0, 24);
  if (!rateLimit(`reset:e:${key}`, 4, 3600) || (ip && !rateLimit(`reset:i:${ip}`, 15, 3600))) {
    throw new HttpError(429, 'rate_limited', 'Too many reset requests. Try again in an hour.');
  }
  const { delivery } = await requestPasswordReset(parsed.data.email);
  // The same answer whether or not an account exists, unless email itself is unavailable.
  if (delivery === 'not_configured') {
    return Response.json({
      ok: true,
      delivery: 'not_configured',
      message:
        config.deployment === 'production'
          ? 'Password reset email is not available right now. Contact support to regain access.'
          : 'Email delivery is not configured in this environment. If the account exists, the reset link was written to the server log.',
    });
  }
  if (delivery === 'failed') {
    throw new HttpError(502, 'email_failed', 'We could not send the reset email just now. Try again in a few minutes.');
  }
  return Response.json({ ok: true, delivery: 'sent', message: 'If an account uses that email, a reset link is on its way. It expires in one hour.' });
});
