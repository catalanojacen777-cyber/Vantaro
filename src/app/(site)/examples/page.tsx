import type { Metadata } from 'next';
import { ExampleLibrary } from '@/components/marketing/example-library';
import { PageHero } from '@/components/marketing/page-parts';
import { EXAMPLES, EXAMPLE_CATEGORIES } from '@/content/examples';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Examples',
  description: 'Annotated example outputs for fictional businesses: a complete marketing strategy, personas, value propositions, ad copy, a 90-day plan and a sales funnel.',
  path: '/examples',
});

export default function ExamplesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Examples', path: '/examples' }]}
        title="Examples, with notes on what makes them useful"
        answer="Each example shows a real Vantaro output format for a fictional business, written by our team, with notes on how to judge the quality of your own results. The businesses are invented; the structure is exactly what you get."
      />
      <section className="container">
        <ExampleLibrary
          items={EXAMPLES.map((e) => ({ href: `/examples/${e.category}/${e.slug}`, title: e.title, description: e.description, category: e.category }))}
          categories={Object.entries(EXAMPLE_CATEGORIES).map(([key, label]) => ({ key, label }))}
        />
      </section>
    </>
  );
}
