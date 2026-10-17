import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { deleteOutput, getOutput, renameOutput } from '@/lib/outputs/repo';
import { HttpError, readJson } from '@/lib/security/request';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  const output = getOutput(workspace.id, id);
  if (!output) throw new HttpError(404, 'not_found', 'That saved output was not found.');
  return Response.json({ output });
});

export const PATCH = handle<Ctx>(async (req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id } = await params;
  const parsed = z.object({ title: z.string().trim().min(1).max(160) }).safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, 'invalid', 'Give it a title.');
  renameOutput(workspace.id, id, parsed.data.title);
  return Response.json({ ok: true });
});

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id } = await params;
  deleteOutput(workspace.id, id);
  return Response.json({ ok: true });
});
