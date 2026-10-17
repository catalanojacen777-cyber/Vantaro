import type { Metadata } from 'next';
import Link from 'next/link';
import { StrategyDocument } from '@/components/app/strategy-document';
import { Wordmark } from '@/components/ui/brand';
import { resolveShare } from '@/lib/shares';
import '@/styles/app.css';
import '@/styles/site.css';

export const metadata: Metadata = { title: 'Shared strategy', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const strategy = resolveShare(token);
  return (
    <div>
      <header className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 68 }}>
        <Wordmark />
        <span className="sample-label">Read-only shared report</span>
      </header>
      <main id="main" className="container" style={{ paddingTop: 24, paddingBottom: 96 }}>
        {strategy ? (
          // The brief is deliberately not shown on shared pages.
          <StrategyDocument strategy={strategy} />
        ) : (
          <div className="empty" style={{ maxWidth: 560 }}>
            <h1 style={{ fontSize: '1.6rem' }}>This link is not available</h1>
            <p>The link may have expired or been revoked by its owner. Ask them for a new link.</p>
            <Link href="/" className="btn btn-secondary btn-sm">Go to Vantaro</Link>
          </div>
        )}
      </main>
    </div>
  );
}
