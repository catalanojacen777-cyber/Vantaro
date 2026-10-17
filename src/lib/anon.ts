import 'server-only';
import { cookies } from 'next/headers';
import { config } from '@/config/site';
import { newToken } from '@/lib/ids';

export const ANON_COOKIE = 'vt_anon';

/** Random, httpOnly identifier for anonymous quota and job ownership. */
export async function getOrCreateAnonId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(ANON_COOKIE)?.value;
  if (existing && /^[A-Za-z0-9_-]{20,64}$/.test(existing)) return existing;
  const id = newToken().slice(0, 32);
  jar.set(ANON_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.site.url.startsWith('https://'),
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  });
  return id;
}

export async function getAnonId(): Promise<string | null> {
  return (await cookies()).get(ANON_COOKIE)?.value ?? null;
}
