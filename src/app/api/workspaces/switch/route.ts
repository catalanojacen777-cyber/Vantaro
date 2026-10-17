import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireUser, setWorkspaceCookie, workspaceAccess } from '@/lib/auth/session';
import { HttpError, readJson } from '@/lib/security/request';

const body = z.object({ workspaceId: z.string().max(40) });

export const POST = handle(async (req) => {
  const user = await requireUser();
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Choose a workspace.');
  if (!workspaceAccess(user.id, parsed.data.workspaceId)) throw new HttpError(404, 'not_found', 'Workspace not found.');
  await setWorkspaceCookie(parsed.data.workspaceId);
  return Response.json({ ok: true });
});
