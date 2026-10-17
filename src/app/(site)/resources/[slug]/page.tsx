import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GuideBody, PageHero, StrategyCta, ToolLinks } from '@/components/marketing/page-parts';
import { JsonLd } from '@/components/ui/json-ld';
import { FEATURE_BY_SLUG } from '@/content/features';
import { GUIDES, GUIDE_BY_SLUG } from '@/content/resources';
import { articleLd, pageMeta } from '@/lib/seo';

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = GUIDE_BY_SLUG[(await params).slug];
  return g ? pageMeta({ title: g.title, description: g.description, path: `/resources/${g.slug}`, type: 'article', publishedTime: g.published, modifiedTime: g.updated }) : {};
}

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = GUIDE_BY_SLUG[(await params).slug];
  if (!g) notFound();
  const path = `/resources/${g.slug}`;
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Resources', path: '/resources' }, { name: g.title, path }]} title={g.title} answer={g.answer}>
        <p className="meta-row">
          <span>Published <time dateTime={g.published}>{fmt(g.published)}</time></span>
          {g.updated !== g.published ? <span>Updated <time dateTime={g.updated}>{fmt(g.updated)}</time></span> : null}
          <span>{g.readMinutes} min read</span>
        </p>
      </PageHero>
      <div className="container two-col">
        <article>
          <GuideBody blocks={g.body} />
          <div className="cluster mt-7">
            {g.related.features.map((f) => FEATURE_BY_SLUG[f] ? <Link key={f} className="btn btn-secondary btn-sm" href={`/features/${f}`}>{FEATURE_BY_SLUG[f].name}</Link> : null)}
          </div>
        </article>
        <aside className="aside">
          <ToolLinks slugs={g.related.tools} title="Apply it with" />
          <StrategyCta />
        </aside>
      </div>
      <JsonLd data={articleLd({ title: g.title, description: g.description, path, published: g.published, modified: g.updated })} />
    </>
  );
}
