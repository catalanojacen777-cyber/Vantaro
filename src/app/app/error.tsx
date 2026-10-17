'use client';

import Link from 'next/link';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const notFound = /not found/i.test(error.message);
  return (
    <div className="empty" style={{ maxWidth: 620 }}>
      <h1 style={{ fontSize: '1.5rem' }}>{notFound ? 'We could not find that' : 'Something went wrong'}</h1>
      <p>{notFound ? 'It may have been deleted, or it belongs to a different workspace.' : 'Your saved work is safe. Try again in a moment.'}</p>
      <div className="cluster">
        <button className="btn btn-primary btn-sm" onClick={() => reset()}>Try again</button>
        <Link href="/app" className="btn btn-secondary btn-sm">Overview</Link>
      </div>
    </div>
  );
}
