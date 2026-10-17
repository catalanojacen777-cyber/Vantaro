import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/marketing/page-parts';
import { SOLUTIONS } from '@/content/solutions';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Who Vantaro is for',
  description: 'How solo founders, SaaS teams, agencies, service businesses, creators and ecommerce brands use Vantaro.',
  path: '/solutions',
});

export default function SolutionsIndex() {
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Solutions', path: '/solutions' }]} title="Who Vantaro is for" answer="Vantaro is built for small teams that do their own marketing: solo founders, early SaaS teams, agencies, service businesses, creators and online stores." />
      <section className="container section-tight">
        <div className="card-grid">
          {SOLUTIONS.map((s) => (
            <Link key={s.slug} href={`/solutions/${s.slug}`} className="link-card spot">
              <h3>{s.name}</h3>
              <p>{s.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
