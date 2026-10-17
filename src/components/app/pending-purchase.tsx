'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/icons';

/** After checkout we wait for the verified webhook rather than trusting the redirect. */
export function PendingPurchase() {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries >= 20) return;
    const t = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [tries, router]);
  return (
    <div className="notice notice-ice mb-5" role="status">
      {tries < 20 ? <span className="spinner" aria-hidden="true" /> : <Icon.Info />}
      <span>
        {tries < 20
          ? 'Waiting for the payment provider to confirm your purchase. This page updates automatically.'
          : 'We have not received confirmation yet. If you were charged, it will appear shortly; contact us if it does not.'}
      </span>
    </div>
  );
}
