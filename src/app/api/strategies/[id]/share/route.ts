import { z } from 'zod';
import { absoluteUrl } from '@/config/site';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { createShare, listShares } from '@/lib/shares';
import { HttpError, readJson } from '@/lib/security/request';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  return Response.json({ shares: listShares(workspace.id, id) });
});

const body = z.object({ expiresInDays: z.union([z.literal(7), z.literal(30), z.literal(90), z.null()]) });

export const POST = handle<Ctx>(async (req, { params }) => {
  const { user, workspace } = await requireWorkspace('editor');
  const { id } = await params;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Choose when the link should expire.');
  const share = createShare(workspace.id, id, user.id, parsed.data.expiresInDays);
  return Response.json({ id: share.id, url: absoluteUrl(`/share/${share.token}`), expiresAt: share.expiresAt });
});
