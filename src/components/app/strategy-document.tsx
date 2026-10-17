import { StructuredView } from '@/components/ui/structured-view';
import { personaView, SECTIONS } from '@/lib/strategy/sections';
import type { Strategy } from '@/lib/strategy/repo';

/** Read-only, print-friendly rendering used by print and shared views. */
export function StrategyDocument({ strategy, showBrief }: { strategy: Strategy; showBrief?: boolean }) {
  const preview = strategy.sections.some((s) => s.mode === 'preview');
  const b = strategy.brief;
  return (
    <article className="doc">
      <header className="doc-head">
        <h1>{strategy.title}</h1>
        <p className="small muted">Updated {new Date(strategy.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        {preview ? (
          <p className="doc-note">Preview output: parts of this document are placeholder text generated without an AI provider. They are not analysis.</p>
        ) : null}
        <p className="doc-note">Audience and persona content are hypotheses based on the business brief. Validate them with real customers.</p>
      </header>
      {showBrief ? (
        <section className="doc-section">
          <h2>Business brief</h2>
          <dl className="sv-dl sv-dl-wide">
            {(
              [
                ['Business', b.businessName],
                ['What it sells', b.productDescription],
                ['Customers', b.customerType],
                ['Region', b.region],
                ['Stage', b.stage],
                ['Objective', b.objective],
                ['Budget', b.budget],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
        </section>
      ) : null}
      {SECTIONS.map((def) => {
        const sec = strategy.sections.find((s) => s.key === def.key);
        if (!sec || sec.status !== 'ready') return null;
        const personas = def.key === 'audience' ? ((sec.content as { personas?: Record<string, unknown>[] }).personas ?? []) : [];
        return (
          <section key={def.key} className="doc-section">
            <h2>{def.title}</h2>
            <StructuredView view={def.view} data={sec.content} />
            {personas.map((p, i) => (
              <div key={i} className="doc-persona">
                <h3>
                  Persona: {String(p.name ?? '')} <span className="muted small">({p.basis === 'provided' ? 'from the brief' : 'hypothesis'})</span>
                </h3>
                <StructuredView view={personaView} data={p} headingLevel={4} />
              </div>
            ))}
          </section>
        );
      })}
    </article>
  );
}
