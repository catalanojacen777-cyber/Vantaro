import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { duplicateStrategy } from '@/lib/strategy/repo';

export const POST = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const { user, workspace } = await requireWorkspace('editor');
  const { id } = await params;
  return Response.json({ id: duplicateStrategy(workspace.id, id, user.id) });
});
