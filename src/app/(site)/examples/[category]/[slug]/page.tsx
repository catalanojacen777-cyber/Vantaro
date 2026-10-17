import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SampleStrategyExplorer } from '@/components/marketing/home-islands';
import { PageHero, StrategyCta, ToolLinks } from '@/components/marketing/page-parts';
import { JsonLd } from '@/components/ui/json-ld';
import { StructuredView } from '@/components/ui/structured-view';
import { EXAMPLES, EXAMPLE_CATEGORIES, getExample } from '@/content/examples';
import { SAMPLE_BRIEF, SAMPLE_SECTIONS } from '@/content/sample-strategy';
import { articleLd, pageMeta } from '@/lib/seo';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';

export const dynamicParams = false;
export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ category: e.category, slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const e = getExample(category, slug);
  return e ? pageMeta({ title: e.title, description: e.description, path: `/examples/${category}/${slug}`, type: 'article', modifiedTime: e.updated }) : {};
}

export default async function ExamplePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const e = getExample(category, slug);
  if (!e) notFound();
  const tool = e.toolSlug ? TOOL_BY_SLUG[e.toolSlug] : null;
  const inputs = e.kind === 'strategy'
    ? {
        'Business': SAMPLE_BRIEF.businessName!,
        'What it sells': SAMPLE_BRIEF.productDescription!,
        'Customers': SAMPLE_BRIEF.customerType!,
        'Stage': SAMPLE_BRIEF.stage!,
        'Objective': `${SAMPLE_BRIEF.objective}: ${SAMPLE_BRIEF.objectiveDetail}`,
        'Budget': SAMPLE_BRIEF.budget!,
        'Constraints': SAMPLE_BRIEF.constraints!,
      }
    : e.inputs;
  const path = `/examples/${category}/${slug}`;
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Examples', path: '/examples' }, { name: EXAMPLE_CATEGORIES[category], path: `/examples/${category}` }, { name: e.title, path }]}
        title={e.title}
        lead={e.description}
      >
        <p className="meta-row"><span className="sample-label">Illustrative example, fictional business</span><span>Updated {new Date(`${e.updated}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span></p>
      </PageHero>
      <div className="container two-col">
        <div className="stack" style={{ '--stack': '48px' } as React.CSSProperties}>
          <section aria-labelledby="biz-h">
            <h2 id="biz-h" className="mb-3">The business</h2>
            <p className="muted measure">{e.business}</p>
          </section>
          <section aria-labelledby="in-h">
            <h2 id="in-h" className="mb-4">Inputs</h2>
            <dl className="sv-dl sv-dl-wide">
              {Object.entries(inputs).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="out-h">
            <h2 id="out-h" className="mb-5">Output</h2>
            {e.kind === 'strategy' ? (
              <SampleStrategyExplorer sections={SAMPLE_SECTIONS} />
            ) : tool && tool.kind === 'ai' ? (
              <div className="panel panel-pad">
                <StructuredView view={tool.view} data={e.output} />
              </div>
            ) : null}
          </section>
          <section aria-labelledby="notes-h">
            <h2 id="notes-h" className="mb-4">What to notice</h2>
            <ul className="prose" style={{ paddingLeft: '1.2em' }}>
              {e.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </section>
        </div>
        <aside className="aside">
          {tool ? (
            <div className="panel panel-pad stack" style={{ '--stack': '10px' } as React.CSSProperties}>
              <h2 style={{ fontSize: '1.1rem' }}>Make your own</h2>
              <p className="small muted">This example uses the {tool.name}. Run it with your own business details, free.</p>
              <Link href={`/tools/${tool.slug}`} className="btn btn-primary btn-block">Open the {tool.name}</Link>
            </div>
          ) : (
            <StrategyCta />
          )}
          {tool ? <ToolLinks slugs={tool.related} title="Related tools" /> : <ToolLinks slugs={['user-persona-generator', 'value-proposition-generator', 'marketing-plan-generator']} />}
        </aside>
      </div>
      <JsonLd data={articleLd({ title: e.title, description: e.description, path, published: e.updated, modified: e.updated })} />
    </>
  );
}
