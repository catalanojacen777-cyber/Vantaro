import { handle } from '@/lib/api';
import { requireUser } from '@/lib/auth/session';
import { createCheckout } from '@/lib/billing';
import { rateLimit } from '@/lib/security/rate-limit';
import { HttpError } from '@/lib/security/request';

export const POST = handle(async () => {
  const user = await requireUser();
  if (!rateLimit(`checkout:${user.id}`, 5, 600)) throw new HttpError(429, 'rate_limited', 'Too many checkout attempts. Try again in a few minutes.');
  const { url } = await createCheckout(user);
  return Response.json({ url });
});
