'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Field, ToolExample } from '@/lib/tools/types';
import { COMPUTE } from '@/lib/tools/calculators';
import { api } from '@/lib/client-api';
import { CopyButton } from '@/components/ui/copy-button';
import { Icon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';
import { initialValues, ToolFields, type Values } from './tool-fields';

export type CalculatorClient = { slug: string; name: string; fields: Field[]; examples: ToolExample[]; methodology: string[] };

/** Fields that only apply to one budget method are hidden for the other. */
function visibleFields(slug: string, fields: Field[], values: Values) {
  if (slug !== 'marketing-budget-calculator') return fields;
  const goal = values.method === 'Customer goal';
  return fields.filter((f) => (goal ? !['monthlyRevenue', 'percentOfRevenue'].includes(f.name) : !['newCustomersPerMonth', 'costPerCustomer'].includes(f.name)));
}

export function CalculatorRunner({ calc, signedIn, context }: { calc: CalculatorClient; signedIn: boolean; context: 'public' | 'app' }) {
  const [values, setValues] = useState<Values>(() => ({ ...initialValues(calc.fields), ...(calc.examples[0]?.values ?? {}) }));
  const [touched, setTouched] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fields = visibleFields(calc.slug, calc.fields, values);
  const result = useMemo(() => COMPUTE[calc.slug](values), [calc.slug, values]);

  function change(name: string, value: string | number) {
    setValues((v) => ({ ...v, [name]: value }));
    setTouched(true);
    setSavedId(null);
  }

  async function save() {
    if (!signedIn) {
      window.location.href = `/signup?next=${encodeURIComponent(context === 'app' ? `/app/tools/${calc.slug}` : `/tools/${calc.slug}`)}`;
      return;
    }
    setSaving(true);
    try {
      const res = await api<{ id: string }>('/api/outputs', { body: { toolSlug: calc.slug, values } });
      setSavedId(res.id);
      toast('Saved to your workspace');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const asText = () =>
    [
      calc.name,
      result.headline ? `${result.headline.label}: ${result.headline.value}` : '',
      ...result.lines.map((l) => `${l.label}: ${l.value}${l.formula ? ` (${l.formula})` : ''}`),
      '',
      'Assumptions:',
      ...result.assumptions.map((a) => `- ${a}`),
    ].join('\n');

  return (
    <div className="tool-runner calc">
      <form className="tool-form panel panel-pad" onSubmit={(e) => e.preventDefault()} aria-label={`${calc.name} inputs`}>
        <div className="cluster tool-examples" style={{ '--gap': '8px' } as React.CSSProperties}>
          <span className="small muted">{touched ? 'Your inputs' : 'Filled with example assumptions. Replace them with yours.'}</span>
          {touched ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm chip"
              onClick={() => {
                setValues({ ...initialValues(calc.fields), ...(calc.examples[0]?.values ?? {}) });
                setTouched(false);
              }}
            >
              Reset to example
            </button>
          ) : null}
        </div>
        <ToolFields fields={fields} values={values} errors={{}} onChange={change} idPrefix="calc" columns />
      </form>

      <div className="tool-output" aria-live="polite">
        <div className="panel panel-pad tool-result">
          <div className="tool-result-bar">
            <h2 className="tool-result-title">Results</h2>
            {result.ok ? (
              <div className="cluster" style={{ '--gap': '4px' } as React.CSSProperties}>
                <CopyButton text={asText} label="Copy results" />
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
            ) : null}
          </div>
          {!result.ok ? (
            <div className="notice notice-warn" role="status">
              <Icon.Info />
              <ul className="sv-bullets" style={{ paddingLeft: '1em' }}>
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : (
            <CalcResultView result={result} />
          )}
        </div>
        <details className="method panel panel-pad mt-5">
          <summary>How this is calculated</summary>
          <ul className="sv-bullets mt-3">
            {calc.methodology.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

export function CalcResultView({ result }: { result: ReturnType<(typeof COMPUTE)[string]> }) {
  return (
    <div className="stack" style={{ '--stack': '22px' } as React.CSSProperties}>
      {result.headline ? (
        <div className="calc-headline">
          <span className="small muted">{result.headline.label}</span>
          <strong className="calc-figure nums">{result.headline.value}</strong>
        </div>
      ) : null}
      {result.scenarios?.length ? (
        <div className="calc-scenarios">
          {result.scenarios.map((s) => (
            <div key={s.label} className="calc-scenario">
              <span className="xs muted">{s.label}</span>
              <span className="nums">{s.value}</span>
              {s.note ? <span className="xs subtle">{s.note}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
      <dl className="calc-lines">
        {result.lines.map((l) => (
          <div key={l.label} className="calc-line" data-emphasis={l.emphasis || undefined}>
            <dt style={{ fontWeight: l.emphasis ? 650 : 500 }}>{l.label}</dt>
            <dd className="calc-value nums">{l.value}</dd>
            {l.formula ? <dd className="calc-formula">= {l.formula}</dd> : null}
          </div>
        ))}
      </dl>
      {result.warnings.length ? (
        <div className="notice notice-warn">
          <Icon.Warning />
          <ul className="sv-bullets" style={{ paddingLeft: '1em' }}>
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <h3 className="sv-label">Assumptions</h3>
        <ul className="sv-bullets mt-2 small">
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function CalculatorLoader({ calc, context }: { calc: CalculatorClient; context: 'public' | 'app' }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    api<{ signedIn: boolean }>('/api/me')
      .then((r) => setSignedIn(r.signedIn))
      .catch(() => setSignedIn(false));
  }, []);
  return <CalculatorRunner calc={calc} signedIn={signedIn} context={context} />;
}
