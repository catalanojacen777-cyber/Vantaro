import { aiMode } from '@/config/site';
import { getAnonId } from '@/lib/anon';
import { getCurrentUser } from '@/lib/auth/session';
import { getPlan, usageSummary } from '@/lib/usage';

/** Runtime state for static tool pages: who is asking and what is left today. */
export async function GET() {
  const user = await getCurrentUser();
  const mode = aiMode();
  const headers = { 'cache-control': 'private, no-store' };
  if (user) {
    const s = usageSummary({ type: 'user', userId: user.id, plan: getPlan(user.id) }, 'generation');
    return Response.json({ signedIn: true, aiMode: mode, remaining: s.remaining, limit: s.limit }, { headers });
  }
  const anonId = await getAnonId();
  const s = anonId
    ? usageSummary({ type: 'anon', anonId, ipHash: null }, 'generation')
    : usageSummary({ type: 'anon', anonId: 'none', ipHash: null }, 'generation');
  return Response.json({ signedIn: false, aiMode: mode, remaining: s.remaining, limit: s.limit }, { headers });
}
