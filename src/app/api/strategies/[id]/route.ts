import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { deleteStrategy, renameStrategy, requireStrategy, setArchived } from '@/lib/strategy/repo';
import { HttpError, readJson } from '@/lib/security/request';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  return Response.json({ strategy: requireStrategy(workspace.id, id) });
});

const patch = z.object({ title: z.string().max(140).optional(), archived: z.boolean().optional() });

export const PATCH = handle<Ctx>(async (req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id } = await params;
  const parsed = patch.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Invalid update.');
  if (parsed.data.title !== undefined) renameStrategy(workspace.id, id, parsed.data.title);
  if (parsed.data.archived !== undefined) setArchived(workspace.id, id, parsed.data.archived);
  return Response.json({ strategy: requireStrategy(workspace.id, id) });
});

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id } = await params;
  deleteStrategy(workspace.id, id);
  return Response.json({ ok: true });
});
