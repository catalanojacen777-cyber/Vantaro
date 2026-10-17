import { getDb, json, now } from '@/lib/db';
import { newId } from '@/lib/ids';
import { HttpError } from '@/lib/security/request';

export type SavedOutput = {
  id: string;
  tool_slug: string;
  title: string;
  input: Record<string, unknown>;
  output: unknown;
  mode: 'live' | 'preview' | 'calculated';
  created_at: string;
};

type Row = Omit<SavedOutput, 'input' | 'output'> & { input: string; output: string };

export function listOutputs(workspaceId: string, opts: { q?: string; tool?: string; limit?: number } = {}) {
  const where = ['workspace_id = ?'];
  const params: unknown[] = [workspaceId];
  if (opts.tool) {
    where.push('tool_slug = ?');
    params.push(opts.tool);
  }
  if (opts.q?.trim()) {
    where.push(`(title LIKE ? ESCAPE '\\' OR output LIKE ? ESCAPE '\\')`);
    const like = `%${opts.q.trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    params.push(like, like);
  }
  return getDb()
    .prepare(`SELECT id, tool_slug, title, mode, created_at FROM outputs WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ?`)
    .all(...params, Math.min(opts.limit ?? 200, 200)) as Pick<SavedOutput, 'id' | 'tool_slug' | 'title' | 'mode' | 'created_at'>[];
}

export function getOutput(workspaceId: string, id: string): SavedOutput | null {
  const row = getDb().prepare('SELECT id, tool_slug, title, input, output, mode, created_at FROM outputs WHERE id=? AND workspace_id=?').get(id, workspaceId) as Row | undefined;
  return row ? { ...row, input: json(row.input, {}), output: json(row.output, null) } : null;
}

export function saveOutput(input: {
  workspaceId: string;
  userId: string;
  toolSlug: string;
  title: string;
  values: Record<string, unknown>;
  output: unknown;
  mode: SavedOutput['mode'];
  jobId: string | null;
}): string {
  const id = newId('out');
  getDb()
    .prepare('INSERT INTO outputs (id, workspace_id, tool_slug, title, input, output, mode, job_id, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, input.workspaceId, input.toolSlug, input.title.slice(0, 160), JSON.stringify(input.values), JSON.stringify(input.output), input.mode, input.jobId, input.userId, now());
  return id;
}

export function deleteOutput(workspaceId: string, id: string) {
  const res = getDb().prepare('DELETE FROM outputs WHERE id=? AND workspace_id=?').run(id, workspaceId);
  if (!res.changes) throw new HttpError(404, 'not_found', 'That saved output was not found.');
}

export function renameOutput(workspaceId: string, id: string, title: string) {
  const res = getDb().prepare('UPDATE outputs SET title=? WHERE id=? AND workspace_id=?').run(title.slice(0, 160), id, workspaceId);
  if (!res.changes) throw new HttpError(404, 'not_found', 'That saved output was not found.');
}
