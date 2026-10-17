import { z } from 'zod';
import { config } from '@/config/site';
import { handle } from '@/lib/api';
import { createWorkspace, listWorkspaces, requireUser, setWorkspaceCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getPlan } from '@/lib/usage';
import { HttpError, readJson } from '@/lib/security/request';

export const GET = handle(async () => {
  const user = await requireUser();
  return Response.json({ workspaces: listWorkspaces(user.id) });
});

const body = z.object({ name: z.string().trim().min(1).max(80) });

export const POST = handle(async (req) => {
  const user = await requireUser();
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, 'invalid', 'Give the workspace a name (80 characters or fewer).');
  const plan = getPlan(user.id);
  const limit = (plan === 'paid' ? config.limits.paid : config.limits.free).workspaces;
  const owned = (getDb().prepare('SELECT COUNT(*) n FROM workspaces WHERE owner_id=?').get(user.id) as { n: number }).n;
  if (owned >= limit) {
    throw new HttpError(403, 'workspace_limit', `Your plan includes ${limit} ${limit === 1 ? 'workspace' : 'workspaces'}.`);
  }
  const id = createWorkspace(user.id, parsed.data.name);
  await setWorkspaceCookie(id);
  return Response.json({ id });
});
