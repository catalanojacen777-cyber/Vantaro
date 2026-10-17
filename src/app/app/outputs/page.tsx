import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/app/page-header';
import { Icon } from '@/components/ui/icons';
import { requireWorkspace } from '@/lib/auth/session';
import { listOutputs } from '@/lib/outputs/repo';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';

export const metadata: Metadata = { title: 'Saved outputs' };

export default async function OutputsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { workspace } = await requireWorkspace();
  const q = (await searchParams).q?.slice(0, 100) ?? '';
  const items = listOutputs(workspace.id, { q });
  return (
    <>
      <PageHeader title="Saved outputs" description="Tool results you saved. Search by title or content." actions={<Link href="/app/tools" className="btn btn-primary"><Icon.Wand /> Open tools</Link>} />
      <form role="search" className="cluster mb-5" style={{ flexWrap: 'nowrap' }}>
        <label htmlFor="out-q" className="sr-only">Search saved outputs</label>
        <input id="out-q" name="q" defaultValue={q} className="input" placeholder="Search saved outputs" style={{ maxWidth: 360 }} maxLength={100} />
        <button className="btn btn-secondary">Search</button>
      </form>
      {items.length ? (
        <ul className="row-list" role="list">
          {items.map((o) => (
            <li key={o.id}>
              <Link href={`/app/outputs/${o.id}`} className="row">
                <div style={{ minWidth: 0 }}>
                  <div className="row-title">{o.title}</div>
                  <div className="row-meta">
                    <span>{TOOL_BY_SLUG[o.tool_slug]?.name ?? o.tool_slug}</span>
                    <span>{new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                {o.mode === 'preview' ? <span className="tag tag-warn">Preview</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <h3>{q ? `Nothing matches “${q}”` : 'Nothing saved yet'}</h3>
          <p>{q ? 'Try a different word.' : 'Run any tool and choose “Save to workspace” to keep the result here.'}</p>
        </div>
      )}
    </>
  );
}
