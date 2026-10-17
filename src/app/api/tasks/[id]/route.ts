import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { deleteTask, listTasks, nudgeTask, taskInput, updateTask } from '@/lib/tasks';
import { HttpError, readJson } from '@/lib/security/request';

type Ctx = { params: Promise<{ id: string }> };
const patch = taskInput.partial().extend({ nudge: z.enum(['up', 'down']).optional() });

export const PATCH = handle<Ctx>(async (req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id } = await params;
  const parsed = patch.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, 'invalid', parsed.error.issues[0]?.message ?? 'Check the task details.');
  const { nudge, ...rest } = parsed.data;
  if (nudge) return Response.json({ tasks: nudgeTask(workspace.id, id, nudge) });
  updateTask(workspace.id, id, rest);
  return Response.json({ tasks: listTasks(workspace.id) });
});

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id } = await params;
  deleteTask(workspace.id, id);
  return Response.json({ ok: true });
});
