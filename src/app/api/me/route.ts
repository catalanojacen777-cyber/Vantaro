import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ signedIn: !!user }, { headers: { 'cache-control': 'private, no-store' } });
}
