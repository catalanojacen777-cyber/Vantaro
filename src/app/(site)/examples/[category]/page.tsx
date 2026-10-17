import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/marketing/page-parts';
import { EXAMPLES, EXAMPLE_CATEGORIES } from '@/content/examples';
import { pageMeta } from '@/lib/seo';

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(EXAMPLE_CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const name = EXAMPLE_CATEGORIES[category];
  return name ? pageMeta({ title: `${name} examples`, description: `Annotated ${name.toLowerCase()} examples for fictional businesses.`, path: `/examples/${category}` }) : {};
}

export default async function ExampleCategory({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const name = EXAMPLE_CATEGORIES[category];
  if (!name) notFound();
  const items = EXAMPLES.filter((e) => e.category === category);
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Examples', path: '/examples' }, { name, path: `/examples/${category}` }]} title={`${name} examples`} />
      <section className="container">
        <div className="card-grid">
          {items.map((e) => (
            <Link key={e.slug} href={`/examples/${e.category}/${e.slug}`} className="link-card spot">
              <h3>{e.title}</h3>
              <p>{e.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
