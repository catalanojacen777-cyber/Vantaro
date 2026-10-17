import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { createTask, listTasks, placeTask, taskInput } from '@/lib/tasks';
import { HttpError, readJson } from '@/lib/security/request';

export const GET = handle(async () => {
  const { workspace } = await requireWorkspace();
  return Response.json({ tasks: listTasks(workspace.id) });
});

export const POST = handle(async (req) => {
  const { workspace } = await requireWorkspace('editor');
  const parsed = taskInput.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, 'invalid', parsed.error.issues[0]?.message ?? 'Check the task details.');
  return Response.json({ task: createTask(workspace.id, parsed.data) });
});

const place = z.object({ id: z.string().max(40), status: z.enum(['todo', 'doing', 'done']), beforeId: z.string().max(40).nullable() });

/** Drag-and-drop placement. */
export const PATCH = handle(async (req) => {
  const { workspace } = await requireWorkspace('editor');
  const parsed = place.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Invalid move.');
  return Response.json({ tasks: placeTask(workspace.id, parsed.data.id, parsed.data.status, parsed.data.beforeId) });
});
