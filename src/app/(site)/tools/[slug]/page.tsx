import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero, StrategyCta, ToolLinks } from '@/components/marketing/page-parts';
import { CalculatorLoader } from '@/components/tools/calculator-runner';
import { ToolRunnerLoader } from '@/components/tools/tool-runner';
import { Icon } from '@/components/ui/icons';
import { JsonLd } from '@/components/ui/json-ld';
import { ViewBeacon } from '@/components/ui/view-beacon';
import { EXAMPLES } from '@/content/examples';
import { pageMeta, softwareLd } from '@/lib/seo';
import { aiToolClient, calculatorClient } from '@/lib/tools/client-shape';
import { CATEGORIES } from '@/lib/tools/types';
import { TOOLS, TOOL_BY_SLUG } from '@/lib/tools/registry';

export const dynamicParams = false;
export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = TOOL_BY_SLUG[(await params).slug];
  if (!t) return {};
  return pageMeta({ title: `Free ${t.name}`, description: `${t.summary} ${t.kind === 'calculator' ? 'Every formula is shown.' : 'Free to try, no account needed.'}`, path: `/tools/${t.slug}` });
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const tool = TOOL_BY_SLUG[(await params).slug];
  if (!tool) notFound();
  const example = EXAMPLES.find((e) => e.toolSlug === tool.slug);
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Free tools', path: '/free-tools' }, { name: tool.name, path: `/tools/${tool.slug}` }]}
        title={tool.name}
        answer={tool.answer}
      />
      <section className="container" aria-label={`${tool.name} tool`}>
        {tool.kind === 'ai' ? <ToolRunnerLoader tool={aiToolClient(tool)} context="public" /> : <CalculatorLoader calc={calculatorClient(tool)} context="public" />}
        <ViewBeacon tool={tool.slug} />
      </section>
      <div className="container two-col section">
        <div className="stack" style={{ '--stack': '48px' } as React.CSSProperties}>
          <section aria-labelledby="inputs-h">
            <h2 id="inputs-h" className="mb-4">What it needs</h2>
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Inputs this tool needs">
              <table className="table">
                <thead>
                  <tr><th scope="col">Input</th><th scope="col">Required</th><th scope="col">Notes</th></tr>
                </thead>
                <tbody>
                  {tool.fields.map((f) => (
                    <tr key={f.name}>
                      <th scope="row" style={{ background: 'transparent', color: 'var(--bone)', whiteSpace: 'normal' }}>{f.label}</th>
                      <td>{f.required ? 'Yes' : 'No'}</td>
                      <td className="muted">{f.type === 'select' ? f.options.join(', ') : ('help' in f && f.help) || (f.type === 'number' ? 'A number' : 'Free text')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section aria-labelledby="out-h">
            <h2 id="out-h" className="mb-3">What you get</h2>
            <p className="muted measure">
              {tool.outputLabel}, shown on this page. {tool.kind === 'ai' ? 'Copy them, download them as Markdown, or save them to a free workspace.' : 'Results update as you type; save them to a free workspace to keep them.'}
            </p>
            {tool.kind === 'calculator' ? (
              <>
                <h3 className="mt-6 mb-3" style={{ fontSize: '1.05rem' }}>Methodology</h3>
                <ul className="sv-bullets">
                  {tool.methodology.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </>
            ) : null}
          </section>
          <section aria-labelledby="lim-h">
            <h2 id="lim-h" className="mb-3">Limits</h2>
            <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
              {tool.limitations.map((l) => (
                <li key={l} className="cluster muted" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><Icon.Info width={16} height={16} style={{ flex: 'none', marginTop: 4 }} /> {l}</li>
              ))}
              {tool.kind === 'ai' ? (
                <li className="cluster muted" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><Icon.Info width={16} height={16} style={{ flex: 'none', marginTop: 4 }} /> AI output can be wrong. Check facts and figures before you use them.</li>
              ) : null}
            </ul>
          </section>
          {example ? (
            <section aria-labelledby="ex-h">
              <h2 id="ex-h" className="mb-3">See a worked example</h2>
              <Link href={`/examples/${example.category}/${example.slug}`} className="link-card spot">
                <h3>{example.title}</h3>
                <p>{example.description}</p>
              </Link>
            </section>
          ) : null}
        </div>
        <aside className="aside">
          <p className="small muted">Category: {CATEGORIES[tool.category].label}</p>
          <ToolLinks slugs={tool.related} title="Use it with" />
          <StrategyCta />
        </aside>
      </div>
      <JsonLd data={softwareLd({ name: tool.name, description: tool.summary, path: `/tools/${tool.slug}`, free: true })} />
    </>
  );
}
