import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { createVersion, listVersions, requireStrategy } from '@/lib/strategy/repo';
import { HttpError, readJson } from '@/lib/security/request';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  return Response.json({ versions: listVersions(workspace.id, id) });
});

const body = z.object({ label: z.string().trim().min(1).max(120) });

export const POST = handle<Ctx>(async (req, { params }) => {
  const { user, workspace } = await requireWorkspace('editor');
  const { id } = await params;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, 'invalid', 'Give this version a short name.');
  requireStrategy(workspace.id, id);
  const versionId = createVersion(id, parsed.data.label, user.id);
  return Response.json({ id: versionId });
});
