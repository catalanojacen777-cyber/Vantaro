import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { startSectionRegeneration } from '@/lib/jobs';
import { getPlan } from '@/lib/usage';
import { HttpError, readJson } from '@/lib/security/request';

const body = z.object({ idempotencyKey: z.string().min(8).max(80), confirmOverwrite: z.boolean().default(false) });

export const POST = handle<{ params: Promise<{ id: string; key: string }> }>(async (req, { params }) => {
  const { user, workspace } = await requireWorkspace('editor');
  const { id, key } = await params;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Invalid request.');
  const result = startSectionRegeneration({
    actor: { type: 'user', userId: user.id, plan: getPlan(user.id) },
    workspaceId: workspace.id,
    strategyId: id,
    sectionKey: key,
    confirmOverwrite: parsed.data.confirmOverwrite,
    idempotencyKey: parsed.data.idempotencyKey,
  });
  return Response.json(result, { status: 202 });
});
