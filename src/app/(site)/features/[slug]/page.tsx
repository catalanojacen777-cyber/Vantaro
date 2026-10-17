import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero, StrategyCta, ToolLinks } from '@/components/marketing/page-parts';
import { Icon } from '@/components/ui/icons';
import { FEATURES, FEATURE_BY_SLUG } from '@/content/features';
import { SECTION_BY_KEY } from '@/lib/strategy/sections';
import { pageMeta } from '@/lib/seo';

export const dynamicParams = false;
export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const f = FEATURE_BY_SLUG[(await params).slug];
  return f ? pageMeta({ title: `${f.name}: ${f.title}`, description: f.description, path: `/features/${f.slug}` }) : {};
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const f = FEATURE_BY_SLUG[(await params).slug];
  if (!f) notFound();
  const others = FEATURES.filter((x) => x.slug !== f.slug).slice(0, 4);
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Features', path: '/features' }, { name: f.name, path: `/features/${f.slug}` }]}
        title={f.title}
        answer={f.answer}
      >
        <div className="cluster mt-2">
          <Link href="/signup?next=%2Fapp%2Fbrief" className="btn btn-primary">Build my strategy</Link>
          {f.tools[0] ? <Link href={`/tools/${f.tools[0]}`} className="btn btn-secondary">Try a free tool</Link> : null}
        </div>
      </PageHero>
      <div className="container two-col">
        <div className="stack" style={{ '--stack': '56px' } as React.CSSProperties}>
          <section aria-labelledby="out-h">
            <h2 id="out-h" className="mb-5">What you get</h2>
            <div className="outcomes">
              {f.outcomes.map((o) => (
                <div key={o.title} className="outcome">
                  <h3>{o.title}</h3>
                  <p>{o.body}</p>
                </div>
              ))}
            </div>
          </section>
          <section aria-labelledby="how-h">
            <h2 id="how-h" className="mb-5">How it works</h2>
            <ol className="steps">
              {f.steps.map((s) => (
                <li key={s}><span>{s}</span></li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="sec-h">
            <h2 id="sec-h" className="mb-3">Where it appears in your strategy</h2>
            <ul className="cluster" role="list">
              {f.sections.map((k) => (
                <li key={k} className="tag">{SECTION_BY_KEY[k]?.title}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="lim-h">
            <h2 id="lim-h" className="mb-3">Limits</h2>
            <ul className="prose" style={{ listStyle: 'none', padding: 0 }}>
              {f.limits.map((l) => (
                <li key={l} className="cluster" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}><Icon.Info width={16} height={16} style={{ marginTop: 5, flex: 'none', color: 'var(--pewter)' }} /> {l}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="faq-h">
            <h2 id="faq-h" className="mb-3">Questions</h2>
            <dl className="stack">
              {f.faqs.map((q) => (
                <div key={q.q} className="stack" style={{ '--stack': '6px' } as React.CSSProperties}>
                  <dt style={{ fontWeight: 600 }}>{q.q}</dt>
                  <dd className="muted">{q.a}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="more-h">
            <h2 id="more-h" className="mb-5">More capabilities</h2>
            <div className="card-grid">
              {others.map((o) => (
                <Link key={o.slug} href={`/features/${o.slug}`} className="link-card spot">
                  <h3>{o.name}</h3>
                  <p>{o.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <aside className="aside">
          <ToolLinks slugs={f.tools} title="Tools for this" />
          <StrategyCta />
        </aside>
      </div>
    </>
  );
}
