import type { Metadata } from 'next';
import Link from 'next/link';
import { billingState, config, formatPrice } from '@/config/site';
import { PageHero } from '@/components/marketing/page-parts';
import { BuyButton } from '@/components/marketing/buy-button';
import { Icon } from '@/components/ui/icons';
import { JsonLd } from '@/components/ui/json-ld';
import { pageMeta, softwareLd } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Pricing',
  description: 'Start free. See exactly what is included, the daily and monthly limits, and how paid access works.',
  path: '/pricing',
});

export default function PricingPage() {
  const billing = billingState();
  const price = formatPrice();
  const free = config.limits.free;
  const paid = config.limits.paid;
  const rows: [string, string, string][] = [
    ['AI generations per day', `${free.generationsPerDay}`, `${paid.generationsPerDay}`],
    ['Full strategies per 30 days', `${free.strategiesPer30Days}`, `${paid.strategiesPer30Days}`],
    ['Personas per strategy', `Up to ${free.personasPerStrategy}`, `Up to ${paid.personasPerStrategy}`],
    ['Workspaces', `${free.workspaces}`, `${paid.workspaces}`],
    ['Calculators', 'Unlimited', 'Unlimited'],
    ['Saved results, versions, sharing, action plan', 'Included', 'Included'],
    ['Markdown and print-to-PDF export', 'Included', 'Included'],
  ];
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Pricing', path: '/pricing' }]}
        title="Start free. Know your limits."
        answer={`Vantaro is free to start: ${free.generationsPerDay} AI generations a day and ${free.strategiesPer30Days} full ${free.strategiesPer30Days === 1 ? 'strategy' : 'strategies'} every 30 days. ${billing.ready && price ? `${config.billing.planName} is a one-time purchase of ${price} that raises those limits.` : `${config.billing.planName} will raise those limits; its price is not set yet, so it cannot be purchased.`}`}
      />
      <section className="container">
        {billing.testMode && config.deployment !== 'production' ? (
          <div className="notice notice-warn mb-6">
            <Icon.Info />
            <span><strong>Test mode.</strong> Checkout uses the payment provider’s test environment. No real charges are made.</span>
          </div>
        ) : null}
        <div className="plans">
          <div className="plan">
            <h2 style={{ fontSize: '1.2rem' }}>Free</h2>
            <div className="plan-price">$0</div>
            <p className="small muted">No card required. Anonymous visitors can also try tools: {config.limits.anonymousGenerationsPerDay} generations a day.</p>
            <ul>
              <li><Icon.Check /> {free.generationsPerDay} AI generations a day</li>
              <li><Icon.Check /> {free.strategiesPer30Days} full {free.strategiesPer30Days === 1 ? 'strategy' : 'strategies'} every 30 days</li>
              <li><Icon.Check /> All 34 tools and every strategy section</li>
            </ul>
            <Link href="/signup" className="btn btn-primary">Create a free account</Link>
          </div>
          <div className="plan">
            <h2 style={{ fontSize: '1.2rem' }}>{config.billing.planName}</h2>
            {billing.ready && price ? (
              <>
                <div className="plan-price">{price}</div>
                <p className="small muted">One-time purchase{config.billing.refundDays !== null ? `, refundable within ${config.billing.refundDays} days` : ''}.</p>
              </>
            ) : (
              <div className="notice">
                <Icon.Info />
                <span>Not available yet. The price{config.billing.refundDays === null ? ' and refund terms' : ''} will be shown here before purchase is possible.</span>
              </div>
            )}
            <ul>
              <li><Icon.Check /> {paid.generationsPerDay} AI generations a day</li>
              <li><Icon.Check /> {paid.strategiesPer30Days} strategies every 30 days</li>
              <li><Icon.Check /> Up to {paid.personasPerStrategy} personas per strategy</li>
              <li><Icon.Check /> {paid.workspaces} workspaces</li>
            </ul>
            <BuyButton ready={billing.ready} />
          </div>
        </div>
      </section>
      <section className="container section-tight" aria-labelledby="cmp-h">
        <h2 id="cmp-h" className="mb-5">Compare</h2>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Plan comparison">
          <table className="table">
            <thead><tr><th scope="col">Included</th><th scope="col">Free</th><th scope="col">{config.billing.planName}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]}><th scope="row" style={{ background: 'transparent', color: 'var(--bone)', whiteSpace: 'normal' }}>{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="prose mt-7">
          <h2>Why there are limits</h2>
          <p>Each generation calls an AI model, which has a real cost. Limits keep the free plan sustainable and protect the service from abuse. Failed or cancelled generations are not counted.</p>
          <h2>Access and retention</h2>
          <p>Your strategies and saved results stay in your workspace until you delete them or close your account. {config.billing.refundDays !== null ? `Refunds are available within ${config.billing.refundDays} days of purchase through the contact page.` : 'Refund terms will be published before paid access opens.'}</p>
        </div>
      </section>
      <JsonLd data={softwareLd({ name: 'Vantaro', description: config.site.description, path: '/pricing', price: billing.ready && config.billing.priceAmount && config.billing.priceCurrency ? { amount: config.billing.priceAmount, currency: config.billing.priceCurrency } : null })} />
    </>
  );
}
