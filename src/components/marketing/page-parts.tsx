import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/icons';
import { JsonLd } from '@/components/ui/json-ld';
import { breadcrumbLd } from '@/lib/seo';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';

export function Crumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="crumbs-site" role="list">
          {items.map((it, i) => (
            <li key={it.path} className="cluster" style={{ '--gap': '6px' } as React.CSSProperties}>
              {i < items.length - 1 ? (
                <>
                  <Link href={it.path}>{it.name}</Link>
                  <Icon.ChevronRight />
                </>
              ) : (
                <span aria-current="page">{it.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(items)} />
    </>
  );
}

export function PageHero({
  crumbs,
  title,
  lead,
  answer,
  children,
}: {
  crumbs?: { name: string; path: string }[];
  title: ReactNode;
  lead?: ReactNode;
  answer?: string;
  children?: ReactNode;
}) {
  return (
    <header className="container page-hero">
      {crumbs ? <Crumbs items={crumbs} /> : null}
      <h1 style={{ maxWidth: '20ch' }}>{title}</h1>
      {lead ? <p className="lead">{lead}</p> : null}
      {answer ? <p className="answer">{answer}</p> : null}
      {children}
    </header>
  );
}

export function ToolLinks({ slugs, title = 'Related tools' }: { slugs: string[]; title?: string }) {
  const tools = slugs.map((s) => TOOL_BY_SLUG[s]).filter(Boolean);
  if (!tools.length) return null;
  return (
    <section aria-label={title}>
      <h2 className="sv-label" style={{ marginBottom: 'var(--s3)' }}>
        {title}
      </h2>
      <ul className="tool-list" role="list" style={{ gridTemplateColumns: '1fr' }}>
        {tools.map((t) => (
          <li key={t.slug}>
            <Link href={`/tools/${t.slug}`} className="tool-row">
              <span>
                <strong>{t.name}</strong>
                <p>{t.summary}</p>
              </span>
              <Icon.ChevronRight />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StrategyCta({ title = 'Build a strategy from your own brief', body = 'Describe your business once. Get positioning, personas, channels and a prioritized plan, saved section by section.' }: { title?: string; body?: string }) {
  return (
    <div className="panel panel-pad panel-chrome stack" style={{ '--stack': '12px' } as React.CSSProperties}>
      <h2 style={{ fontSize: '1.2rem', fontStretch: '106%' }}>{title}</h2>
      <p className="small muted">{body}</p>
      <Link href="/signup?next=%2Fapp%2Fbrief" className="btn btn-primary btn-block">
        Build my strategy
      </Link>
      <Link href="/examples/strategy/window-and-solar-cleaning" className="link-quiet small">
        See a sample strategy
      </Link>
    </div>
  );
}

export function GuideBody({ blocks }: { blocks: import('@/content/resources').Block[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'p':
            return <p key={i}>{b.text}</p>;
          case 'h2':
            return <h2 key={i}>{b.text}</h2>;
          case 'ul':
            return (
              <ul key={i}>
                {b.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i}>
                {b.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ol>
            );
          case 'callout':
            return (
              <p key={i} className="callout">
                {b.text}
              </p>
            );
          case 'table':
            return (
              <div key={i} className="table-wrap" tabIndex={0} role="region" aria-label={`Table: ${b.head.join(', ')}`}>
                <table className="table">
                  <thead>
                    <tr>
                      {b.head.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r) => (
                      <tr key={r[0]}>
                        {r.map((c, ci) => (ci === 0 ? <th key={ci} scope="row" style={{ background: 'transparent', color: 'var(--bone)', whiteSpace: 'normal' }}>{c}</th> : <td key={ci}>{c}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
