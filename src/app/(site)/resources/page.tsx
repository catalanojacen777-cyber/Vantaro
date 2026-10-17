import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/marketing/page-parts';
import { GUIDES } from '@/content/resources';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({ title: 'Guides', description: 'Practical, original guides on positioning, idea validation, market sizing and choosing marketing channels.', path: '/resources' });

export default function ResourcesPage() {
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Resources', path: '/resources' }]} title="Guides for doing your own marketing well" answer="Short, practical guides that start with the answer, then show the method. Each one links to the tools that help you apply it." />
      <section className="container">
        <div className="card-grid">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/resources/${g.slug}`} className="link-card spot">
              <span className="xs subtle">{g.readMinutes} min read</span>
              <h2 style={{ fontSize: '1.15rem', fontStretch: '104%' }}>{g.title}</h2>
              <p>{g.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
