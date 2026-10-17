import { z } from 'zod';
import { config } from '@/config/site';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { startStrategyGeneration } from '@/lib/jobs';
import { missingRequired, productDescriptionProblem } from '@/lib/strategy/brief';
import { getProfile } from '@/lib/strategy/profile';
import { listStrategies } from '@/lib/strategy/repo';
import { getPlan } from '@/lib/usage';
import { HttpError, readJson } from '@/lib/security/request';

export const GET = handle(async (req) => {
  const { workspace } = await requireWorkspace();
  const url = new URL(req.url);
  const strategies = listStrategies(workspace.id, {
    q: url.searchParams.get('q')?.slice(0, 100) ?? undefined,
    archived: url.searchParams.get('archived') === '1',
  });
  return Response.json({ strategies });
});

const body = z.object({ idempotencyKey: z.string().min(8).max(80), personaCount: z.number().int().min(1).max(10).optional() });

export const POST = handle(async (req) => {
  const { user, workspace } = await requireWorkspace('editor');
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Invalid request.');
  const profile = getProfile(workspace.id);
  if (!profile) throw new HttpError(422, 'no_brief', 'Fill in your business brief first.');
  const missing = missingRequired(profile.data);
  if (missing.length) throw new HttpError(422, 'incomplete_brief', `Complete these brief fields first: ${missing.join(', ')}.`);
  const detail = productDescriptionProblem(profile.data);
  if (detail) throw new HttpError(422, 'incomplete_brief', detail);
  const plan = getPlan(user.id);
  const maxPersonas = (plan === 'paid' ? config.limits.paid : config.limits.free).personasPerStrategy;
  const personaCount = Math.min(parsed.data.personaCount ?? Math.min(3, maxPersonas), maxPersonas);
  const result = startStrategyGeneration({
    actor: { type: 'user', userId: user.id, plan },
    workspaceId: workspace.id,
    profileId: profile.id,
    brief: { ...profile.data, language: profile.data.language || config.ai.outputLanguages[0] },
    personaCount,
    idempotencyKey: parsed.data.idempotencyKey,
  });
  return Response.json(result, { status: 202 });
});
