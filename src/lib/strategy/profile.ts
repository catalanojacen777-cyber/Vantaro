import { getDb, json, now } from '@/lib/db';
import { newId } from '@/lib/ids';
import { HttpError } from '@/lib/security/request';
import { briefDraftSchema, missingRequired, type Brief } from './brief';

export type Profile = { id: string; data: Brief; status: 'draft' | 'complete'; step: number; updated_at: string };

export function getProfile(workspaceId: string): Profile | null {
  const row = getDb()
    .prepare('SELECT id, data, status, step, updated_at FROM business_profiles WHERE workspace_id=? ORDER BY created_at LIMIT 1')
    .get(workspaceId) as (Omit<Profile, 'data'> & { data: string }) | undefined;
  return row ? { ...row, data: json<Brief>(row.data, {}) } : null;
}

export function saveProfile(workspaceId: string, raw: unknown, step: number): Profile {
  const parsed = briefDraftSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new HttpError(422, 'invalid_brief', `Check "${first.path.join('.') || 'brief'}": ${first.message}`);
  }
  // Drop empty strings so "skipped" and "blank" mean the same thing.
  const data: Brief = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => !(typeof v === 'string' && v.trim() === '') && v !== undefined),
  ) as Brief;
  const status = missingRequired(data).length === 0 ? 'complete' : 'draft';
  const db = getDb();
  const existing = getProfile(workspaceId);
  const ts = now();
  const safeStep = Math.max(0, Math.min(10, Math.floor(step) || 0));
  if (existing) {
    db.prepare('UPDATE business_profiles SET data=?, status=?, step=?, updated_at=? WHERE id=?').run(JSON.stringify(data), status, safeStep, ts, existing.id);
    return { id: existing.id, data, status, step: safeStep, updated_at: ts };
  }
  const id = newId('bp');
  db.prepare('INSERT INTO business_profiles (id, workspace_id, data, status, step, created_at, updated_at) VALUES (?,?,?,?,?,?,?)').run(
    id,
    workspaceId,
    JSON.stringify(data),
    status,
    safeStep,
    ts,
    ts,
  );
  return { id, data, status, step: safeStep, updated_at: ts };
}
