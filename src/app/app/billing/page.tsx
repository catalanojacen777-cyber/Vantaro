import type { Metadata } from 'next';
import Link from 'next/link';
import { billingState, config, formatPrice } from '@/config/site';
import { BuyButton } from '@/components/marketing/buy-button';
import { PageHeader } from '@/components/app/page-header';
import { PendingPurchase } from '@/components/app/pending-purchase';
import { Icon } from '@/components/ui/icons';
import { requireWorkspace } from '@/lib/auth/session';
import { billingSummary } from '@/lib/billing';
import { getPlan, usageSummary } from '@/lib/usage';

export const metadata: Metadata = { title: 'Billing' };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { user } = await requireWorkspace();
  const { checkout } = await searchParams;
  const state = billingState();
  const plan = getPlan(user.id);
  const { entitlement, purchases } = billingSummary(user.id);
  const pending = purchases.some((p) => p.status === 'pending');
  const actor = { type: 'user' as const, userId: user.id, plan };
  const gen = usageSummary(actor, 'generation');
  const strat = usageSummary(actor, 'strategy');
  const price = formatPrice();
  return (
    <>
      <PageHeader title="Billing" description="Your plan, limits and purchases. Purchase status is confirmed directly with the payment provider." />
      {checkout === 'success' && plan !== 'paid' ? <PendingPurchase /> : null}
      {checkout === 'cancelled' ? <div className="notice mb-5"><Icon.Info /><span>Checkout was cancelled. You have not been charged.</span></div> : null}
      <div className="stack" style={{ '--stack': '20px' } as React.CSSProperties}>
        <section className="panel panel-pad">
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <div>
              <p className="small muted">Current plan</p>
              <h2 style={{ fontSize: '1.5rem' }}>{plan === 'paid' ? config.billing.planName : 'Free'}</h2>
            </div>
            {entitlement && !entitlement.revoked_at && !entitlement.livemode ? <span className="tag tag-warn">Test-mode purchase, not a real payment</span> : null}
          </div>
          <dl className="sv-dl sv-dl-wide mt-5">
            <div><dt>Generations today</dt><dd className="nums">{gen.used} of {gen.limit}</dd></div>
            <div><dt>Strategies, last 30 days</dt><dd className="nums">{strat.used} of {strat.limit}</dd></div>
          </dl>
          {entitlement?.revoked_at ? <p className="small muted mt-4">Paid access ended on {new Date(entitlement.revoked_at).toLocaleDateString()} ({entitlement.revoke_reason}).</p> : null}
        </section>
        {plan !== 'paid' ? (
          <section className="panel panel-pad stack" style={{ '--stack': '12px' } as React.CSSProperties}>
            <h2 style={{ fontSize: '1.15rem' }}>{config.billing.planName}</h2>
            {state.ready && price ? (
              <p className="muted">One-time purchase of {price}. Raises your limits to {config.limits.paid.generationsPerDay} generations a day and {config.limits.paid.strategiesPer30Days} strategies every 30 days.</p>
            ) : (
              <p className="muted">Paid access is not available yet. <Link className="text-link" href="/pricing">See pricing</Link>.</p>
            )}
            {state.testMode && state.ready ? <p className="xs subtle">Test mode: use the payment provider’s test cards. No real charges are made.</p> : null}
            <div><BuyButton ready={state.ready && !pending} /></div>
            {pending && checkout !== 'success' ? <p className="xs subtle">A checkout was started and is not finished. If you completed payment, confirmation can take a moment.</p> : null}
          </section>
        ) : null}
        <section className="panel panel-pad">
          <h2 style={{ fontSize: '1.15rem' }} className="mb-4">Purchases</h2>
          {purchases.length === 0 ? (
            <p className="small muted">No purchases.</p>
          ) : (
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Purchases">
              <table className="table">
                <thead><tr><th scope="col">Date</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Mode</th></tr></thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="nums">{p.amount !== null && p.currency ? new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency.toUpperCase() }).format(p.amount / 100) : '—'}</td>
                      <td>{p.status}</td>
                      <td>{p.livemode ? 'Live' : 'Test'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {config.billing.refundDays !== null ? <p className="xs subtle mt-4">Refunds within {config.billing.refundDays} days: <Link className="text-link" href="/contact">contact us</Link>.</p> : null}
        </section>
      </div>
    </>
  );
}
