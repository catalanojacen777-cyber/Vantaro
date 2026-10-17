'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/client-api';
import { toast } from '@/components/ui/toast';

export function RevokeButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      className="btn btn-danger btn-sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await api(`/api/shares/${id}`, { method: 'DELETE' });
          toast('Link revoked');
          router.refresh();
        } catch (err) {
          toast((err as Error).message, 'error');
        } finally {
          setPending(false);
        }
      }}
    >
      Revoke
    </button>
  );
}
