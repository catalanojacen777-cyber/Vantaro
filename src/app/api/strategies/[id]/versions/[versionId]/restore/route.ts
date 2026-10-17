import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { requireStrategy, restoreVersion } from '@/lib/strategy/repo';

export const POST = handle<{ params: Promise<{ id: string; versionId: string }> }>(async (_req, { params }) => {
  const { user, workspace } = await requireWorkspace('editor');
  const { id, versionId } = await params;
  restoreVersion(workspace.id, id, versionId, user.id);
  return Response.json({ strategy: requireStrategy(workspace.id, id) });
});
