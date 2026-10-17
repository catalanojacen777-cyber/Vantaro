import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/marketing/page-parts';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({ title: 'About', description: 'Why Vantaro exists and the principles behind how it works.', path: '/about' });

export default function AboutPage() {
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]} title="Why Vantaro exists" />
      <section className="container">
        <div className="prose">
          <p>Most small businesses do not lack marketing ideas. They lack a clear order of operations: who to focus on first, what to say to them, where to say it, and how to tell whether it worked. Vantaro exists to make that order of operations easy to get to, and easy to revisit as the business changes.</p>
          <h2>How we build it</h2>
          <ul>
            <li><strong>Facts and guesses stay separate.</strong> Outputs mark what came from you and what is an inference to check.</li>
            <li><strong>No invented numbers.</strong> We do not fabricate statistics, search volumes, competitors or customer quotes. Calculators show every formula.</li>
            <li><strong>Your work is yours.</strong> Edit anything, keep versions, export to Markdown or PDF, and delete it whenever you want.</li>
            <li><strong>Plain language.</strong> If a recommendation cannot be explained simply, it is not ready to act on.</li>
          </ul>
          <h2>What Vantaro is not</h2>
          <p>It is not a replacement for talking to customers, and it does not run your ads, send your emails or change your accounts. It helps you decide and draft; you stay in charge of what goes out.</p>
          <p><Link className="text-link" href="/contact">Get in touch</Link> with questions or feedback.</p>
        </div>
      </section>
    </>
  );
}
