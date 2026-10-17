import { z } from 'zod';
import { getDb, now } from '@/lib/db';
import { newId } from '@/lib/ids';
import { HttpError } from '@/lib/security/request';
import { requireStrategy } from '@/lib/strategy/repo';

export type TaskStatus = 'todo' | 'doing' | 'done';
export type Task = {
  id: string;
  strategy_id: string | null;
  title: string;
  detail: string | null;
  channel: string | null;
  status: TaskStatus;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export const taskInput = z.object({
  title: z.string().trim().min(1, 'Give the task a title.').max(200),
  detail: z.string().trim().max(2000).nullable().optional(),
  channel: z.string().trim().max(60).nullable().optional(),
  status: z.enum(['todo', 'doing', 'done']).optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date.')
    .nullable()
    .optional(),
});

export function listTasks(workspaceId: string): Task[] {
  return getDb().prepare('SELECT * FROM tasks WHERE workspace_id=? ORDER BY status, position').all(workspaceId) as Task[];
}

function nextPosition(workspaceId: string, status: TaskStatus): number {
  const row = getDb().prepare('SELECT MAX(position) AS p FROM tasks WHERE workspace_id=? AND status=?').get(workspaceId, status) as { p: number | null };
  return (row.p ?? 0) + 1024;
}

export function createTask(workspaceId: string, input: z.infer<typeof taskInput> & { strategy_id?: string | null }): Task {
  const id = newId('tsk');
  const ts = now();
  const status = input.status ?? 'todo';
  getDb()
    .prepare(
      `INSERT INTO tasks (id, workspace_id, strategy_id, title, detail, channel, status, due_date, position, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(id, workspaceId, input.strategy_id ?? null, input.title, input.detail ?? null, input.channel ?? null, status, input.due_date ?? null, nextPosition(workspaceId, status), ts, ts);
  return getTask(workspaceId, id);
}

export function getTask(workspaceId: string, id: string): Task {
  const t = getDb().prepare('SELECT * FROM tasks WHERE id=? AND workspace_id=?').get(id, workspaceId) as Task | undefined;
  if (!t) throw new HttpError(404, 'not_found', 'That task was not found.');
  return t;
}

export function updateTask(workspaceId: string, id: string, patch: Partial<z.infer<typeof taskInput>>): Task {
  const current = getTask(workspaceId, id);
  const next = { ...current, ...patch };
  const movedColumn = patch.status && patch.status !== current.status;
  getDb()
    .prepare('UPDATE tasks SET title=?, detail=?, channel=?, status=?, due_date=?, position=?, updated_at=? WHERE id=? AND workspace_id=?')
    .run(
      next.title,
      next.detail ?? null,
      next.channel ?? null,
      next.status,
      next.due_date ?? null,
      movedColumn ? nextPosition(workspaceId, next.status) : current.position,
      now(),
      id,
      workspaceId,
    );
  return getTask(workspaceId, id);
}

/** Move one step up or down within its column (keyboard-accessible reordering). */
export function nudgeTask(workspaceId: string, id: string, direction: 'up' | 'down'): Task[] {
  const t = getTask(workspaceId, id);
  const db = getDb();
  const neighbor = db
    .prepare(
      direction === 'up'
        ? 'SELECT id, position FROM tasks WHERE workspace_id=? AND status=? AND position < ? ORDER BY position DESC LIMIT 1'
        : 'SELECT id, position FROM tasks WHERE workspace_id=? AND status=? AND position > ? ORDER BY position ASC LIMIT 1',
    )
    .get(workspaceId, t.status, t.position) as { id: string; position: number } | undefined;
  if (neighbor) {
    db.transaction(() => {
      db.prepare('UPDATE tasks SET position=?, updated_at=? WHERE id=?').run(neighbor.position, now(), t.id);
      db.prepare('UPDATE tasks SET position=?, updated_at=? WHERE id=?').run(t.position, now(), neighbor.id);
    })();
  }
  return listTasks(workspaceId);
}

/** Place a task into a column before another task (drag and drop), or at the end. */
export function placeTask(workspaceId: string, id: string, status: TaskStatus, beforeId: string | null): Task[] {
  getTask(workspaceId, id);
  const db = getDb();
  let position: number;
  if (beforeId) {
    const before = getTask(workspaceId, beforeId);
    const prev = db
      .prepare('SELECT position FROM tasks WHERE workspace_id=? AND status=? AND position < ? AND id != ? ORDER BY position DESC LIMIT 1')
      .get(workspaceId, before.status, before.position, id) as { position: number } | undefined;
    position = prev ? (prev.position + before.position) / 2 : before.position - 1024;
  } else {
    position = nextPosition(workspaceId, status);
  }
  db.prepare('UPDATE tasks SET status=?, position=?, updated_at=? WHERE id=? AND workspace_id=?').run(status, position, now(), id, workspaceId);
  return listTasks(workspaceId);
}

export function deleteTask(workspaceId: string, id: string) {
  getTask(workspaceId, id);
  getDb().prepare('DELETE FROM tasks WHERE id=? AND workspace_id=?').run(id, workspaceId);
}

type Experiment = { title: string; channel?: string; reason?: string; test_metric?: string; success_signal?: string; timeframe?: string; priority?: string };

/** Turn the strategy's experiments into tasks, skipping ones already added. */
export function tasksFromStrategy(workspaceId: string, strategyId: string): { added: number } {
  const st = requireStrategy(workspaceId, strategyId);
  const actions = st.sections.find((s) => s.key === 'actions');
  const experiments = ((actions?.content as { experiments?: Experiment[] } | null)?.experiments ?? []).filter((e) => e?.title);
  if (!experiments.length) throw new HttpError(422, 'no_actions', 'This strategy has no action plan yet.');
  const existing = new Set(
    (getDb().prepare('SELECT title FROM tasks WHERE workspace_id=? AND strategy_id=?').all(workspaceId, strategyId) as { title: string }[]).map((r) => r.title),
  );
  let added = 0;
  for (const e of experiments) {
    if (existing.has(e.title)) continue;
    const detail = [
      e.reason,
      e.test_metric ? `Measure: ${e.test_metric}` : null,
      e.success_signal ? `Keep going if: ${e.success_signal}` : null,
      e.timeframe ? `Run for: ${e.timeframe}` : null,
      e.priority ? `Priority: ${e.priority}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    createTask(workspaceId, { title: e.title.slice(0, 200), detail: detail.slice(0, 2000), channel: e.channel?.slice(0, 60) ?? null, strategy_id: strategyId });
    added++;
  }
  return { added };
}
