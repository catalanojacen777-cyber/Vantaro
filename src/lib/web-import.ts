import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

/**
 * Fetch a public web page safely for brief import:
 *  - http/https only, standard ports, no credentials in the URL
 *  - every hostname (including each redirect) must resolve only to public IPs
 *  - the connection is pinned to the validated IP (prevents DNS rebinding)
 *  - strict timeout, size limit and content-type check
 * Retrieved text is untrusted data and is never treated as instructions.
 */

export class ImportError extends Error {
  constructor(
    public code: 'invalid_url' | 'blocked_address' | 'unreachable' | 'too_large' | 'not_html' | 'http_error' | 'too_many_redirects' | 'timeout',
    message: string,
  ) {
    super(message);
  }
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}
function inV4(ip: string, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}
const BLOCKED_V4 = [
  '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16', '172.16.0.0/12', '192.0.0.0/24',
  '192.0.2.0/24', '192.88.99.0/24', '192.168.0.0/16', '198.18.0.0/15', '198.51.100.0/24', '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4',
];

export function isPublicIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return !BLOCKED_V4.some((c) => inV4(ip, c));
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::' || lower === '::1') return false;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicIp(mapped[1]);
    if (/^f[cd]/.test(lower)) return false; // unique local fc00::/7
    if (/^fe[89ab]/.test(lower)) return false; // link-local fe80::/10
    if (/^ff/.test(lower)) return false; // multicast
    if (lower.startsWith('64:ff9b:')) return false; // NAT64 can reach internal v4
    if (lower.startsWith('2001:db8')) return false; // documentation
    return true;
  }
  return false;
}

export function normalizeUrl(raw: string, allowAnyPort = false): URL {
  let s = raw.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    throw new ImportError('invalid_url', 'That does not look like a web address.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new ImportError('invalid_url', 'Only http and https addresses can be imported.');
  if (url.username || url.password) throw new ImportError('invalid_url', 'Addresses with login details cannot be imported.');
  if (url.port && !allowAnyPort && !['80', '443'].includes(url.port)) throw new ImportError('invalid_url', 'Only standard web ports are allowed.');
  if (!url.hostname.includes('.') && !net.isIP(url.hostname)) throw new ImportError('invalid_url', 'Use a full public domain name.');
  return url;
}

type Resolver = (host: string) => Promise<string[]>;
const defaultResolver: Resolver = async (host) => (await dns.promises.lookup(host, { all: true, verbatim: true })).map((a) => a.address);

async function resolvePublic(host: string, resolve: Resolver, allowIps: string[]): Promise<string> {
  if (net.isIP(host)) {
    if (!allowIps.includes(host) && !isPublicIp(host)) throw new ImportError('blocked_address', 'That address points to a private network and cannot be imported.');
    return host;
  }
  let addrs: string[];
  try {
    addrs = await resolve(host);
  } catch {
    throw new ImportError('unreachable', 'We could not find that website. Check the address.');
  }
  if (!addrs.length) throw new ImportError('unreachable', 'We could not find that website.');
  // Every address must be public, or a later connection could be steered inward.
  if (addrs.some((a) => !allowIps.includes(a) && !isPublicIp(a))) throw new ImportError('blocked_address', 'That address points to a private network and cannot be imported.');
  return addrs[0];
}

function requestOnce(url: URL, ip: string, timeoutMs: number, maxBytes: number): Promise<{ status: number; location?: string; contentType: string; body: string }> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(
      url,
      {
        method: 'GET',
        headers: { 'user-agent': 'VantaroBriefImport/1.0 (+public page summary)', accept: 'text/html,application/xhtml+xml' },
        // Pin the connection to the address we validated.
        lookup: ((_host: string, lookupOpts: { all?: boolean }, cb: (...args: unknown[]) => void) => {
          const family = net.isIP(ip);
          if (lookupOpts?.all) cb(null, [{ address: ip, family }]);
          else cb(null, ip, family);
        }) as unknown as typeof dns.lookup,
        timeout: timeoutMs,
        agent: false,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, location: res.headers.location, contentType: '', body: '' });
        }
        const contentType = String(res.headers['content-type'] ?? '');
        let size = 0;
        let tooLarge = false;
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => {
          if (tooLarge) return;
          size += c.length;
          if (size > maxBytes) {
            tooLarge = true;
            reject(new ImportError('too_large', 'That page is too large to import.'));
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        res.on('end', () => {
          if (!tooLarge) resolve({ status, contentType, body: Buffer.concat(chunks).toString('utf8') });
        });
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new ImportError('timeout', 'The website took too long to respond.')));
    req.on('error', (e) => reject(e instanceof ImportError ? e : new ImportError('unreachable', 'We could not reach that website.')));
    req.end();
  });
}

export async function fetchPublicPage(
  raw: string,
  opts: { resolve?: Resolver; testAllowIps?: string[]; testAllowAnyPort?: boolean; timeoutMs?: number; maxBytes?: number; maxRedirects?: number } = {},
): Promise<{ url: string; html: string }> {
  const resolve = opts.resolve ?? defaultResolver;
  let url = normalizeUrl(raw, !!opts.testAllowAnyPort);
  for (let hop = 0; hop <= (opts.maxRedirects ?? 3); hop++) {
    const ip = await resolvePublic(url.hostname, resolve, opts.testAllowIps ?? []);
    const res = await requestOnce(url, ip, opts.timeoutMs ?? 8000, opts.maxBytes ?? 1_500_000);
    if (res.status >= 300 && res.status < 400) {
      if (!res.location) throw new ImportError('http_error', 'The website redirected without a destination.');
      url = normalizeUrl(new URL(res.location, url).toString(), !!opts.testAllowAnyPort);
      continue;
    }
    if (res.status >= 400) throw new ImportError('http_error', `The website responded with an error (${res.status}).`);
    if (!/text\/html|application\/xhtml/i.test(res.contentType)) throw new ImportError('not_html', 'That address is not a web page we can read.');
    return { url: url.toString(), html: res.body };
  }
  throw new ImportError('too_many_redirects', 'The website redirected too many times.');
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract readable text: title, meta description, headings and body copy. */
export function extractPage(html: string) {
  const cleaned = html.replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const title = decode(cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const description = decode(
    cleaned.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
      cleaned.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
      '',
  );
  const siteName = decode(cleaned.match(/<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i)?.[1] ?? '');
  const headings = Array.from(cleaned.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
    .map((m) => decode(m[1].replace(/<[^>]+>/g, ' ')))
    .filter(Boolean)
    .slice(0, 20);
  const text = decode(cleaned.replace(/<[^>]+>/g, ' ')).slice(0, 6000);
  return { title, description, siteName, headings, text };
}
