'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BUDGETS, CHANNELS, CUSTOMER_TYPES, OBJECTIVES, STAGES, type Brief } from '@/lib/strategy/brief';
import { api, ApiError, idempotencyKey } from '@/lib/client-api';
import { Field, describedBy } from '@/components/ui/form';
import { Icon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type ImportDraft = { mode: 'live' | 'preview'; source: { url: string; title: string }; draft: Partial<Record<'businessName' | 'productDescription' | 'idealCustomer' | 'differentiation', string>> };
const DRAFT_LABELS: Record<string, string> = { businessName: 'Business name', productDescription: 'What you sell', idealCustomer: 'Who it targets', differentiation: 'Difference' };

const STEPS = [
  { key: 'business', title: 'Your business', why: 'Everything else builds on this. Specific details about what you sell produce specific recommendations.' },
  { key: 'customers', title: 'Your customers', why: 'Audience hypotheses start from who you believe buys today. A rough description is enough.' },
  { key: 'direction', title: 'Stage and goal', why: 'A business with no customers needs different moves than one optimizing an existing funnel.' },
  { key: 'resources', title: 'Channels and budget', why: 'Recommendations should fit the time and money you actually have.' },
  { key: 'review', title: 'Review', why: 'Check the brief, then generate. You can edit the brief and regenerate later.' },
] as const;

function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onChange,
  multi,
  error,
}: {
  name: string;
  legend: string;
  options: readonly string[];
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  multi?: boolean;
  error?: string;
}) {
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : []);
  return (
    <fieldset className="field" aria-describedby={error ? `${name}-err` : undefined}>
      <legend className="field-label" style={{ marginBottom: 7 }}>
        <span>{legend}</span>
        {multi ? <span className="optional">Choose any</span> : null}
      </legend>
      <div className="choice-grid">
        {options.map((opt) => (
          <label key={opt} className="choice" data-type={multi ? 'checkbox' : 'radio'}>
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={name}
              value={opt}
              checked={selected.has(opt)}
              onChange={(e) => {
                if (!multi) return onChange(opt);
                const next = new Set(selected);
                if (e.target.checked) next.add(opt);
                else next.delete(opt);
                onChange(options.filter((o) => next.has(o)));
              }}
            />
            <span className="check" aria-hidden="true">
              <Icon.Check />
            </span>
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="field-error" id={`${name}-err`} role="alert">
          <Icon.Warning width={14} height={14} /> {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function BriefWizard({
  initial,
  initialStep,
  languages,
  maxPersonas,
  aiMode,
  strategiesRemaining,
}: {
  initial: Brief;
  initialStep: number;
  languages: string[];
  maxPersonas: number;
  aiMode: 'live' | 'preview' | 'unavailable';
  strategiesRemaining: number;
}) {
  const router = useRouter();
  const [brief, setBrief] = useState<Brief>(initial);
  const [step, setStep] = useState(Math.min(initialStep, STEPS.length - 1));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [personaCount, setPersonaCount] = useState(Math.min(3, maxPersonas));
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ brief, step });
  latest.current = { brief, step };
  const headingRef = useRef<HTMLHeadingElement>(null);
  const genKey = useRef(idempotencyKey());
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ImportDraft | null>(null);

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    if (!dirty.current) return true;
    dirty.current = false;
    setSaveState('saving');
    try {
      await api('/api/brief', { method: 'PUT', body: { data: latest.current.brief, step: latest.current.step } });
      setSaveState('saved');
      return true;
    } catch (err) {
      dirty.current = true;
      setSaveState('error');
      if (err instanceof ApiError && err.status === 422) toast(err.message, 'error');
      return false;
    }
  }, []);

  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((b) => ({ ...b, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
    dirty.current = true;
    setSaveState('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
  }

  // Save on tab close/navigation if something is pending.
  useEffect(() => {
    const onHide = () => {
      if (!dirty.current) return;
      const body = JSON.stringify({ data: latest.current.brief, step: latest.current.step });
      fetch('/api/brief', { method: 'PUT', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  function validateStep(i: number): boolean {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (!brief.businessName?.trim()) e.businessName = 'Add your business name. A working name is fine.';
      const d = brief.productDescription?.trim() ?? '';
      if (!d) e.productDescription = 'Describe what you sell.';
      else if (d.length < 40) e.productDescription = 'Add a bit more detail: what it is, who it is for, and how it is delivered.';
    }
    if (i === 1 && !brief.customerType) e.customerType = 'Choose who you sell to.';
    if (i === 2) {
      if (!brief.stage) e.stage = 'Choose your stage.';
      if (!brief.objective) e.objective = 'Choose a primary objective.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function goTo(i: number) {
    if (i > step && !validateStep(step)) return;
    dirty.current = true;
    setStep(i);
    latest.current.step = i;
    void save();
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function generate() {
    for (let i = 0; i < 3; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    setGenerating(true);
    setGenError(null);
    const ok = await save();
    if (!ok) {
      setGenerating(false);
      setGenError('Your latest answers have not been saved yet. Check your connection and try again.');
      return;
    }
    try {
      const res = await api<{ strategyId: string }>('/api/strategies', { body: { idempotencyKey: genKey.current, personaCount } });
      router.push(`/app/strategies/${res.strategyId}`);
    } catch (err) {
      setGenerating(false);
      genKey.current = idempotencyKey();
      setGenError(err instanceof Error ? err.message : 'Generation could not start.');
    }
  }

  async function importSite() {
    setImporting(true);
    setImportError(null);
    setDraft(null);
    try {
      const res = await api<ImportDraft>('/api/brief/import', { body: { url: brief.website } });
      setDraft(res);
    } catch (err) {
      setImportError((err as Error).message);
    } finally {
      setImporting(false);
    }
  }

  function applyDraft(replace: boolean) {
    if (!draft) return;
    const keys = ['businessName', 'productDescription', 'idealCustomer', 'differentiation'] as const;
    for (const k of keys) {
      const v = draft.draft[k];
      if (!v || /^not stated/i.test(v)) continue;
      if (replace || !brief[k]?.trim()) update(k, v);
    }
    setDraft(null);
    toast('Draft applied. Review each answer.');
  }

  const s = STEPS[step];
  const id = (n: string) => `brief-${n}`;

  return (
    <div className="wizard">
      <ol className="wizard-steps" aria-label="Brief steps">
        {STEPS.map((st, i) => (
          <li key={st.key}>
            <button
              type="button"
              className="wizard-step"
              aria-current={i === step ? 'step' : undefined}
              data-done={i < step}
              onClick={() => (i <= step ? goTo(i) : goTo(i))}
            >
              <span className="wizard-step-n" aria-hidden="true">
                {i < step ? <Icon.Check /> : i + 1}
              </span>
              <span>{st.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <section className="panel panel-pad wizard-panel" aria-labelledby="wizard-heading">
        <header className="wizard-head">
          <div>
            <p className="xs subtle">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 id="wizard-heading" ref={headingRef} tabIndex={-1}>
              {s.title}
            </h2>
            <p className="small muted mt-2 measure">{s.why}</p>
          </div>
          <span className="save-state xs" role="status" aria-live="polite" data-state={saveState}>
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'All changes saved' : saveState === 'error' ? 'Not saved. Retrying on next change.' : ''}
          </span>
        </header>

        <div key={s.key} className="stack fade-in mt-6" style={{ '--stack': '26px' } as React.CSSProperties}>
          {s.key === 'business' ? (
            <>
              <Field label="Business name" htmlFor={id('name')} error={errors.businessName}>
                <input
                  id={id('name')}
                  className="input"
                  value={brief.businessName ?? ''}
                  onChange={(e) => update('businessName', e.target.value)}
                  maxLength={120}
                  autoComplete="organization"
                  aria-invalid={!!errors.businessName}
                  aria-describedby={describedBy(id('name'), { error: errors.businessName })}
                />
              </Field>
              <Field
                label="What do you sell?"
                htmlFor={id('desc')}
                error={errors.productDescription}
                help="What it is, who it is for, how it is delivered, and roughly what it costs. Two to five sentences."
                counter={{ value: brief.productDescription?.length ?? 0, max: 2000 }}
              >
                <textarea
                  id={id('desc')}
                  className="textarea"
                  rows={5}
                  value={brief.productDescription ?? ''}
                  onChange={(e) => update('productDescription', e.target.value)}
                  maxLength={2000}
                  placeholder="Example: We clean windows and rooftop solar panels for homeowners around Raleigh. Most customers book a quarterly plan; one-off cleans start around $180."
                  aria-invalid={!!errors.productDescription}
                  aria-describedby={describedBy(id('desc'), { help: true, error: errors.productDescription })}
                />
              </Field>
              <Field label="Website" optional htmlFor={id('web')} help="We only read your homepage if you choose “Draft from my website”, and you review everything before it is used.">
                <div className="cluster" style={{ flexWrap: 'nowrap' }}>
                  <input
                    id={id('web')}
                    className="input"
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={brief.website ?? ''}
                    onChange={(e) => update('website', e.target.value)}
                    maxLength={300}
                    aria-describedby={describedBy(id('web'), { help: true })}
                  />
                  <button type="button" className="btn btn-secondary" onClick={importSite} disabled={!brief.website?.trim() || importing} aria-busy={importing}>
                    {importing ? <span className="spinner" aria-hidden="true" /> : null} Draft from my website
                  </button>
                </div>
              </Field>
              {importError ? (
                <div className="notice notice-danger" role="alert">
                  <Icon.Warning />
                  <span>{importError}</span>
                </div>
              ) : null}
              {draft ? (
                <div className="panel-raised panel-pad stack fade-in" style={{ '--stack': '12px' } as React.CSSProperties} role="region" aria-label="Draft from your website">
                  <div className="cluster" style={{ justifyContent: 'space-between' }}>
                    <strong>Draft from {draft.source.title || draft.source.url}</strong>
                    {draft.mode === 'preview' ? <span className="tag tag-warn">Page title and description only (preview mode)</span> : <span className="tag">AI draft: review it</span>}
                  </div>
                  <dl className="sv-dl">
                    {Object.entries(draft.draft).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k}>
                        <dt>{DRAFT_LABELS[k] ?? k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="cluster">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => applyDraft(false)}>Fill empty answers</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyDraft(true)}>Replace my answers</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>Discard</button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {s.key === 'customers' ? (
            <>
              <ChoiceGroup
                name="customerType"
                legend="Who do you sell to?"
                options={CUSTOMER_TYPES}
                value={brief.customerType}
                onChange={(v) => update('customerType', v as Brief['customerType'])}
                error={errors.customerType}
              />
              <Field
                label="Describe your best customers today"
                optional
                htmlFor={id('ideal')}
                help="Job, situation, what made them buy. If you have no customers yet, describe who you expect."
              >
                <textarea
                  id={id('ideal')}
                  className="textarea"
                  rows={4}
                  value={brief.idealCustomer ?? ''}
                  onChange={(e) => update('idealCustomer', e.target.value)}
                  maxLength={1200}
                  aria-describedby={describedBy(id('ideal'), { help: true })}
                />
              </Field>
              <Field label="Where are your customers?" optional htmlFor={id('region')} help="A city, region, country, or “online, worldwide”.">
                <input
                  id={id('region')}
                  className="input"
                  value={brief.region ?? ''}
                  onChange={(e) => update('region', e.target.value)}
                  maxLength={160}
                  aria-describedby={describedBy(id('region'), { help: true })}
                />
              </Field>
            </>
          ) : null}

          {s.key === 'direction' ? (
            <>
              <ChoiceGroup name="stage" legend="What stage are you at?" options={STAGES} value={brief.stage} onChange={(v) => update('stage', v as Brief['stage'])} error={errors.stage} />
              <ChoiceGroup
                name="objective"
                legend="What matters most in the next 90 days?"
                options={OBJECTIVES}
                value={brief.objective}
                onChange={(v) => update('objective', v as Brief['objective'])}
                error={errors.objective}
              />
              <Field label="Anything specific about that goal?" optional htmlFor={id('objd')} help="A target, a deadline, or a product you want to push.">
                <textarea id={id('objd')} className="textarea" rows={3} value={brief.objectiveDetail ?? ''} onChange={(e) => update('objectiveDetail', e.target.value)} maxLength={600} />
              </Field>
              <Field
                label="What makes you different?"
                optional
                htmlFor={id('diff')}
                help="Why customers pick you over the alternatives, in your own words. It is fine if you are not sure yet."
              >
                <textarea id={id('diff')} className="textarea" rows={3} value={brief.differentiation ?? ''} onChange={(e) => update('differentiation', e.target.value)} maxLength={1200} />
              </Field>
            </>
          ) : null}

          {s.key === 'resources' ? (
            <>
              <ChoiceGroup name="currentChannels" legend="Where do you market today?" options={CHANNELS} value={brief.currentChannels} onChange={(v) => update('currentChannels', v as Brief['currentChannels'])} multi />
              <ChoiceGroup name="budget" legend="Monthly marketing budget" options={BUDGETS} value={brief.budget} onChange={(v) => update('budget', v as Brief['budget'])} />
              <Field label="Constraints to respect" optional htmlFor={id('cons')} help="Time available each week, regulations, things you will not do, seasonality.">
                <textarea id={id('cons')} className="textarea" rows={3} value={brief.constraints ?? ''} onChange={(e) => update('constraints', e.target.value)} maxLength={1200} />
              </Field>
              {languages.length > 1 ? (
                <Field label="Output language" htmlFor={id('lang')}>
                  <select id={id('lang')} className="select" value={brief.language ?? languages[0]} onChange={(e) => update('language', e.target.value)}>
                    {languages.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </>
          ) : null}

          {s.key === 'review' ? (
            <BriefReview brief={brief} onEdit={(i) => goTo(i)} />
          ) : null}
        </div>

        {s.key === 'review' ? (
          <div className="stack mt-7" style={{ '--stack': '16px' } as React.CSSProperties}>
            {maxPersonas > 1 ? (
              <Field label="How many personas?" htmlFor={id('pc')} help={`Your plan allows up to ${maxPersonas} per strategy.`}>
                <select id={id('pc')} className="select" style={{ maxWidth: 200 }} value={personaCount} onChange={(e) => setPersonaCount(Number(e.target.value))}>
                  {Array.from({ length: maxPersonas }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {aiMode === 'preview' ? (
              <div className="notice notice-warn">
                <Icon.Info />
                <span>
                  <strong>Preview mode.</strong> No AI provider is connected, so the strategy will contain labeled placeholder text. Use it to try the workflow,
                  not to make decisions.
                </span>
              </div>
            ) : null}
            {aiMode === 'unavailable' ? (
              <div className="notice notice-danger">
                <Icon.Warning />
                <span>
                  <strong>Generation is offline.</strong> No AI provider is connected to this deployment.
                </span>
              </div>
            ) : null}
            {genError ? (
              <div className="notice notice-danger" role="alert">
                <Icon.Warning />
                <span>{genError}</span>
              </div>
            ) : null}
            <p className="small muted">
              {strategiesRemaining > 0
                ? `You can generate ${strategiesRemaining} more ${strategiesRemaining === 1 ? 'strategy' : 'strategies'} in the current 30-day window. Regenerating single sections later uses your daily generations instead.`
                : 'You have used your strategy generations for this 30-day window. You can still edit and regenerate sections of existing strategies.'}
            </p>
          </div>
        ) : null}

        <footer className="wizard-foot">
          <button type="button" className="btn btn-ghost" onClick={() => goTo(step - 1)} disabled={step === 0}>
            <Icon.ChevronLeft /> Back
          </button>
          <div className="cluster">
            {step < STEPS.length - 1 ? (
              <>
                {step > 0 && step < 4 ? (
                  <button type="button" className="btn btn-ghost hide-sm" onClick={() => goTo(step + 1)}>
                    Skip optional questions
                  </button>
                ) : null}
                <button type="button" className="btn btn-primary" onClick={() => goTo(step + 1)}>
                  Continue <Icon.ChevronRight />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={generate}
                disabled={generating || aiMode === 'unavailable' || strategiesRemaining <= 0}
                aria-busy={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner" aria-hidden="true" /> Starting
                  </>
                ) : (
                  'Build my strategy'
                )}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}

function BriefReview({ brief, onEdit }: { brief: Brief; onEdit: (step: number) => void }) {
  const rows: { label: string; value: string | undefined; step: number; required?: boolean }[] = [
    { label: 'Business name', value: brief.businessName, step: 0, required: true },
    { label: 'What you sell', value: brief.productDescription, step: 0, required: true },
    { label: 'Website', value: brief.website, step: 0 },
    { label: 'Customers', value: brief.customerType, step: 1, required: true },
    { label: 'Best customers today', value: brief.idealCustomer, step: 1 },
    { label: 'Region', value: brief.region, step: 1 },
    { label: 'Stage', value: brief.stage, step: 2, required: true },
    { label: 'Primary objective', value: [brief.objective, brief.objectiveDetail].filter(Boolean).join(': '), step: 2, required: true },
    { label: 'Differentiation', value: brief.differentiation, step: 2 },
    { label: 'Current channels', value: brief.currentChannels?.join(', '), step: 3 },
    { label: 'Budget', value: brief.budget, step: 3 },
    { label: 'Constraints', value: brief.constraints, step: 3 },
  ];
  return (
    <dl className="review-list">
      {rows.map((r) => (
        <div key={r.label} className="review-row">
          <dt className="small muted">{r.label}</dt>
          <dd>
            {r.value ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>{r.value}</span>
            ) : (
              <span className={r.required ? 'tag tag-danger' : 'subtle small'}>{r.required ? 'Required' : 'Skipped'}</span>
            )}
          </dd>
          <dd>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(r.step)} aria-label={`Edit ${r.label.toLowerCase()}`}>
              Edit
            </button>
          </dd>
        </div>
      ))}
    </dl>
  );
}
