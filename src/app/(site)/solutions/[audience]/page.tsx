import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero, StrategyCta, ToolLinks } from '@/components/marketing/page-parts';
import { SOLUTIONS, SOLUTION_BY_SLUG } from '@/content/solutions';
import { pageMeta } from '@/lib/seo';

export const dynamicParams = false;
export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ audience: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ audience: string }> }): Promise<Metadata> {
  const s = SOLUTION_BY_SLUG[(await params).audience];
  return s ? pageMeta({ title: `Vantaro for ${s.name.toLowerCase()}`, description: s.description, path: `/solutions/${s.slug}` }) : {};
}

export default async function SolutionPage({ params }: { params: Promise<{ audience: string }> }) {
  const s = SOLUTION_BY_SLUG[(await params).audience];
  if (!s) notFound();
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Solutions', path: '/solutions' }, { name: s.name, path: `/solutions/${s.slug}` }]}
        title={s.title}
        answer={s.answer}
      >
        <div className="cluster mt-2">
          <Link href="/signup?next=%2Fapp%2Fbrief" className="btn btn-primary">Build my strategy</Link>
          {s.example ? <Link href={s.example.href} className="btn btn-secondary">{s.example.label}</Link> : null}
        </div>
      </PageHero>
      <div className="container two-col">
        <div className="stack" style={{ '--stack': '56px' } as React.CSSProperties}>
          <section aria-labelledby="ch-h">
            <h2 id="ch-h" className="mb-5">The usual problems</h2>
            <div className="outcomes">
              {s.challenges.map((c) => (
                <div key={c.title} className="outcome"><h3>{c.title}</h3><p>{c.body}</p></div>
              ))}
            </div>
          </section>
          <section aria-labelledby="wf-h">
            <h2 id="wf-h" className="mb-5">A workflow that fits</h2>
            <ol className="steps">
              {s.workflow.map((w) => (
                <li key={w.step}>
                  <span>
                    <strong style={{ fontWeight: 600 }}>{w.step}.</strong> <span className="muted">{w.detail}</span>{' '}
                    {w.link ? <Link className="text-link" href={w.link.href}>{w.link.label}</Link> : null}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="faq-h">
            <h2 id="faq-h" className="mb-3">Questions</h2>
            <dl className="stack">
              {s.faqs.map((q) => (
                <div key={q.q} className="stack" style={{ '--stack': '6px' } as React.CSSProperties}>
                  <dt style={{ fontWeight: 600 }}>{q.q}</dt>
                  <dd className="muted">{q.a}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="other-h">
            <h2 id="other-h" className="mb-4">Also built for</h2>
            <ul className="cluster" role="list">
              {SOLUTIONS.filter((o) => o.slug !== s.slug).map((o) => (
                <li key={o.slug}><Link className="btn btn-secondary btn-sm" href={`/solutions/${o.slug}`}>{o.name}</Link></li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="aside">
          <ToolLinks slugs={s.tools} title="Useful tools" />
          <StrategyCta />
        </aside>
      </div>
    </>
  );
}
