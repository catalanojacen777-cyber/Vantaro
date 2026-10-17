import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { saveEditedSection } from '@/lib/strategy/repo';
import { HttpError, readJson } from '@/lib/security/request';

const body = z.object({ content: z.unknown(), revision: z.number().int().min(0) });

export const PUT = handle<{ params: Promise<{ id: string; key: string }> }>(async (req, { params }) => {
  const { workspace } = await requireWorkspace('editor');
  const { id, key } = await params;
  const parsed = body.safeParse(await readJson(req, 200_000));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'Invalid section content.');
  const section = saveEditedSection(workspace.id, id, key, parsed.data.content, parsed.data.revision);
  return Response.json({ section });
});
