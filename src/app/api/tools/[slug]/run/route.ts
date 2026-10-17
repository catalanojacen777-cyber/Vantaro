import { z } from 'zod';
import { config } from '@/config/site';
import { handle } from '@/lib/api';
import { getOrCreateAnonId } from '@/lib/anon';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth/session';
import { startToolRun } from '@/lib/jobs';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';
import { validateToolInput } from '@/lib/tools/validate';
import { getPlan } from '@/lib/usage';
import { rateLimit } from '@/lib/security/rate-limit';
import { HttpError, ipHash, readJson } from '@/lib/security/request';

const body = z.object({ values: z.record(z.string(), z.unknown()), idempotencyKey: z.string().min(8).max(80) });

export const POST = handle<{ params: Promise<{ slug: string }> }>(async (req, { params }) => {
  const { slug } = await params;
  const tool = TOOL_BY_SLUG[slug];
  if (!tool || tool.kind !== 'ai') throw new HttpError(404, 'not_found', 'That tool does not exist.');
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Invalid request.');

  const raw = { ...parsed.data.values };
  const languages = config.ai.outputLanguages;
  const language = typeof raw.language === 'string' && languages.includes(raw.language) ? raw.language : languages[0];
  delete raw.language;
  const checked = validateToolInput(tool, raw);
  if (!checked.ok) throw new HttpError(422, 'invalid_input', 'Some fields need attention.', { fields: checked.errors });

  const user = await getCurrentUser();
  const ip = ipHash(req);
  // Burst protection on top of the daily quota.
  if (!rateLimit(`toolrun:${user ? user.id : ip ?? 'anon'}`, user ? 20 : 8, 60)) {
    throw new HttpError(429, 'rate_limited', 'Too many requests in a short time. Wait a minute and try again.');
  }
  let result;
  if (user) {
    const ws = await getCurrentWorkspace();
    result = startToolRun({
      actor: { type: 'user', userId: user.id, plan: getPlan(user.id) },
      workspaceId: ws?.id ?? null,
      tool,
      values: { ...checked.values, language },
      idempotencyKey: parsed.data.idempotencyKey,
    });
  } else {
    const anonId = await getOrCreateAnonId();
    result = startToolRun({ actor: { type: 'anon', anonId, ipHash: ip }, workspaceId: null, tool, values: { ...checked.values, language }, idempotencyKey: parsed.data.idempotencyKey });
  }
  return Response.json(result, { status: 202 });
});
