'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client-api';
import { Dialog } from '@/components/ui/dialog';
import { CopyButton } from '@/components/ui/copy-button';
import { Icon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';

type Share = { id: string; expires_at: string | null; revoked_at: string | null; created_at: string; last_viewed_at: string | null };

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export function ShareDialog({ strategyId, onClose }: { strategyId: string; onClose: () => void }) {
  const [expires, setExpires] = useState<'7' | '30' | '90' | 'never'>('30');
  const [created, setCreated] = useState<string | null>(null);
  const [shares, setShares] = useState<Share[] | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(() => api<{ shares: Share[] }>(`/api/strategies/${strategyId}/share`).then((r) => setShares(r.shares)), [strategyId]);
  useEffect(() => {
    load().catch(() => setShares([]));
  }, [load]);

  async function create() {
    setPending(true);
    try {
      const res = await api<{ url: string }>(`/api/strategies/${strategyId}/share`, { body: { expiresInDays: expires === 'never' ? null : Number(expires) } });
      setCreated(res.url);
      await load();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setPending(false);
    }
  }

  async function revoke(id: string) {
    try {
      await api(`/api/shares/${id}`, { method: 'DELETE' });
      toast('Link revoked');
      await load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const active = shares?.filter((s) => !s.revoked_at && (!s.expires_at || s.expires_at > new Date().toISOString())) ?? [];

  return (
    <Dialog
      title="Share a read-only link"
      description="Anyone with the link can view this strategy. They cannot edit it, see your business brief, or access your workspace. Shared pages are hidden from search engines."
      onClose={onClose}
      wide
    >
      {created ? (
        <div className="stack" style={{ '--stack': '10px' } as React.CSSProperties}>
          <label className="field">
            <span className="field-label">Your new link</span>
            <div className="cluster" style={{ flexWrap: 'nowrap' }}>
              <input className="input" readOnly value={created} onFocus={(e) => e.currentTarget.select()} />
              <CopyButton text={created} className="btn btn-primary" label="Copy link" />
            </div>
          </label>
          <p className="xs subtle">For security we only show a link once. Create a new one any time, and revoke links you no longer need.</p>
        </div>
      ) : (
        <div className="cluster" style={{ alignItems: 'flex-end' }}>
          <label className="field grow">
            <span className="field-label">Link expires</span>
            <select className="select" value={expires} onChange={(e) => setExpires(e.target.value as typeof expires)}>
              <option value="7">After 7 days</option>
              <option value="30">After 30 days</option>
              <option value="90">After 90 days</option>
              <option value="never">Never (until revoked)</option>
            </select>
          </label>
          <button className="btn btn-primary" onClick={create} disabled={pending} aria-busy={pending}>
            {pending ? <span className="spinner" aria-hidden="true" /> : <Icon.Link />} Create link
          </button>
        </div>
      )}

      <div className="mt-6">
        <h3 className="sv-label">Active links</h3>
        {shares === null ? (
          <div className="skeleton mt-3" style={{ height: 40 }} />
        ) : active.length === 0 ? (
          <p className="small muted mt-2">No active links.</p>
        ) : (
          <ul className="row-list mt-3" role="list">
            {active.map((s) => (
              <li key={s.id} className="row" style={{ padding: '10px 14px' }}>
                <div className="small">
                  Created {fmt(s.created_at)}
                  <div className="row-meta">
                    <span>{s.expires_at ? `Expires ${fmt(s.expires_at)}` : 'No expiry'}</span>
                    <span>{s.last_viewed_at ? `Last viewed ${fmt(s.last_viewed_at)}` : 'Not viewed yet'}</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => revoke(s.id)}>
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
