import { z } from 'zod';
import { handle } from '@/lib/api';
import { CLIENT_EVENTS, track, type EventName } from '@/lib/analytics';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';
import { rateLimit } from '@/lib/security/rate-limit';
import { ipHash, readJson } from '@/lib/security/request';

const body = z.object({ name: z.string().max(40), tool: z.string().max(80).optional() });

/**
 * Browser-reported product events. Only whitelisted names and a valid tool
 * slug are accepted; nothing typed by the visitor is ever recorded.
 */
export const POST = handle(async (req) => {
  const parsed = body.safeParse(await readJson(req, 1_000));
  if (!parsed.success || !CLIENT_EVENTS.has(parsed.data.name as EventName)) return new Response(null, { status: 204 });
  const tool = parsed.data.tool && TOOL_BY_SLUG[parsed.data.tool] ? parsed.data.tool : undefined;
  const ip = ipHash(req);
  if (rateLimit(`evt:${ip ?? 'anon'}`, 60, 600)) track(parsed.data.name as EventName, { tool });
  return new Response(null, { status: 204 });
});
