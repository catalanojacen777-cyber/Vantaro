'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Field, ToolExample } from '@/lib/tools/types';
import type { ViewBlock } from '@/lib/view';
import { toMarkdown, toPlainText } from '@/lib/view';
import { api, ApiError, idempotencyKey } from '@/lib/client-api';
import { StructuredView } from '@/components/ui/structured-view';
import { CopyButton } from '@/components/ui/copy-button';
import { Icon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';
import { clientValidate, initialValues, ToolFields, type Values } from './tool-fields';

type Job = {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  mode: 'live' | 'preview';
  progress: { label: string } | null;
  output: unknown;
  error: { code: string; message: string } | null;
};

export type AiToolClient = {
  slug: string;
  name: string;
  fields: Field[];
  examples: ToolExample[];
  outputLabel: string;
  view: ViewBlock[];
};

export function ToolRunner({
  tool,
  signedIn,
  aiMode,
  quota,
  context,
  resumeJobId,
  prefill,
}: {
  tool: AiToolClient;
  signedIn: boolean;
  aiMode: 'live' | 'preview' | 'unavailable';
  quota: { remaining: number; limit: number } | null;
  context: 'public' | 'app';
  resumeJobId?: string | null;
  prefill?: Values;
}) {
  const [values, setValues] = useState<Values>(() => ({ ...initialValues(tool.fields), ...(prefill ?? {}) }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [job, setJob] = useState<Job | null>(null);
  const [submitError, setSubmitError] = useState<{ message: string; quota?: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(quota?.remaining ?? null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(idempotencyKey());

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
  }, []);

  function poll(jobId: string, onDone?: (j: Job) => void) {
    const tick = async () => {
      try {
        const { job: j } = await api<{ job: Job }>(`/api/jobs/${jobId}`);
        setJob(j);
        if (j.status === 'queued' || j.status === 'running') {
          pollRef.current = setTimeout(tick, 900);
          return;
        }
        if (j.status === 'succeeded') requestAnimationFrame(() => resultRef.current?.focus());
        onDone?.(j);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setJob(null);
          return;
        }
        pollRef.current = setTimeout(tick, 1500);
      }
    };
    tick();
  }

  // Resume a run after sign-up and save it to the new workspace.
  useEffect(() => {
    if (!resumeJobId) return;
    poll(resumeJobId, async (j) => {
      if (j.status !== 'succeeded' || !signedIn) return;
      try {
        const res = await api<{ id: string }>('/api/outputs', { body: { jobId: j.id } });
        setSavedId(res.id);
        toast('Saved to your workspace');
        window.history.replaceState(null, '', window.location.pathname);
      } catch (err) {
        toast((err as Error).message, 'error');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeJobId]);

  function change(name: string, value: string | number) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: '' } : e));
  }

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    const errs = clientValidate(tool.fields, values);
    setErrors(errs);
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) {
      document.getElementById(`tool-${first}`)?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSavedId(null);
    try {
      const res = await api<{ jobId: string; remaining: number | null }>(`/api/tools/${tool.slug}/run`, { body: { values, idempotencyKey: keyRef.current } });
      keyRef.current = idempotencyKey();
      if (res.remaining !== null) setRemaining(res.remaining);
      setJob({ id: res.jobId, status: 'queued', mode: aiMode === 'live' ? 'live' : 'preview', progress: null, output: null, error: null });
      poll(res.jobId);
    } catch (err) {
      if (err instanceof ApiError && err.data.fields) setErrors(err.data.fields as Record<string, string>);
      setSubmitError({ message: (err as Error).message, quota: err instanceof ApiError && err.code === 'quota_exceeded' });
      if (err instanceof ApiError && err.code === 'quota_exceeded') setRemaining(0);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel() {
    if (!job) return;
    await api(`/api/jobs/${job.id}/cancel`, { body: {} }).catch(() => null);
  }

  async function save() {
    if (!job) return;
    if (!signedIn) {
      const next = `${context === 'app' ? `/app/tools/${tool.slug}` : `/tools/${tool.slug}`}?save=${job.id}`;
      window.location.href = `/signup?next=${encodeURIComponent(next)}`;
      return;
    }
    setSaving(true);
    try {
      const res = await api<{ id: string }>('/api/outputs', { body: { jobId: job.id } });
      setSavedId(res.id);
      toast('Saved to your workspace');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function download() {
    if (!job?.output) return;
    const md = `# ${tool.name}\n\n${job.mode === 'preview' ? '> Preview output: placeholder text produced without an AI provider.\n\n' : ''}${toMarkdown(tool.view, job.output, 2)}\n`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const running = job && (job.status === 'queued' || job.status === 'running');
  const disabled = aiMode === 'unavailable' || remaining === 0;

  return (
    <div className="tool-runner">
      <form className="tool-form panel panel-pad" onSubmit={run} noValidate aria-label={`${tool.name} inputs`}>
        {tool.examples.length ? (
          <div className="cluster tool-examples" style={{ '--gap': '8px' } as React.CSSProperties}>
            <span className="small muted">Try an example:</span>
            {tool.examples.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className="btn btn-ghost btn-sm chip"
                onClick={() => {
                  setValues({ ...initialValues(tool.fields), ...Object.fromEntries(Object.entries(ex.values).map(([k, v]) => [k, v])) });
                  setErrors({});
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        ) : null}
        <ToolFields fields={tool.fields} values={values} errors={errors} onChange={change} idPrefix="tool" />
        {submitError ? (
          <div className={`notice ${submitError.quota ? 'notice-warn' : 'notice-danger'}`} role="alert">
            <Icon.Warning />
            <span>
              {submitError.message}{' '}
              {submitError.quota && !signedIn ? (
                <Link className="text-link" href={`/signup?next=${encodeURIComponent(`/tools/${tool.slug}`)}`}>
                  Create a free account
                </Link>
              ) : null}
            </span>
          </div>
        ) : null}
        {aiMode === 'unavailable' ? (
          <div className="notice notice-danger">
            <Icon.Warning />
            <span>Generation is not available right now because no AI provider is connected.</span>
          </div>
        ) : null}
        <div className="tool-submit">
          <button className="btn btn-primary btn-lg" disabled={submitting || !!running || disabled} aria-busy={submitting}>
            {submitting ? <span className="spinner" aria-hidden="true" /> : null}
            {job?.status === 'succeeded' ? 'Generate again' : `Generate ${tool.outputLabel.toLowerCase()}`}
          </button>
          <span className="xs subtle">
            {remaining !== null && quota
              ? `${remaining} of ${quota.limit} ${signedIn ? 'generations' : 'free generations'} left today${signedIn ? '' : '. No account needed.'}`
              : null}
          </span>
        </div>
      </form>

      <div className="tool-output" aria-live="polite">
        {!job ? (
          <div className="tool-placeholder">
            <p className="small muted">Your {tool.outputLabel.toLowerCase()} will appear here.</p>
          </div>
        ) : running ? (
          <div className="panel panel-pad tool-progress" role="status">
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <span className="cluster">
                <span className="spinner" aria-hidden="true" />
                {job.progress?.label ?? 'Starting'}…
              </span>
              <button className="btn btn-ghost btn-sm" onClick={cancel} type="button">
                <Icon.Stop /> Cancel
              </button>
            </div>
            <div className="stack mt-5" style={{ '--stack': '10px' } as React.CSSProperties} aria-hidden="true">
              <div className="skeleton" style={{ height: 14, width: '64%' }} />
              <div className="skeleton" style={{ height: 14, width: '90%' }} />
              <div className="skeleton" style={{ height: 14, width: '78%' }} />
            </div>
          </div>
        ) : job.status === 'succeeded' ? (
          <div ref={resultRef} tabIndex={-1} className="panel panel-pad tool-result fade-in" aria-label={`${tool.outputLabel} result`}>
            <div className="tool-result-bar">
              <div className="cluster" style={{ '--gap': '8px' } as React.CSSProperties}>
                <h2 className="tool-result-title">{tool.outputLabel}</h2>
                {job.mode === 'preview' ? (
                  <span className="tag tag-warn" title="No AI provider is connected. This is labeled placeholder text.">
                    <span className="dot" /> Preview output
                  </span>
                ) : null}
              </div>
              <div className="cluster" style={{ '--gap': '4px' } as React.CSSProperties}>
                <CopyButton text={() => toPlainText(tool.view, job.output)} label="Copy all results" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={download}>
                  <Icon.Download /> Download
                </button>
                {savedId ? (
                  <Link className="btn btn-ghost btn-sm" href={`/app/outputs/${savedId}`}>
                    <Icon.Check /> Saved
                  </Link>
                ) : (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={save} disabled={saving}>
                    <Icon.Save /> {signedIn ? 'Save to workspace' : 'Save (free account)'}
                  </button>
                )}
              </div>
            </div>
            {job.mode === 'preview' ? (
              <p className="xs subtle mb-5">This environment has no AI provider connected, so the result shows the real structure filled with placeholder text.</p>
            ) : null}
            <div className="stagger-wrap">
              <StructuredView view={tool.view} data={job.output} />
            </div>
          </div>
        ) : (
          <div className="notice notice-danger" role="alert">
            <Icon.Warning />
            <span>
              {job.status === 'cancelled' ? 'Generation cancelled. Nothing was charged.' : `${job.error?.message ?? 'Generation failed.'} Nothing was charged.`}{' '}
              <button type="button" className="text-link" onClick={() => run()}>
                Try again
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Static tool pages render this: it fetches who is signed in and the
 * remaining quota at runtime, and picks up ?business= prefill or a ?save=
 * run to resume after sign-up.
 */
export function ToolRunnerLoader({ tool, context }: { tool: AiToolClient; context: 'public' | 'app' }) {
  const [state, setState] = useState<{ signedIn: boolean; aiMode: 'live' | 'preview' | 'unavailable'; remaining: number; limit: number } | null>(null);
  const [params, setParams] = useState<{ prefill: Values; save: string | null } | null>(null);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const prefill: Values = {};
    for (const f of tool.fields) {
      const v = sp.get(f.name);
      if (v && f.type !== 'number') prefill[f.name] = v.slice(0, 'max' in f && f.max ? f.max : 1200);
    }
    setParams({ prefill, save: sp.get('save') });
    api<{ signedIn: boolean; aiMode: 'live' | 'preview' | 'unavailable'; remaining: number; limit: number }>('/api/quota')
      .then(setState)
      .catch(() => setState({ signedIn: false, aiMode: 'live', remaining: 1, limit: 1 }));
  }, [tool.fields]);
  if (!state || !params) {
    return (
      <div className="tool-runner" aria-busy="true">
        <div className="panel panel-pad stack">
          <div className="skeleton" style={{ height: 18, width: '40%' }} />
          <div className="skeleton" style={{ height: 110 }} />
          <div className="skeleton" style={{ height: 44 }} />
          <div className="skeleton" style={{ height: 50 }} />
        </div>
        <div className="tool-placeholder">
          <p className="small muted">Loading…</p>
        </div>
      </div>
    );
  }
  return (
    <ToolRunner
      tool={tool}
      signedIn={state.signedIn}
      aiMode={state.aiMode}
      quota={{ remaining: state.remaining, limit: state.limit }}
      context={context}
      resumeJobId={params.save}
      prefill={params.prefill}
    />
  );
}
