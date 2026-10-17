import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { revokeShare } from '@/lib/shares';

export const DELETE = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id } = await params;
  revokeShare(workspace.id, id);
  return Response.json({ ok: true });
});
