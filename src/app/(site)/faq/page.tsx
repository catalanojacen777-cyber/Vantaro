import type { Metadata } from 'next';
import { billingState, config, formatPrice } from '@/config/site';
import { FaqSearch } from '@/components/marketing/faq-search';
import { PageHero } from '@/components/marketing/page-parts';
import { JsonLd } from '@/components/ui/json-ld';
import { getFaqs } from '@/content/faq';
import { faqLd, pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Frequently asked questions',
  description: 'How Vantaro works, what the results include, limits and pricing, and how your data is handled.',
  path: '/faq',
});

export default function FaqPage() {
  const faqs = getFaqs({
    anonPerDay: config.limits.anonymousGenerationsPerDay,
    freePerDay: config.limits.free.generationsPerDay,
    freeStrategies: config.limits.free.strategiesPer30Days,
    price: formatPrice(),
    refundDays: config.billing.refundDays,
    billingReady: billingState().ready,
    languages: config.ai.outputLanguages,
  });
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }]} title="Questions, answered plainly" />
      <section className="container" style={{ maxWidth: 860 + 64 }}>
        <FaqSearch items={faqs} />
      </section>
      <JsonLd data={faqLd(faqs)} />
    </>
  );
}
