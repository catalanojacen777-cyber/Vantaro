import { handle } from '@/lib/api';
import { destroySession } from '@/lib/auth/session';

export const POST = handle(async () => {
  await destroySession();
  return Response.json({ ok: true });
});
