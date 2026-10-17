import { config } from '@/config/site';
import { hmac } from '@/lib/ids';

/**
 * Reject cross-site state-changing requests. Browsers send Origin on POST;
 * we require it to match the host the request was sent to (or the configured
 * site URL). Webhooks are exempt and verify signatures instead.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) {
    // Non-browser clients (tests, curl) may omit Origin; Sec-Fetch-Site tells
    // us when a browser made a cross-site request without it.
    const site = req.headers.get('sec-fetch-site');
    return !site || site === 'same-origin' || site === 'none';
  }
  try {
    const o = new URL(origin);
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    if (host && o.host === host) return true;
    return o.origin === new URL(config.site.url).origin;
  } catch {
    return false;
  }
}

/**
 * Client IP from proxy headers. These headers are client-controlled unless a
 * trusted reverse proxy overwrites them, so they are only used when
 * TRUST_PROXY=true (set this behind your host's load balancer).
 */
export function clientIp(req: Request): string | null {
  if (process.env.TRUST_PROXY !== 'true') return null;
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

/** Store only a keyed hash of the IP, never the IP itself. Null if unknown. */
export function ipHash(req: Request): string | null {
  const ip = clientIp(req);
  return ip ? hmac(config.security.appSecret, `ip:${ip}`).slice(0, 32) : null;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: { code: err.code, message: err.message, ...err.extra } }, { status: err.status });
  }
  console.error('[api] unhandled error', err instanceof Error ? err.message : 'unknown');
  return Response.json(
    { error: { code: 'internal', message: 'Something went wrong on our side. Try again in a moment.' } },
    { status: 500 },
  );
}

export async function readJson<T = unknown>(req: Request, maxBytes = 64_000): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, 'too_large', 'That request is too large.');
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, 'bad_json', 'The request body is not valid JSON.');
  }
}

export function requireSameOrigin(req: Request) {
  if (!isSameOrigin(req)) throw new HttpError(403, 'bad_origin', 'Cross-site requests are not allowed.');
}
