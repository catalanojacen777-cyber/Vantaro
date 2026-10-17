'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Task, TaskStatus } from '@/lib/tasks';
import { api } from '@/lib/client-api';
import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'doing', label: 'In progress' },
  { key: 'done', label: 'Done' },
];

export function PlanBoard({ initial, canEdit }: { initial: Task[]; canEdit: boolean }) {
  const [tasks, setTasks] = useState(initial);
  const [channel, setChannel] = useState<string>('');
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const channels = useMemo(() => Array.from(new Set(tasks.map((t) => t.channel).filter(Boolean))) as string[], [tasks]);
  const visible = tasks.filter((t) => !channel || t.channel === channel);

  async function patch(id: string, body: Record<string, unknown>, message?: string) {
    try {
      const res = await api<{ tasks: Task[] }>(`/api/tasks/${id}`, { method: 'PATCH', body });
      setTasks(res.tasks);
      if (message) setAnnounce(message);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function move(task: Task, status: TaskStatus) {
    if (status === task.status) return;
    if (status === 'done') {
      setJustDone(task.id);
      setTimeout(() => setJustDone(null), 900);
    }
    await patch(task.id, { status }, `${task.title} moved to ${COLUMNS.find((c) => c.key === status)!.label}`);
  }

  async function drop(status: TaskStatus, beforeId: string | null) {
    const id = dragId;
    setDragId(null);
    setOverCol(null);
    if (!id) return;
    try {
      const res = await api<{ tasks: Task[] }>('/api/tasks', { method: 'PATCH', body: { id, status, beforeId } });
      setTasks(res.tasks);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function remove(task: Task) {
    try {
      await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
      setTasks((t) => t.filter((x) => x.id !== task.id));
      toast('Task deleted');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <div>
      <div className="cluster mb-5" style={{ justifyContent: 'space-between' }}>
        <div className="cluster">
          <label htmlFor="ch-filter" className="small muted">Channel</label>
          <select id="ch-filter" className="select" style={{ width: 'auto', minWidth: 180 }} value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">All channels</option>
            {channels.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {canEdit ? <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon.Plus /> Add task</button> : null}
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>
      {tasks.length === 0 ? (
        <div className="empty">
          <h3>Your action plan is empty</h3>
          <p>Open a strategy and choose “Add experiments to action plan” from its menu, or add a task yourself.</p>
          <Link href="/app/strategies" className="btn btn-secondary btn-sm">Go to strategies</Link>
        </div>
      ) : (
        <div className="board">
          {COLUMNS.map((col) => {
            const items = visible.filter((t) => t.status === col.key);
            return (
              <section
                key={col.key}
                className="board-col"
                aria-labelledby={`col-${col.key}`}
                data-over={overCol === col.key}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setOverCol(col.key);
                }}
                onDragLeave={() => setOverCol(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  drop(col.key, null);
                }}
              >
                <h2 id={`col-${col.key}`} className="board-col-title">
                  {col.label} <span className="subtle nums">{items.length}</span>
                </h2>
                <ul className="board-list" role="list">
                  {items.map((t, i) => (
                    <li
                      key={t.id}
                      className="board-card"
                      data-done={justDone === t.id}
                      draggable={canEdit}
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      onDragOver={(e) => {
                        if (dragId && dragId !== t.id) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        drop(col.key, t.id);
                      }}
                      style={dragId === t.id ? { opacity: 0.5 } : undefined}
                    >
                      <div className="cluster" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                        <button className="board-card-title" onClick={() => setEditing(t)} disabled={!canEdit}>
                          {t.status === 'done' ? <Icon.Check className="done-check" /> : null}
                          {t.title}
                        </button>
                        {canEdit ? <Icon.Drag className="drag-handle hide-sm" aria-hidden="true" /> : null}
                      </div>
                      <div className="row-meta mt-2">
                        {t.channel ? <span className="tag">{t.channel}</span> : null}
                        {t.due_date ? <span className={new Date(`${t.due_date}T23:59:59`) < new Date() && t.status !== 'done' ? 'tag tag-danger' : 'tag'}>Due {new Date(`${t.due_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span> : null}
                      </div>
                      {canEdit ? (
                        <div className="board-card-actions">
                          <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Move ${t.title} up`} disabled={i === 0} onClick={() => patch(t.id, { nudge: 'up' }, `${t.title} moved up`)}><Icon.ArrowUp /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Move ${t.title} down`} disabled={i === items.length - 1} onClick={() => patch(t.id, { nudge: 'down' }, `${t.title} moved down`)}><Icon.ArrowDown /></button>
                          <label className="sr-only" htmlFor={`st-${t.id}`}>Status for {t.title}</label>
                          <select id={`st-${t.id}`} className="select select-sm" value={t.status} onChange={(e) => move(t, e.target.value as TaskStatus)}>
                            {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                          </select>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      {editing ? (
        <TaskDialog
          task={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(list) => {
            setTasks(list);
            setEditing(null);
          }}
          onDelete={editing !== 'new' ? () => { remove(editing); setEditing(null); } : undefined}
        />
      ) : null}
    </div>
  );
}

function TaskDialog({ task, onClose, onSaved, onDelete }: { task: Task | null; onClose: () => void; onSaved: (t: Task[]) => void; onDelete?: () => void }) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [detail, setDetail] = useState(task?.detail ?? '');
  const [channel, setChannel] = useState(task?.channel ?? '');
  const [due, setDue] = useState(task?.due_date ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give the task a title.');
      return;
    }
    setPending(true);
    const body = { title, detail: detail || null, channel: channel || null, due_date: due || null };
    try {
      if (task) {
        const res = await api<{ tasks: Task[] }>(`/api/tasks/${task.id}`, { method: 'PATCH', body });
        onSaved(res.tasks);
      } else {
        await api('/api/tasks', { body });
        const res = await api<{ tasks: Task[] }>('/api/tasks');
        onSaved(res.tasks);
      }
      toast(task ? 'Task saved' : 'Task added');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title={task ? 'Edit task' : 'Add a task'} onClose={onClose} wide>
      <form className="stack" style={{ '--stack': '16px' } as React.CSSProperties} onSubmit={save}>
        {error ? <div className="notice notice-danger" role="alert"><Icon.Warning /><span>{error}</span></div> : null}
        <label className="field"><span className="field-label">Title</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required /></label>
        <label className="field"><span className="field-label">Details <span className="optional">Optional</span></span><textarea className="textarea" rows={5} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={2000} /></label>
        <div className="cluster" style={{ alignItems: 'flex-start' }}>
          <label className="field grow"><span className="field-label">Channel <span className="optional">Optional</span></span><input className="input" value={channel} onChange={(e) => setChannel(e.target.value)} maxLength={60} /></label>
          <label className="field grow"><span className="field-label">Due date <span className="optional">Optional</span></span><input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label>
        </div>
        <div className="cluster" style={{ justifyContent: 'space-between' }}>
          {onDelete ? <button type="button" className="btn btn-danger" onClick={onDelete}><Icon.Trash /> Delete</button> : <span />}
          <div className="cluster">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={pending}>{task ? 'Save task' : 'Add task'}</button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
