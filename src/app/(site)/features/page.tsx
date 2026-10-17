import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, StrategyCta } from '@/components/marketing/page-parts';
import { FEATURES } from '@/content/features';
import { SECTIONS } from '@/lib/strategy/sections';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Features',
  description: 'Everything Vantaro does: marketing strategy, audience research, positioning, branding, ad copy, landing pages, funnels, campaign planning and transparent calculators.',
  path: '/features',
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Features', path: '/features' }]}
        title="Everything you need to decide what to do next"
        answer="Vantaro has two parts: a marketing strategy generated from your business brief, and 34 focused tools for specific jobs. Both separate facts you provided from hypotheses, and both save into the same workspace."
      />
      <section className="container section-tight">
        <h2 className="mb-6">The strategy</h2>
        <ol className="card-grid" role="list">
          {SECTIONS.map((s) => (
            <li key={s.key} className="link-card">
              <h3>{s.title}</h3>
              <p>{s.summary}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <Link href="/marketing-strategy" className="btn btn-secondary">
            How the strategy works
          </Link>
        </div>
      </section>
      <section className="container section-tight">
        <h2 className="mb-6">Capabilities</h2>
        <div className="card-grid">
          {FEATURES.map((f) => (
            <Link key={f.slug} href={`/features/${f.slug}`} className="link-card spot">
              <h3>{f.name}</h3>
              <p>{f.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="container section-tight" style={{ maxWidth: 560 + 64 }}>
        <StrategyCta />
      </section>
    </>
  );
}
