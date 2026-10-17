import type { Metadata } from 'next';
import { PageHero } from '@/components/marketing/page-parts';
import { ToolDirectory } from '@/components/marketing/tool-directory';
import { pageMeta } from '@/lib/seo';
import { CATEGORY_ORDER, toolIndex } from '@/lib/tools/registry';
import { CATEGORIES } from '@/lib/tools/types';

export const metadata: Metadata = pageMeta({
  title: 'Free marketing tools',
  description: '34 free marketing and business tools: idea validation, personas, positioning, ad copy, landing pages, funnels, plans and transparent calculators. No account needed.',
  path: '/free-tools',
});

export default function FreeToolsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Free tools', path: '/free-tools' }]}
        title="Free marketing tools"
        answer="Thirty-four free tools: thirty-one AI tools for strategy, audience, branding, content, advertising, conversion and planning, plus three calculators that show every formula. Try them without an account; sign up free to save results."
      />
      <section className="container">
        <ToolDirectory tools={toolIndex()} categories={CATEGORY_ORDER.map((k) => ({ key: k, ...CATEGORIES[k] }))} />
      </section>
    </>
  );
}
