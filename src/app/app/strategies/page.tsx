import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/app/page-header';
import { Icon } from '@/components/ui/icons';
import { requireWorkspace } from '@/lib/auth/session';
import { listStrategies } from '@/lib/strategy/repo';

export const metadata: Metadata = { title: 'Strategies' };

export default async function StrategiesPage({ searchParams }: { searchParams: Promise<{ q?: string; archived?: string }> }) {
  const { workspace } = await requireWorkspace();
  const sp = await searchParams;
  const archived = sp.archived === '1';
  const q = sp.q?.slice(0, 100) ?? '';
  const items = listStrategies(workspace.id, { q, archived });
  return (
    <>
      <PageHeader
        title="Strategies"
        description="Each strategy is generated from your business brief at the time you build it."
        actions={
          <Link href="/app/brief" className="btn btn-primary">
            <Icon.Plus /> New strategy
          </Link>
        }
      />
      <div className="cluster mb-5" style={{ justifyContent: 'space-between' }}>
        <nav className="tabs" aria-label="Strategy filter">
          <Link className="tab" href={`/app/strategies${q ? `?q=${encodeURIComponent(q)}` : ''}`} aria-current={!archived ? 'page' : undefined} style={!archived ? { background: 'var(--slate-2)', color: 'var(--bone)' } : undefined}>
            Active
          </Link>
          <Link className="tab" href={`/app/strategies?archived=1${q ? `&q=${encodeURIComponent(q)}` : ''}`} aria-current={archived ? 'page' : undefined} style={archived ? { background: 'var(--slate-2)', color: 'var(--bone)' } : undefined}>
            Archived
          </Link>
        </nav>
        <form role="search" className="cluster" style={{ flexWrap: 'nowrap', flex: '1 1 260px', maxWidth: 380, minWidth: 0 }}>
          {archived ? <input type="hidden" name="archived" value="1" /> : null}
          <label className="sr-only" htmlFor="strategy-q">
            Search strategies
          </label>
          <input id="strategy-q" name="q" defaultValue={q} className="input" placeholder="Search strategies" style={{ minWidth: 0, flex: 1 }} maxLength={100} />
          <button className="btn btn-secondary">Search</button>
        </form>
      </div>
      {items.length ? (
        <ul className="row-list" role="list">
          {items.map((s) => (
            <li key={s.id}>
              <Link href={`/app/strategies/${s.id}`} className="row">
                <div style={{ minWidth: 0 }}>
                  <div className="row-title">{s.title}</div>
                  <div className="row-meta">
                    <span>Created {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>{s.ready_sections} of 11 sections ready</span>
                  </div>
                </div>
                <span className="cluster" style={{ '--gap': '6px' } as React.CSSProperties}>
                  {s.status === 'generating' ? <span className="tag tag-ice">Generating</span> : null}
                  {s.status === 'partial' ? <span className="tag tag-warn">Incomplete</span> : null}
                  {s.status === 'failed' ? <span className="tag tag-danger">Failed</span> : null}
                  {s.generation_mode === 'preview' ? <span className="tag tag-warn">Preview</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <h3>{q ? `No strategies match “${q}”` : archived ? 'Nothing archived' : 'No strategies yet'}</h3>
          <p>{q ? 'Try a different word, or clear the search.' : archived ? 'Archived strategies appear here. Archive one from its menu to tidy your list.' : 'Complete your business brief, then build your first strategy.'}</p>
          {!q && !archived ? (
            <Link href="/app/brief" className="btn btn-primary btn-sm">
              Go to the brief
            </Link>
          ) : null}
        </div>
      )}
    </>
  );
}
