import type { ReactNode } from 'react';
import { asText, get, type FieldRef, type ViewBlock } from '@/lib/view';

const BASIS_LABEL: Record<string, string> = { provided: 'From your brief', hypothesis: 'Hypothesis' };

function Value({ v }: { v: unknown }): ReactNode {
  if (Array.isArray(v)) {
    if (!v.length) return null;
    return (
      <ul className="sv-bullets">
        {v.map((x, i) => (
          <li key={i}>{asText(x)}</li>
        ))}
      </ul>
    );
  }
  const t = asText(v);
  return t ? <span>{t}</span> : null;
}

function Badge({ field, value }: { field: FieldRef; value: unknown }) {
  const t = asText(value);
  if (!t) return null;
  const label = field.key === 'basis' ? BASIS_LABEL[t] ?? t : t;
  const tone =
    field.key === 'basis'
      ? t === 'provided'
        ? 'tag-ok'
        : 'tag-warn'
      : ['Primary', 'Now', 'High'].includes(t) && field.key !== 'effort'
        ? 'tag-ice'
        : '';
  return (
    <span className={`tag ${tone}`} title={field.label}>
      {field.key === 'basis' ? null : <span className="sr-only">{field.label}: </span>}
      {label}
    </span>
  );
}

export function StructuredView({ view, data, headingLevel = 3 }: { view: ViewBlock[]; data: unknown; headingLevel?: 3 | 4 }) {
  const H = `h${headingLevel}` as 'h3' | 'h4';
  return (
    <div className="sv">
      {view.map((b, bi) => {
        switch (b.kind) {
          case 'text': {
            const t = asText(get(data, b.key));
            if (!t) return null;
            return (
              <div key={bi} className="sv-block">
                {b.label ? <H className="sv-label">{b.label}</H> : null}
                <p className="sv-text">{t}</p>
              </div>
            );
          }
          case 'list': {
            const v = get(data, b.key);
            if (!Array.isArray(v) || !v.length) return null;
            const L = b.ordered ? 'ol' : 'ul';
            return (
              <div key={bi} className="sv-block">
                {b.label ? <H className="sv-label">{b.label}</H> : null}
                <L className={b.ordered ? 'sv-ordered' : 'sv-bullets'}>
                  {v.map((x, i) => (
                    <li key={i}>{asText(x)}</li>
                  ))}
                </L>
              </div>
            );
          }
          case 'cards': {
            const v = get(data, b.key);
            if (!Array.isArray(v) || !v.length) return null;
            return (
              <div key={bi} className="sv-block">
                {b.label ? <H className="sv-label">{b.label}</H> : null}
                <div className={`sv-cards${b.grid ? ' sv-cards-grid' : ''}`}>
                  {v.map((item, i) => (
                    <article key={i} className="sv-card">
                      <div className="sv-card-head">
                        <strong className="sv-card-title">{asText(get(item, b.title))}</strong>
                        {b.badges?.length ? (
                          <span className="cluster" style={{ '--gap': '6px' } as React.CSSProperties}>
                            {b.badges.map((f) => (
                              <Badge key={f.key} field={f} value={get(item, f.key)} />
                            ))}
                          </span>
                        ) : null}
                      </div>
                      {b.body && asText(get(item, b.body)) ? <p className="sv-card-body">{asText(get(item, b.body))}</p> : null}
                      {b.fields?.length ? (
                        <dl className="sv-dl">
                          {b.fields.map((f) => {
                            const fv = get(item, f.key);
                            if (!asText(fv)) return null;
                            return (
                              <div key={f.key}>
                                <dt>{f.label}</dt>
                                <dd>
                                  <Value v={fv} />
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            );
          }
          case 'fields': {
            const base = get(data, b.key);
            return (
              <div key={bi} className="sv-block">
                {b.label ? <H className="sv-label">{b.label}</H> : null}
                <dl className="sv-dl sv-dl-wide">
                  {b.fields.map((f) => {
                    const fv = get(base, f.key);
                    if (!asText(fv)) return null;
                    return (
                      <div key={f.key}>
                        <dt>{f.label}</dt>
                        <dd>
                          <Value v={fv} />
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            );
          }
          case 'table': {
            const v = get(data, b.key);
            if (!Array.isArray(v) || !v.length) return null;
            return (
              <div key={bi} className="sv-block">
                {b.label ? <H className="sv-label">{b.label}</H> : null}
                <div className="table-wrap" tabIndex={0} role="region" aria-label={b.label ? `${b.label} (table)` : 'Table'}>
                  <table className="table">
                    <thead>
                      <tr>
                        {b.columns.map((c) => (
                          <th key={c.key} scope="col">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {v.map((row, i) => (
                        <tr key={i}>
                          {b.columns.map((c, ci) =>
                            ci === 0 ? (
                              <th key={c.key} scope="row" style={{ background: 'transparent', whiteSpace: 'normal', color: 'var(--bone)' }}>
                                {asText(get(row, c.key))}
                              </th>
                            ) : (
                              <td key={c.key}>{asText(get(row, c.key))}</td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }
          case 'quad':
            return (
              <div key={bi} className="sv-block">
                {b.label ? <H className="sv-label">{b.label}</H> : null}
                <div className="sv-quad">
                  {b.cells.map((cell) => (
                    <section key={cell.key} className="sv-card">
                      <H className="sv-card-title">{cell.label}</H>
                      <Value v={get(data, cell.key)} />
                    </section>
                  ))}
                </div>
              </div>
            );
        }
      })}
    </div>
  );
}
