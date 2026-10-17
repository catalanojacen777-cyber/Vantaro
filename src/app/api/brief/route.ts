import { z } from 'zod';
import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { getProfile, saveProfile } from '@/lib/strategy/profile';
import { HttpError, readJson } from '@/lib/security/request';

export const GET = handle(async () => {
  const { workspace } = await requireWorkspace();
  return Response.json({ profile: getProfile(workspace.id) });
});

const body = z.object({ data: z.record(z.string(), z.unknown()), step: z.number().int().min(0).max(10) });

/** Autosave: called as the person types (debounced) and on step changes. */
export const PUT = handle(async (req) => {
  const { workspace } = await requireWorkspace('editor');
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, 'invalid', 'The brief could not be saved.');
  const profile = saveProfile(workspace.id, parsed.data.data, parsed.data.step);
  return Response.json({ profile });
});
