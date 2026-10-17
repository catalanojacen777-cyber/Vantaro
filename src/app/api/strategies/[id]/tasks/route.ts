import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { tasksFromStrategy } from '@/lib/tasks';

export const POST = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id } = await params;
  return Response.json(tasksFromStrategy(workspace.id, id));
});
