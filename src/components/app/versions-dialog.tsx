'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Strategy } from '@/lib/strategy/repo';
import { api } from '@/lib/client-api';
import { Dialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';

type Version = { id: string; label: string; created_at: string };

export function VersionsDialog({ strategyId, onClose, onRestored, busy }: { strategyId: string; onClose: () => void; onRestored: (s: Strategy) => void; busy: boolean }) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [label, setLabel] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const load = useCallback(() => api<{ versions: Version[] }>(`/api/strategies/${strategyId}/versions`).then((r) => setVersions(r.versions)), [strategyId]);
  useEffect(() => {
    load().catch(() => setVersions([]));
  }, [load]);

  async function saveVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setPending('save');
    try {
      await api(`/api/strategies/${strategyId}/versions`, { body: { label } });
      setLabel('');
      toast('Version saved');
      await load();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setPending(null);
    }
  }

  async function restore(id: string) {
    setPending(id);
    try {
      const res = await api<{ strategy: Strategy }>(`/api/strategies/${strategyId}/versions/${id}/restore`, { body: {} });
      onRestored(res.strategy);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setPending(null);
    }
  }

  return (
    <Dialog
      title="Versions"
      description="Versions are saved when a strategy is generated, before a section is regenerated, before a restore, and whenever you save one yourself. Restoring keeps a copy of the current state first."
      onClose={onClose}
      wide
    >
      <form className="cluster" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }} onSubmit={saveVersion}>
        <label className="field grow">
          <span className="field-label">Save the current state as</span>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Before team review" maxLength={120} />
        </label>
        <button className="btn btn-secondary" disabled={!label.trim() || pending === 'save'}>
          Save version
        </button>
      </form>
      {busy ? <p className="xs subtle mt-3">Finish editing or wait for generation to complete before restoring.</p> : null}
      <ul className="row-list mt-5" role="list">
        {versions === null ? (
          <li className="row">
            <div className="skeleton" style={{ height: 18, width: '50%' }} />
          </li>
        ) : versions.length === 0 ? (
          <li className="row small muted">No versions yet.</li>
        ) : (
          versions.map((v) => (
            <li key={v.id} className="row" style={{ padding: '10px 14px' }}>
              <div>
                <div className="small" style={{ fontWeight: 560 }}>
                  {v.label}
                </div>
                <div className="row-meta">{new Date(v.created_at).toLocaleString()}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => restore(v.id)} disabled={busy || pending !== null} aria-busy={pending === v.id}>
                Restore
              </button>
            </li>
          ))
        )}
      </ul>
    </Dialog>
  );
}
