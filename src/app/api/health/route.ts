import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Liveness and database check for the hosting platform's health probe. */
export function GET() {
  try {
    getDb().prepare('SELECT 1').get();
    return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
