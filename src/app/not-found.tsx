import Link from 'next/link';
import '@/styles/site.css';
import { Wordmark } from '@/components/ui/brand';

export default function NotFound() {
  return (
    <div className="container">
      <header style={{ minHeight: 68, display: 'flex', alignItems: 'center' }}>
        <Wordmark />
      </header>
      <main id="main" className="not-found">
        <div className="stack" style={{ maxWidth: 560 }}>
          <p className="small muted">404</p>
          <h1>That page is not here</h1>
          <p className="lead">The link may be old, or the page may have moved. These are the most useful places to go next.</p>
          <div className="cluster">
            <Link href="/" className="btn btn-primary">Home</Link>
            <Link href="/free-tools" className="btn btn-secondary">Free tools</Link>
            <Link href="/examples" className="btn btn-secondary">Examples</Link>
            <Link href="/app" className="btn btn-ghost">Your workspace</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
