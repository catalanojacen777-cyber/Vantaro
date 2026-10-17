'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SectionRow, Strategy } from '@/lib/strategy/repo';
import { personaView, SECTIONS, type SectionDef } from '@/lib/strategy/sections';
import { toPlainText } from '@/lib/view';
import { api, ApiError, idempotencyKey } from '@/lib/client-api';
import { StructuredView } from '@/components/ui/structured-view';
import { StructuredEditor } from '@/components/ui/structured-editor';
import { Dialog } from '@/components/ui/dialog';
import { MenuButton } from '@/components/ui/menu-button';
import { Icon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';
import { CopyButton } from '@/components/ui/copy-button';
import { ShareDialog } from './share-dialog';
import { VersionsDialog } from './versions-dialog';
import { AssistantPanel } from './assistant-panel';

type Progress = { step: number; total: number; label: string } | null;
type JobInfo = { id: string; status: string; progress: Progress; error: { code: string; message: string } | null; kind: string; sectionKey: string | null };

export function StrategyWorkspace({
  initial,
  activeJobId,
  canEdit,
  aiMode,
}: {
  initial: Strategy;
  activeJobId: string | null;
  canEdit: boolean;
  aiMode: 'live' | 'preview' | 'unavailable';
}) {
  const router = useRouter();
  const [st, setSt] = useState(initial);
  const [jobId, setJobId] = useState<string | null>(activeJobId);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [dialog, setDialog] = useState<null | 'share' | 'versions' | 'delete' | 'rename' | 'assist'>(null);
  const [dirtySections, setDirtySections] = useState<Set<string>>(new Set());
  const [activeKey, setActiveKey] = useState(SECTIONS[0].key);
  const busy = !!jobId || st.sections.some((s) => s.status === 'generating');

  const refresh = useCallback(async () => {
    const res = await api<{ strategy: Strategy }>(`/api/strategies/${st.id}`);
    setSt(res.strategy);
    return res.strategy;
  }, [st.id]);

  // Poll the job while one is running. Status comes from the server, so a
  // reload or a second tab shows the same progress.
  useEffect(() => {
    if (!jobId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const { job: j } = await api<{ job: JobInfo }>(`/api/jobs/${jobId}`);
        if (stopped) return;
        setJob(j);
        await refresh();
        if (['succeeded', 'failed', 'cancelled'].includes(j.status)) {
          setJobId(null);
          if (j.status === 'succeeded') toast(j.kind === 'section' ? 'Section regenerated' : 'Strategy ready');
          else if (j.status === 'cancelled') toast('Generation cancelled');
          else toast(j.error?.message ?? 'Generation failed', 'error');
          router.refresh();
          return;
        }
      } catch {
        // transient; keep polling
      }
      timer = setTimeout(tick, 1200);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [jobId, refresh, router]);

  // Warn before leaving with unsaved section edits.
  useEffect(() => {
    if (!dirtySections.size) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, [dirtySections.size]);

  // Highlight the section in view.
  useEffect(() => {
    const els = SECTIONS.map((d) => document.getElementById(`sec-${d.key}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveKey(visible[0].target.id.replace('sec-', ''));
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const setDirty = useCallback((key: string, dirty: boolean) => {
    setDirtySections((prev) => {
      const next = new Set(prev);
      if (dirty) next.add(key);
      else next.delete(key);
      return next.size === prev.size && [...next].every((k) => prev.has(k)) ? prev : next;
    });
  }, []);

  async function regenerate(key: string, confirmOverwrite: boolean) {
    try {
      const res = await api<{ jobId: string }>(`/api/strategies/${st.id}/sections/${key}/regenerate`, {
        body: { idempotencyKey: idempotencyKey(), confirmOverwrite },
      });
      setSt((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.key === key ? { ...s, status: 'generating' } : s)) }));
      setJobId(res.jobId);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function cancel() {
    if (!jobId) return;
    try {
      await api(`/api/jobs/${jobId}/cancel`, { body: {} });
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function patch(body: Record<string, unknown>, ok: string) {
    try {
      const res = await api<{ strategy: Strategy }>(`/api/strategies/${st.id}`, { method: 'PATCH', body });
      setSt(res.strategy);
      toast(ok);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function duplicate() {
    try {
      const res = await api<{ id: string }>(`/api/strategies/${st.id}/duplicate`, { body: {} });
      toast('Strategy duplicated');
      router.push(`/app/strategies/${res.id}`);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function addTasks() {
    try {
      const res = await api<{ added: number }>(`/api/strategies/${st.id}/tasks`, { body: {} });
      toast(res.added ? `Added ${res.added} ${res.added === 1 ? 'task' : 'tasks'} to your action plan` : 'These experiments are already in your action plan');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const ready = st.sections.filter((s) => s.status === 'ready').length;
  const hasPreview = st.sections.some((s) => s.mode === 'preview');
  const progress = job?.progress ?? null;

  return (
    <div className="strategy">
      <header className="strategy-head">
        <nav aria-label="Breadcrumb">
          <ol className="crumbs" role="list">
            <li className="cluster" style={{ '--gap': '6px' } as React.CSSProperties}>
              <Link href="/app/strategies">Strategies</Link>
              <Icon.ChevronRight />
            </li>
          </ol>
        </nav>
        <div className="strategy-title-row">
          <h1>{st.title}</h1>
          <div className="cluster">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setDialog('assist')}
              disabled={ready === 0}
              title={ready === 0 ? 'Available once a section is ready' : 'Ask about this strategy or draft a revision'}
            >
              <Icon.Sparkle /> Ask
            </button>
            {canEdit ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setDialog('share')} disabled={ready === 0}>
                <Icon.Share /> Share
              </button>
            ) : null}
            <MenuButton
              label={
                <>
                  <Icon.Download /> Export
                </>
              }
              items={[
                { label: 'Download Markdown', icon: <Icon.Download />, onSelect: () => (window.location.href = `/api/strategies/${st.id}/export`), disabled: ready === 0 },
                { label: 'Print or save as PDF', icon: <Icon.Print />, onSelect: () => window.open(`/app/strategies/${st.id}/print`, '_blank', 'noopener'), disabled: ready === 0 },
              ]}
            />
            {canEdit ? (
              <MenuButton
                ariaLabel="More actions"
                label={<span aria-hidden="true">•••</span>}
                buttonClass="btn btn-secondary btn-sm btn-icon"
                items={[
                  { label: 'Rename', icon: <Icon.Edit />, onSelect: () => setDialog('rename') },
                  { label: 'Versions', icon: <Icon.History />, onSelect: () => setDialog('versions') },
                  { label: 'Add experiments to action plan', icon: <Icon.List />, onSelect: addTasks, disabled: busy },
                  { label: 'Duplicate', icon: <Icon.Duplicate />, onSelect: duplicate, disabled: busy },
                  st.archived_at
                    ? { label: 'Restore from archive', icon: <Icon.Archive />, onSelect: () => patch({ archived: false }, 'Strategy restored') }
                    : { label: 'Archive', icon: <Icon.Archive />, onSelect: () => patch({ archived: true }, 'Strategy archived') },
                  'sep',
                  { label: 'Delete', icon: <Icon.Trash />, onSelect: () => setDialog('delete'), danger: true, disabled: busy },
                ]}
              />
            ) : null}
          </div>
        </div>
        <div className="cluster small muted" style={{ '--gap': '10px' } as React.CSSProperties}>
          <span>
            {ready} of {SECTIONS.length} sections ready
          </span>
          {st.archived_at ? <span className="tag">Archived</span> : null}
          {st.status === 'partial' && !busy ? <span className="tag tag-warn">Some sections need regenerating</span> : null}
          {hasPreview ? (
            <span className="tag tag-warn" title="Generated without an AI provider. Placeholder text only.">
              <span className="dot" /> Preview output
            </span>
          ) : null}
        </div>
      </header>

      {busy ? (
        <div className="gen-status panel" role="status" aria-live="polite">
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <div className="cluster">
              <span className="spinner" aria-hidden="true" />
              <span>
                {progress ? (
                  <>
                    {progress.label}
                    {progress.total > 1 ? (
                      <span className="muted">
                        {' '}
                        (section {progress.step} of {progress.total})
                      </span>
                    ) : null}
                  </>
                ) : (
                  'Starting'
                )}
              </span>
            </div>
            {jobId ? (
              <button className="btn btn-ghost btn-sm" onClick={cancel}>
                <Icon.Stop /> Cancel
              </button>
            ) : null}
          </div>
          {progress && progress.total > 1 ? (
            <div className="meter mt-3" aria-hidden="true">
              <span style={{ width: `${((progress.step - 1) / progress.total) * 100}%` }} />
            </div>
          ) : null}
          <p className="xs subtle mt-2">You can leave this page. Generation continues and finished sections are saved as they complete.</p>
        </div>
      ) : null}

      {hasPreview && !busy ? (
        <div className="notice notice-warn mb-6">
          <Icon.Info />
          <span>
            <strong>This is preview output.</strong> It was created without an AI provider and contains placeholder text in the right structure.
            {aiMode === 'live' ? ' An AI provider is now connected: regenerate sections to replace it.' : ' Connect an AI provider to generate real content.'}
          </span>
        </div>
      ) : null}

      <div className="strategy-body">
        <nav className="strategy-toc" aria-label="Sections">
          <ol role="list">
            {SECTIONS.map((def) => {
              const sec = st.sections.find((s) => s.key === def.key);
              return (
                <li key={def.key}>
                  <a href={`#sec-${def.key}`} aria-current={activeKey === def.key ? 'location' : undefined} data-status={sec?.status}>
                    <span className="toc-dot" aria-hidden="true" />
                    {def.title}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="strategy-sections">
          {SECTIONS.map((def) => {
            const sec = st.sections.find((s) => s.key === def.key)!;
            return (
              <SectionPanel
                key={def.key}
                def={def}
                section={sec}
                strategyId={st.id}
                personaCount={st.persona_count}
                canEdit={canEdit}
                locked={busy}
                onSaved={(updated) => setSt((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.key === updated.key ? updated : s)) }))}
                onRegenerate={regenerate}
                onDirty={setDirty}
                onReload={refresh}
              />
            );
          })}
        </div>
      </div>

      {dialog === 'assist' ? (
        <AssistantPanel
          strategyId={st.id}
          sections={st.sections}
          initialSection={activeKey}
          canEdit={canEdit}
          aiMode={aiMode}
          dirtySections={dirtySections}
          onApplied={(updated) => setSt((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.key === updated.key ? updated : s)) }))}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'share' ? <ShareDialog strategyId={st.id} onClose={() => setDialog(null)} /> : null}
      {dialog === 'versions' ? (
        <VersionsDialog
          strategyId={st.id}
          onClose={() => setDialog(null)}
          onRestored={(s) => {
            setSt(s);
            setDialog(null);
            toast('Version restored');
          }}
          busy={busy || dirtySections.size > 0}
        />
      ) : null}
      {dialog === 'rename' ? <RenameDialog title={st.title} onClose={() => setDialog(null)} onSave={(title) => patch({ title }, 'Renamed').then(() => setDialog(null))} /> : null}
      {dialog === 'delete' ? (
        <Dialog
          title="Delete this strategy?"
          description="This permanently deletes the strategy, its versions and its share links. Tasks you added to the action plan stay. This cannot be undone."
          onClose={() => setDialog(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDialog(null)}>
                Keep it
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await api(`/api/strategies/${st.id}`, { method: 'DELETE' });
                    toast('Strategy deleted');
                    router.replace('/app/strategies');
                    router.refresh();
                  } catch (err) {
                    toast((err as Error).message, 'error');
                  }
                }}
              >
                <Icon.Trash /> Delete strategy
              </button>
            </>
          }
        />
      ) : null}
    </div>
  );
}

function RenameDialog({ title, onClose, onSave }: { title: string; onClose: () => void; onSave: (t: string) => void }) {
  const [value, setValue] = useState(title);
  return (
    <Dialog title="Rename strategy" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSave(value.trim());
        }}
        className="stack"
      >
        <label className="field">
          <span className="field-label">Name</span>
          <input className="input" value={value} onChange={(e) => setValue(e.target.value)} maxLength={140} required />
        </label>
        <div className="cluster" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!value.trim()}>
            Save name
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function SectionPanel({
  def,
  section,
  strategyId,
  personaCount,
  canEdit,
  locked,
  onSaved,
  onRegenerate,
  onDirty,
  onReload,
}: {
  def: SectionDef;
  section: SectionRow;
  strategyId: string;
  personaCount: number;
  canEdit: boolean;
  locked: boolean;
  onSaved: (s: SectionRow) => void;
  onRegenerate: (key: string, confirm: boolean) => void;
  onDirty: (key: string, dirty: boolean) => void;
  onReload: () => Promise<Strategy>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<unknown>(null);
  const [baseRevision, setBaseRevision] = useState(section.revision);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; conflict?: boolean } | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [persona, setPersona] = useState(0);
  const changed = editing && JSON.stringify(draft) !== JSON.stringify(section.content);
  const prevStatus = useRef(section.status);
  const [justArrived, setJustArrived] = useState(false);

  useEffect(() => onDirty(def.key, changed), [changed, def.key, onDirty]);
  useEffect(() => {
    if (prevStatus.current !== 'ready' && section.status === 'ready') setJustArrived(true);
    prevStatus.current = section.status;
  }, [section.status]);

  function startEdit() {
    setDraft(structuredClone(section.content));
    setBaseRevision(section.revision);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ section: SectionRow }>(`/api/strategies/${strategyId}/sections/${def.key}`, {
        method: 'PUT',
        body: { content: draft, revision: baseRevision },
      });
      onSaved(res.section);
      setEditing(false);
      toast(`${def.title} saved`);
    } catch (err) {
      setError({ message: (err as Error).message, conflict: err instanceof ApiError && err.status === 409 });
    } finally {
      setSaving(false);
    }
  }

  const content = section.content as Record<string, unknown> | null;
  const personas = def.key === 'audience' ? ((content?.personas as Record<string, unknown>[] | undefined) ?? []) : [];

  return (
    <section id={`sec-${def.key}`} className="strategy-section panel" aria-labelledby={`h-${def.key}`} data-status={section.status}>
      <header className="sec-head">
        <div style={{ minWidth: 0 }}>
          <h2 id={`h-${def.key}`}>{def.title}</h2>
          <p className="small muted">{def.summary}</p>
        </div>
        <div className="cluster section-tools">
          {section.edited ? <span className="tag">Edited</span> : null}
          {section.status === 'ready' && !editing ? (
            <>
              <CopyButton text={() => toPlainText(def.view, section.content)} label={`Copy ${def.title}`} />
              {canEdit ? (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={startEdit} disabled={locked}>
                    <Icon.Edit /> Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => (section.edited ? setConfirmRegen(true) : onRegenerate(def.key, false))}
                    disabled={locked}
                  >
                    <Icon.Refresh /> Regenerate
                  </button>
                </>
              ) : null}
            </>
          ) : null}
          {section.status === 'failed' && canEdit ? (
            <button className="btn btn-secondary btn-sm" onClick={() => onRegenerate(def.key, false)} disabled={locked}>
              <Icon.Refresh /> Try again
            </button>
          ) : null}
        </div>
      </header>

      {section.status === 'generating' || (section.status === 'pending' && locked) ? (
        <div className="section-skeleton" aria-hidden="true">
          <div className="skeleton" style={{ height: 14, width: '72%' }} />
          <div className="skeleton" style={{ height: 14, width: '88%' }} />
          <div className="skeleton" style={{ height: 14, width: '54%' }} />
          <p className="xs subtle">{section.status === 'generating' ? 'Writing this section…' : 'Queued'}</p>
        </div>
      ) : null}

      {section.status === 'failed' ? (
        <div className="notice notice-danger">
          <Icon.Warning />
          <span>{section.error ?? 'This section could not be generated.'} Nothing was charged for it.</span>
        </div>
      ) : null}

      {section.status === 'ready' && !editing ? (
        <div className={justArrived ? 'fade-in' : undefined}>
          <StructuredView view={def.view} data={section.content} />
          {personas.length ? (
            <div className="persona-switch mt-6">
              <h3 className="sv-label">Personas</h3>
              <div className="tabs mt-3" role="tablist" aria-label="Personas">
                {personas.map((p, i) => (
                  <button
                    key={i}
                    role="tab"
                    id={`ptab-${i}`}
                    aria-selected={persona === i}
                    aria-controls={`ppanel-${i}`}
                    tabIndex={persona === i ? 0 : -1}
                    className="tab"
                    onClick={() => setPersona(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') setPersona((persona + 1) % personas.length);
                      if (e.key === 'ArrowLeft') setPersona((persona - 1 + personas.length) % personas.length);
                    }}
                  >
                    {String(p.name ?? `Persona ${i + 1}`)}
                  </button>
                ))}
              </div>
              <div role="tabpanel" id={`ppanel-${persona}`} aria-labelledby={`ptab-${persona}`} className="persona-card fade-in" key={persona}>
                <div className="cluster" style={{ justifyContent: 'space-between' }}>
                  <strong className="sv-card-title" style={{ fontSize: '1.125rem' }}>
                    {String(personas[persona]?.name ?? '')}
                  </strong>
                  <span className={`tag ${personas[persona]?.basis === 'provided' ? 'tag-ok' : 'tag-warn'}`}>
                    {personas[persona]?.basis === 'provided' ? 'From your brief' : 'Hypothesis'}
                  </span>
                </div>
                <div className="mt-4">
                  <StructuredView view={personaView} data={personas[persona]} headingLevel={4} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {editing ? (
        <div className="section-editor">
          {error ? (
            <div className="notice notice-danger mb-5" role="alert">
              <Icon.Warning />
              <span>
                {error.message}{' '}
                {error.conflict ? (
                  <button
                    className="text-link"
                    onClick={async () => {
                      await onReload();
                      setEditing(false);
                    }}
                  >
                    Discard my changes and load the latest
                  </button>
                ) : null}
              </span>
            </div>
          ) : null}
          <StructuredEditor schema={def.schema({ personaCount })} value={draft} onChange={setDraft} />
          <div className="editor-bar">
            <span className="xs subtle">{changed ? 'Unsaved changes' : 'No changes yet'}</span>
            <div className="cluster">
              <button className="btn btn-ghost" onClick={() => setEditing(false)} disabled={saving}>
                {changed ? 'Discard changes' : 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !changed} aria-busy={saving}>
                {saving ? <span className="spinner" aria-hidden="true" /> : <Icon.Save />} Save section
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmRegen ? (
        <Dialog
          title={`Regenerate ${def.title.toLowerCase()}?`}
          description="This section has your edits. Regenerating replaces them with a fresh draft. A version is saved first, so you can restore your edits from Versions."
          onClose={() => setConfirmRegen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirmRegen(false)}>
                Keep my edits
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setConfirmRegen(false);
                  onRegenerate(def.key, true);
                }}
              >
                <Icon.Refresh /> Regenerate
              </button>
            </>
          }
        />
      ) : null}
    </section>
  );
}
