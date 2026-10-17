'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SectionRow } from '@/lib/strategy/repo';
import { SECTIONS, SECTION_BY_KEY } from '@/lib/strategy/sections';
import type { AssistantMessage } from '@/lib/strategy/assistant';
import { api, ApiError, idempotencyKey } from '@/lib/client-api';
import { toPlainText } from '@/lib/view';
import { Dialog } from '@/components/ui/dialog';
import { StructuredView } from '@/components/ui/structured-view';
import { CopyButton } from '@/components/ui/copy-button';
import { Icon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';

const MAX_QUESTION = 1000;

const SUGGESTIONS = {
  explain: [
    'Why is this the right audience to start with?',
    'What should I do first this week?',
    'Explain the KPIs in plain terms.',
    'Which assumption here is the riskiest?',
  ],
  revise: ['Make it shorter and plainer.', 'Use a warmer, more personal tone.', 'Focus on customers in our local area.', 'Address price as the main objection.'],
} as const;

type Explain = { answer: string; key_points?: string[]; based_on?: string[]; caveat?: string };
type Revision = { summary: string; content: unknown };

export function AssistantPanel({
  strategyId,
  sections,
  initialSection,
  canEdit,
  aiMode,
  dirtySections,
  onApplied,
  onClose,
}: {
  strategyId: string;
  sections: SectionRow[];
  initialSection: string | null;
  canEdit: boolean;
  aiMode: 'live' | 'preview' | 'unavailable';
  dirtySections: Set<string>;
  onApplied: (section: SectionRow) => void;
  onClose: () => void;
}) {
  const readyKeys = new Set(sections.filter((s) => s.status === 'ready').map((s) => s.key));
  const [sectionKey, setSectionKey] = useState<string>(initialSection && readyKeys.has(initialSection) ? initialSection : '');
  const [intent, setIntent] = useState<'explain' | 'revise'>('explain');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[] | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const canRevise = canEdit && !!sectionKey;
  const effectiveIntent = intent === 'revise' && !canRevise ? 'explain' : intent;
  const unavailable = aiMode === 'unavailable';

  const load = useCallback(async () => {
    const res = await api<{ messages: AssistantMessage[] }>(`/api/strategies/${strategyId}/assistant`);
    setMessages(res.messages);
    return res.messages;
  }, [strategyId]);

  useEffect(() => {
    load().catch((err) => setError((err as Error).message));
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [load]);

  // Follow the running job until the answer is stored, then reload the thread.
  const pending = messages?.find((m) => m.status === 'pending' && m.job_id);
  useEffect(() => {
    if (!pending?.job_id) {
      setPendingLabel(null);
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const { job } = await api<{ job: { status: string; progress: { label: string } | null } }>(`/api/jobs/${pending.job_id}`);
        if (stopped) return;
        setPendingLabel(job.progress?.label ?? null);
        if (['succeeded', 'failed', 'cancelled'].includes(job.status)) {
          await load();
          return;
        }
      } catch {
        // transient; keep polling
      }
      timer = setTimeout(tick, 1000);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [pending?.job_id, load]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages?.length, pending?.id]);

  async function send(text = question) {
    const q = text.trim();
    if (q.length < 3 || sending || pending) return;
    setSending(true);
    setError(null);
    try {
      await api(`/api/strategies/${strategyId}/assistant`, {
        body: { question: q, sectionKey: sectionKey || null, intent: effectiveIntent, idempotencyKey: idempotencyKey() },
      });
      setQuestion('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function apply(m: AssistantMessage) {
    setApplying(m.id);
    try {
      const res = await api<{ section: SectionRow; message: AssistantMessage }>(`/api/strategies/${strategyId}/assistant/${m.id}/apply`, { body: {} });
      onApplied(res.section);
      setMessages((prev) => prev?.map((x) => (x.id === m.id ? res.message : x)) ?? prev);
      toast('Revision applied. The previous text is saved in Versions.');
    } catch (err) {
      toast((err as Error).message, 'error');
      if (err instanceof ApiError && err.code === 'stale') await load();
    } finally {
      setApplying(null);
    }
  }

  async function clear() {
    try {
      await api(`/api/strategies/${strategyId}/assistant`, { method: 'DELETE' });
      await load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const sectionTitle = (key: string | null) => (key ? SECTION_BY_KEY[key]?.title ?? key : 'Whole strategy');

  return (
    <Dialog
      drawer
      title="Ask about this strategy"
      description="Answers use only this strategy and your brief. Nothing changes until you apply a suggestion."
      onClose={onClose}
    >
      <div className="assist">
        <div className="assist-controls">
          <label className="field">
            <span className="field-label">About</span>
            <select className="input select" value={sectionKey} onChange={(e) => setSectionKey(e.target.value)}>
              <option value="">Whole strategy</option>
              {SECTIONS.filter((d) => readyKeys.has(d.key)).map((d) => (
                <option key={d.key} value={d.key}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
          <div className="field">
            <span className="field-label" id="assist-intent">
              I want to
            </span>
            <div className="segmented" role="radiogroup" aria-labelledby="assist-intent">
              {(['explain', 'revise'] as const).map((v) => {
                const disabled = v === 'revise' && !canRevise;
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={effectiveIntent === v}
                    disabled={disabled}
                    title={disabled ? (canEdit ? 'Choose a section to revise' : 'Your role can view but not edit') : undefined}
                    onClick={() => setIntent(v)}
                  >
                    {v === 'explain' ? 'Understand it' : 'Revise a section'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="assist-thread" ref={threadRef} aria-live="polite">
          {messages === null ? (
            <div className="stack">
              <div className="skeleton" style={{ height: 14, width: '70%' }} />
              <div className="skeleton" style={{ height: 14, width: '45%' }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="assist-empty">
              <p className="small muted">
                {effectiveIntent === 'revise'
                  ? `Describe how ${sectionTitle(sectionKey).toLowerCase()} should change. You will see the full draft before anything is saved.`
                  : 'Ask why something is recommended, what to do first, or what a term means.'}
              </p>
              <ul className="assist-suggestions" role="list">
                {SUGGESTIONS[effectiveIntent].map((sug) => (
                  <li key={sug}>
                    <button type="button" className="assist-chip" onClick={() => send(sug)} disabled={unavailable || sending}>
                      {sug}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol className="assist-list" role="list">
              {messages.map((m) => (
                <li key={m.id} className="assist-item">
                  <div className="assist-q">
                    <p>{m.question}</p>
                    <span className="xs subtle">
                      {sectionTitle(m.section_key)}
                      {m.intent === 'revise' ? ', revision' : ''}
                    </span>
                  </div>
                  {m.status === 'pending' ? (
                    <div className="assist-a assist-pending" role="status">
                      <span className="spinner" aria-hidden="true" />
                      <span className="small muted">{pendingLabel ?? 'Starting'}</span>
                    </div>
                  ) : m.status === 'failed' ? (
                    <div className="notice notice-danger">
                      <Icon.Warning />
                      <span>
                        {m.error ?? 'This could not be answered.'} Nothing was charged.{' '}
                        <button className="text-link" onClick={() => send(m.question)} disabled={!!pending || sending}>
                          Ask again
                        </button>
                      </span>
                    </div>
                  ) : m.intent === 'explain' ? (
                    <ExplainAnswer m={m} />
                  ) : (
                    <RevisionAnswer
                      m={m}
                      canEdit={canEdit}
                      applying={applying === m.id}
                      blockedByEdits={!!m.section_key && dirtySections.has(m.section_key)}
                      onApply={() => apply(m)}
                    />
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        <form
          className="assist-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          {unavailable ? (
            <p className="notice notice-warn small">
              <Icon.Info />
              <span>Asking questions needs an AI provider, and none is connected right now.</span>
            </p>
          ) : null}
          {error ? (
            <p className="notice notice-danger small" role="alert">
              <Icon.Warning />
              <span>{error}</span>
            </p>
          ) : null}
          <label className="sr-only" htmlFor="assist-input">
            {effectiveIntent === 'revise' ? 'How should this section change?' : 'Your question'}
          </label>
          <textarea
            id="assist-input"
            ref={inputRef}
            className="input textarea"
            rows={2}
            maxLength={MAX_QUESTION}
            value={question}
            disabled={unavailable}
            placeholder={effectiveIntent === 'revise' ? `How should ${sectionTitle(sectionKey).toLowerCase()} change?` : 'Ask about this strategy'}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="assist-composer-foot">
            <span className="xs subtle">
              {aiMode === 'preview' ? 'Preview mode: answers are labeled placeholder text. ' : ''}
              Uses one generation.
              {messages?.length && canEdit ? (
                <>
                  {' '}
                  <button type="button" className="text-link" onClick={clear} disabled={!!pending}>
                    Clear conversation
                  </button>
                </>
              ) : null}
            </span>
            <button className="btn btn-primary btn-sm" disabled={unavailable || sending || !!pending || question.trim().length < 3} aria-busy={sending}>
              {sending ? <span className="spinner" aria-hidden="true" /> : <Icon.Sparkle />}
              {effectiveIntent === 'revise' ? 'Draft revision' : 'Ask'}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

function ModeTag({ mode }: { mode: AssistantMessage['mode'] }) {
  return mode === 'preview' ? (
    <span className="tag tag-warn" title="Created without an AI provider">
      <span className="dot" /> Preview
    </span>
  ) : null;
}

function ExplainAnswer({ m }: { m: AssistantMessage }) {
  const a = m.answer as Explain;
  const text = [a.answer, ...(a.key_points ?? []).map((p) => `- ${p}`), a.caveat ? `Note: ${a.caveat}` : ''].filter(Boolean).join('\n');
  return (
    <div className="assist-a">
      <div className="cluster" style={{ justifyContent: 'space-between' }}>
        <ModeTag mode={m.mode} />
        <CopyButton text={() => text} label="Copy answer" />
      </div>
      <p className="sv-text">{a.answer}</p>
      {a.key_points?.length ? (
        <ul className="sv-bullets" role="list">
          {a.key_points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      ) : null}
      {a.caveat ? <p className="small muted">{a.caveat}</p> : null}
      {a.based_on?.length ? (
        <div className="cluster" style={{ '--gap': '6px' } as React.CSSProperties}>
          <span className="xs subtle">Based on</span>
          {a.based_on.map((b) => (
            <span key={b} className="tag">
              {b}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RevisionAnswer({
  m,
  canEdit,
  applying,
  blockedByEdits,
  onApply,
}: {
  m: AssistantMessage;
  canEdit: boolean;
  applying: boolean;
  blockedByEdits: boolean;
  onApply: () => void;
}) {
  const [open, setOpen] = useState(!m.applied_at);
  const a = m.answer as Revision;
  const def = m.section_key ? SECTION_BY_KEY[m.section_key] : null;
  if (!def) return null;
  return (
    <div className="assist-a">
      <div className="cluster" style={{ justifyContent: 'space-between' }}>
        <ModeTag mode={m.mode} />
        {m.applied_at ? (
          <span className="tag tag-ok">
            <Icon.Check /> Applied
          </span>
        ) : null}
      </div>
      <p className="sv-text">{a.summary}</p>
      <div className="assist-draft">
        <button type="button" className="assist-draft-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span>Suggested {def.title.toLowerCase()}</span>
          <Icon.ChevronDown />
        </button>
        {open ? (
          <div className="assist-draft-body fade-in">
            <StructuredView view={def.view} data={a.content} headingLevel={4} />
          </div>
        ) : null}
      </div>
      {!m.applied_at && canEdit ? (
        <div className="cluster">
          <button className="btn btn-primary btn-sm" onClick={onApply} disabled={applying || blockedByEdits} aria-busy={applying}>
            {applying ? <span className="spinner" aria-hidden="true" /> : <Icon.Check />} Apply to section
          </button>
          <CopyButton text={() => toPlainText(def.view, a.content)} label="Copy draft" />
          {blockedByEdits ? <span className="xs subtle">Save or discard your open edits in this section first.</span> : null}
        </div>
      ) : null}
    </div>
  );
}
