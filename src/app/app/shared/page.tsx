import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/app/page-header';
import { RevokeButton } from '@/components/app/revoke-button';
import { requireWorkspace } from '@/lib/auth/session';
import { listShares } from '@/lib/shares';

export const metadata: Metadata = { title: 'Shared reports' };

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default async function SharedPage() {
  const { workspace } = await requireWorkspace();
  const shares = listShares(workspace.id);
  const nowIso = new Date().toISOString();
  return (
    <>
      <PageHeader title="Shared reports" description="Read-only links you have created. Revoke any link to stop it working immediately. For security, links are shown only once, when created." />
      {shares.length === 0 ? (
        <div className="empty"><h3>No shared links</h3><p>Open a strategy and choose Share to create a read-only link.</p></div>
      ) : (
        <ul className="row-list" role="list">
          {shares.map((s) => {
            const state = s.revoked_at ? 'Revoked' : s.expires_at && s.expires_at < nowIso ? 'Expired' : 'Active';
            return (
              <li key={s.id} className="row">
                <div style={{ minWidth: 0 }}>
                  <Link href={`/app/strategies/${s.strategy_id}`} className="row-title" style={{ display: 'block' }}>{s.strategy_title}</Link>
                  <div className="row-meta">
                    <span>Created {fmt(s.created_at)}</span>
                    <span>{s.expires_at ? `Expires ${fmt(s.expires_at)}` : 'No expiry'}</span>
                    <span>{s.last_viewed_at ? `Last viewed ${fmt(s.last_viewed_at)}` : 'Not viewed yet'}</span>
                  </div>
                </div>
                <span className="cluster">
                  <span className={`tag ${state === 'Active' ? 'tag-ok' : ''}`}>{state}</span>
                  {state === 'Active' && workspace.role !== 'viewer' ? <RevokeButton id={s.id} /> : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
