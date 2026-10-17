import { getDb, json, now } from '@/lib/db';
import { newId } from '@/lib/ids';
import { validate } from '@/lib/ai/schema';
import { HttpError } from '@/lib/security/request';
import type { Brief } from './brief';
import { SECTIONS, SECTION_BY_KEY } from './sections';

export type SectionRow = {
  id: string;
  key: string;
  position: number;
  content: unknown;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  edited: boolean;
  revision: number;
  mode: 'live' | 'preview' | null;
  error: string | null;
  updated_at: string;
};

export type Strategy = {
  id: string;
  workspace_id: string;
  title: string;
  brief: Brief;
  status: 'generating' | 'ready' | 'partial' | 'failed';
  generation_mode: 'live' | 'preview';
  persona_count: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  sections: SectionRow[];
};

type StrategyDbRow = Omit<Strategy, 'brief' | 'sections'> & { brief_snapshot: string };
type SectionDbRow = Omit<SectionRow, 'content' | 'edited'> & { content: string | null; edited: number };

function mapSection(r: SectionDbRow): SectionRow {
  return { ...r, content: json(r.content, null), edited: !!r.edited };
}

/** Every read is scoped by workspace: a strategy id alone is never enough. */
export function getStrategy(workspaceId: string, id: string): Strategy | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM strategies WHERE id=? AND workspace_id=?').get(id, workspaceId) as StrategyDbRow | undefined;
  if (!row) return null;
  const sections = (db.prepare('SELECT * FROM strategy_sections WHERE strategy_id=? ORDER BY position').all(id) as SectionDbRow[]).map(mapSection);
  const { brief_snapshot, ...rest } = row;
  return { ...rest, brief: json<Brief>(brief_snapshot, {}), sections };
}

export function requireStrategy(workspaceId: string, id: string): Strategy {
  const st = getStrategy(workspaceId, id);
  if (!st) throw new HttpError(404, 'not_found', 'That strategy was not found in this workspace.');
  return st;
}

export function listStrategies(workspaceId: string, opts: { q?: string; archived?: boolean } = {}) {
  const db = getDb();
  const where = ['workspace_id = ?', opts.archived ? 'archived_at IS NOT NULL' : 'archived_at IS NULL'];
  const params: unknown[] = [workspaceId];
  if (opts.q?.trim()) {
    where.push('(title LIKE ? ESCAPE \'\\\' OR brief_snapshot LIKE ? ESCAPE \'\\\')');
    const like = `%${opts.q.trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    params.push(like, like);
  }
  return db
    .prepare(
      `SELECT id, title, status, generation_mode, archived_at, created_at, updated_at,
        (SELECT COUNT(*) FROM strategy_sections ss WHERE ss.strategy_id = strategies.id AND ss.status='ready') AS ready_sections
       FROM strategies WHERE ${where.join(' AND ')} ORDER BY updated_at DESC LIMIT 200`,
    )
    .all(...params) as {
    id: string;
    title: string;
    status: Strategy['status'];
    generation_mode: 'live' | 'preview';
    archived_at: string | null;
    created_at: string;
    updated_at: string;
    ready_sections: number;
  }[];
}

export function createStrategyRecord(input: {
  workspaceId: string;
  userId: string;
  profileId: string | null;
  brief: Brief;
  mode: 'live' | 'preview';
  personaCount: number;
}): string {
  const db = getDb();
  const id = newId('stg');
  const ts = now();
  const title = `${input.brief.businessName?.trim() || 'Untitled'} marketing strategy`;
  db.prepare(
    `INSERT INTO strategies (id, workspace_id, business_profile_id, title, brief_snapshot, status, generation_mode, persona_count, created_by, created_at, updated_at)
     VALUES (?,?,?,?,?, 'generating', ?, ?, ?, ?, ?)`,
  ).run(id, input.workspaceId, input.profileId, title, JSON.stringify(input.brief), input.mode, input.personaCount, input.userId, ts, ts);
  const ins = db.prepare(
    `INSERT INTO strategy_sections (id, strategy_id, key, position, status, updated_at) VALUES (?,?,?,?, 'pending', ?)`,
  );
  SECTIONS.forEach((sec, i) => ins.run(newId('sec'), id, sec.key, i, ts));
  return id;
}

export function setSectionStatus(strategyId: string, key: string, status: SectionRow['status'], error: string | null = null) {
  getDb()
    .prepare('UPDATE strategy_sections SET status=?, error=?, updated_at=? WHERE strategy_id=? AND key=?')
    .run(status, error, now(), strategyId, key);
}

export function saveGeneratedSection(strategyId: string, key: string, content: unknown, mode: 'live' | 'preview') {
  const db = getDb();
  const ts = now();
  db.prepare(
    `UPDATE strategy_sections SET content=?, status='ready', edited=0, error=NULL, mode=?, revision=revision+1, updated_at=?
     WHERE strategy_id=? AND key=?`,
  ).run(JSON.stringify(content), mode, ts, strategyId, key);
  db.prepare('UPDATE strategies SET updated_at=? WHERE id=?').run(ts, strategyId);
}

/**
 * Save a user edit. `revision` must match what the editor loaded, so a
 * regeneration or another tab cannot be silently overwritten (and vice versa).
 */
export function saveEditedSection(workspaceId: string, strategyId: string, key: string, content: unknown, revision: number) {
  const def = SECTION_BY_KEY[key];
  if (!def) throw new HttpError(404, 'not_found', 'Unknown section.');
  const st = requireStrategy(workspaceId, strategyId);
  const checked = validate(def.schema({ personaCount: st.persona_count }), content);
  if (!checked.ok) throw new HttpError(422, 'invalid_section', `Some fields need attention: ${checked.errors.slice(0, 3).join('; ')}`);
  const db = getDb();
  const ts = now();
  const res = db
    .prepare(
      `UPDATE strategy_sections SET content=?, edited=1, revision=revision+1, updated_at=?
       WHERE strategy_id=? AND key=? AND revision=? AND status='ready'`,
    )
    .run(JSON.stringify(checked.value), ts, strategyId, key, revision);
  if (res.changes === 0) {
    throw new HttpError(409, 'conflict', 'This section changed since you opened it. Reload to see the latest version before saving.');
  }
  db.prepare('UPDATE strategies SET updated_at=? WHERE id=?').run(ts, strategyId);
  if (key === 'audience') syncPersonas(workspaceId, strategyId, checked.value);
  return requireStrategy(workspaceId, strategyId).sections.find((x) => x.key === key)!;
}

export function finishStrategy(strategyId: string) {
  const db = getDb();
  const counts = db
    .prepare(`SELECT status, COUNT(*) n FROM strategy_sections WHERE strategy_id=? GROUP BY status`)
    .all(strategyId) as { status: string; n: number }[];
  const ready = counts.find((c) => c.status === 'ready')?.n ?? 0;
  const status = ready === SECTIONS.length ? 'ready' : ready === 0 ? 'failed' : 'partial';
  db.prepare('UPDATE strategies SET status=?, updated_at=? WHERE id=?').run(status, now(), strategyId);
  return status;
}

export function snapshot(strategyId: string) {
  const rows = getDb()
    .prepare('SELECT key, content, edited FROM strategy_sections WHERE strategy_id=? ORDER BY position')
    .all(strategyId) as { key: string; content: string | null; edited: number }[];
  return rows.map((r) => ({ key: r.key, content: json(r.content, null), edited: !!r.edited }));
}

export function createVersion(strategyId: string, label: string, userId: string | null) {
  const id = newId('ver');
  getDb()
    .prepare('INSERT INTO strategy_versions (id, strategy_id, label, snapshot, created_by, created_at) VALUES (?,?,?,?,?,?)')
    .run(id, strategyId, label.slice(0, 120), JSON.stringify(snapshot(strategyId)), userId, now());
  return id;
}

export function listVersions(workspaceId: string, strategyId: string) {
  requireStrategy(workspaceId, strategyId);
  return getDb()
    .prepare('SELECT id, label, created_at FROM strategy_versions WHERE strategy_id=? ORDER BY created_at DESC LIMIT 50')
    .all(strategyId) as { id: string; label: string; created_at: string }[];
}

export function restoreVersion(workspaceId: string, strategyId: string, versionId: string, userId: string) {
  requireStrategy(workspaceId, strategyId);
  const db = getDb();
  const v = db.prepare('SELECT snapshot, label FROM strategy_versions WHERE id=? AND strategy_id=?').get(versionId, strategyId) as
    | { snapshot: string; label: string }
    | undefined;
  if (!v) throw new HttpError(404, 'not_found', 'That version was not found.');
  const busy = db.prepare(`SELECT 1 FROM strategy_sections WHERE strategy_id=? AND status='generating'`).get(strategyId);
  if (busy) throw new HttpError(409, 'busy', 'Wait for the current generation to finish before restoring a version.');
  const snap = json<{ key: string; content: unknown; edited: boolean }[]>(v.snapshot, []);
  db.transaction(() => {
    createVersion(strategyId, 'Before restoring an earlier version', userId);
    const ts = now();
    for (const sec of snap) {
      db.prepare(
        `UPDATE strategy_sections SET content=?, status=CASE WHEN ? IS NULL THEN status ELSE 'ready' END, edited=?, revision=revision+1, updated_at=?
         WHERE strategy_id=? AND key=?`,
      ).run(sec.content == null ? null : JSON.stringify(sec.content), sec.content == null ? null : 1, sec.edited ? 1 : 0, ts, strategyId, sec.key);
    }
    db.prepare('UPDATE strategies SET updated_at=? WHERE id=?').run(ts, strategyId);
  })();
  finishStrategy(strategyId);
  const audience = snap.find((x) => x.key === 'audience');
  if (audience?.content) syncPersonas(workspaceId, strategyId, audience.content);
}

export function renameStrategy(workspaceId: string, id: string, title: string) {
  requireStrategy(workspaceId, id);
  const t = title.trim().slice(0, 140);
  if (!t) throw new HttpError(422, 'invalid', 'Give the strategy a name.');
  getDb().prepare('UPDATE strategies SET title=?, updated_at=? WHERE id=? AND workspace_id=?').run(t, now(), id, workspaceId);
}

export function setArchived(workspaceId: string, id: string, archived: boolean) {
  requireStrategy(workspaceId, id);
  getDb()
    .prepare('UPDATE strategies SET archived_at=?, updated_at=? WHERE id=? AND workspace_id=?')
    .run(archived ? now() : null, now(), id, workspaceId);
}

export function deleteStrategy(workspaceId: string, id: string) {
  const st = requireStrategy(workspaceId, id);
  if (st.status === 'generating') throw new HttpError(409, 'busy', 'Wait for generation to finish before deleting.');
  getDb().prepare('DELETE FROM strategies WHERE id=? AND workspace_id=?').run(id, workspaceId);
}

export function duplicateStrategy(workspaceId: string, id: string, userId: string): string {
  const st = requireStrategy(workspaceId, id);
  if (st.status === 'generating') throw new HttpError(409, 'busy', 'Wait for generation to finish before duplicating.');
  const db = getDb();
  const newStrategyId = newId('stg');
  const ts = now();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO strategies (id, workspace_id, business_profile_id, title, brief_snapshot, status, generation_mode, persona_count, created_by, created_at, updated_at)
       SELECT ?, workspace_id, business_profile_id, ?, brief_snapshot, status, generation_mode, persona_count, ?, ?, ? FROM strategies WHERE id=?`,
    ).run(newStrategyId, `${st.title} (copy)`.slice(0, 140), userId, ts, ts, id);
    db.prepare(
      `INSERT INTO strategy_sections (id, strategy_id, key, position, content, status, edited, revision, mode, error, updated_at)
       SELECT 'sec_' || lower(hex(randomblob(9))), ?, key, position, content, status, edited, 0, mode, error, ? FROM strategy_sections WHERE strategy_id=?`,
    ).run(newStrategyId, ts, id);
  })();
  const audience = st.sections.find((x) => x.key === 'audience');
  if (audience?.content) syncPersonas(workspaceId, newStrategyId, audience.content);
  return newStrategyId;
}

/** Keep the Personas library in step with the audience section. */
export function syncPersonas(workspaceId: string, strategyId: string, audienceContent: unknown) {
  const personas = (audienceContent as { personas?: { name?: string }[] } | null)?.personas ?? [];
  const db = getDb();
  const ts = now();
  db.transaction(() => {
    db.prepare('DELETE FROM personas WHERE strategy_id=? AND workspace_id=?').run(strategyId, workspaceId);
    const ins = db.prepare(
      'INSERT INTO personas (id, workspace_id, strategy_id, name, data, created_at, updated_at) VALUES (?,?,?,?,?,?,?)',
    );
    for (const p of personas) ins.run(newId('per'), workspaceId, strategyId, (p.name ?? 'Persona').slice(0, 120), JSON.stringify(p), ts, ts);
  })();
}
