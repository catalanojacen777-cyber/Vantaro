'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/client-api';
import { toast } from '@/components/ui/toast';

export function BuyButton({ ready }: { ready: boolean }) {
  const [pending, setPending] = useState(false);
  if (!ready) {
    return (
      <button className="btn btn-secondary" disabled aria-disabled="true">
        Not available yet
      </button>
    );
  }
  async function buy() {
    setPending(true);
    try {
      const res = await api<{ url: string }>('/api/billing/checkout', { body: {} });
      window.location.href = res.url;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = `/signup?next=${encodeURIComponent('/app/billing')}`;
        return;
      }
      toast((err as Error).message, 'error');
      setPending(false);
    }
  }
  return (
    <button className="btn btn-primary" onClick={buy} disabled={pending} aria-busy={pending}>
      {pending ? <span className="spinner" aria-hidden="true" /> : null} Continue to checkout
    </button>
  );
}
