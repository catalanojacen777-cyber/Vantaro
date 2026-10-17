import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/app/page-header';
import { StructuredView } from '@/components/ui/structured-view';
import { requireWorkspace } from '@/lib/auth/session';
import { getDb, json } from '@/lib/db';
import { personaView } from '@/lib/strategy/sections';

export const metadata: Metadata = { title: 'Personas' };

export default async function PersonasPage() {
  const { workspace } = await requireWorkspace();
  const rows = getDb()
    .prepare(
      `SELECT p.id, p.name, p.data, p.strategy_id, s.title AS strategy_title FROM personas p
       LEFT JOIN strategies s ON s.id = p.strategy_id WHERE p.workspace_id = ? AND (s.archived_at IS NULL) ORDER BY p.updated_at DESC LIMIT 60`,
    )
    .all(workspace.id) as { id: string; name: string; data: string; strategy_id: string | null; strategy_title: string | null }[];
  return (
    <>
      <PageHeader title="Personas" description="Persona hypotheses from your strategies. Edit them in the strategy’s audience section; changes appear here." />
      {rows.length === 0 ? (
        <div className="empty">
          <h3>No personas yet</h3>
          <p>Personas are created with each strategy. Build a strategy, or try the User Persona Generator.</p>
          <div className="cluster">
            <Link href="/app/brief" className="btn btn-primary btn-sm">Build a strategy</Link>
            <Link href="/app/tools/user-persona-generator" className="btn btn-secondary btn-sm">Persona generator</Link>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ '--stack': '20px' } as React.CSSProperties}>
          {rows.map((r) => {
            const data = json<Record<string, unknown>>(r.data, {});
            return (
              <article key={r.id} className="panel panel-pad">
                <div className="cluster" style={{ justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: '1.2rem' }}>{r.name}</h2>
                  <span className={`tag ${data.basis === 'provided' ? 'tag-ok' : 'tag-warn'}`}>{data.basis === 'provided' ? 'From your brief' : 'Hypothesis'}</span>
                </div>
                {r.strategy_id ? <p className="xs subtle mt-1">From <Link className="text-link" href={`/app/strategies/${r.strategy_id}#sec-audience`}>{r.strategy_title}</Link></p> : null}
                <div className="mt-5"><StructuredView view={personaView} data={data} headingLevel={4} /></div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
