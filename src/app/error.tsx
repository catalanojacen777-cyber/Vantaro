'use client';

import Link from 'next/link';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="container" style={{ minHeight: '60dvh', display: 'grid', placeItems: 'center' }}>
      <div className="stack" style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: '1.8rem' }}>Something went wrong on our side</h1>
        <p className="muted">Your saved work is safe. Try again, or go back to the start.</p>
        <div className="cluster">
          <button className="btn btn-primary" onClick={() => reset()}>Try again</button>
          <Link href="/" className="btn btn-secondary">Home</Link>
        </div>
      </div>
    </main>
  );
}
