import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireUser, workspaceAccess } from '@/lib/auth/session';
import { getDb, now } from '@/lib/db';
import { HttpError, readJson } from '@/lib/security/request';

const body = z.object({ name: z.string().trim().min(1).max(80) });

export const PATCH = handle<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const access = workspaceAccess(user.id, id);
  if (!access) throw new HttpError(404, 'not_found', 'Workspace not found.');
  if (access.role !== 'owner') throw new HttpError(403, 'forbidden', 'Only the owner can rename this workspace.');
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, 'invalid', 'Give the workspace a name.');
  getDb().prepare('UPDATE workspaces SET name=?, updated_at=? WHERE id=?').run(parsed.data.name, now(), id);
  return Response.json({ ok: true });
});
