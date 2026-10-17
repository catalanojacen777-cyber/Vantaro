import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { applyRevision } from '@/lib/strategy/assistant';

export const POST = handle<{ params: Promise<{ id: string; messageId: string }> }>(async (_req, { params }) => {
  const { user, workspace } = await requireWorkspace('editor');
  const { id, messageId } = await params;
  return Response.json(applyRevision(workspace.id, id, messageId, user.id));
});
