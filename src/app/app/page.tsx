import type { Metadata } from 'next';
import Link from 'next/link';
import { aiMode } from '@/config/site';
import { PageHeader } from '@/components/app/page-header';
import { Icon } from '@/components/ui/icons';
import { requireWorkspace } from '@/lib/auth/session';
import { getProfile } from '@/lib/strategy/profile';
import { listStrategies } from '@/lib/strategy/repo';
import { missingRequired } from '@/lib/strategy/brief';
import { listTasks } from '@/lib/tasks';
import { listOutputs } from '@/lib/outputs/repo';
import { getPlan, usageSummary } from '@/lib/usage';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';

export const metadata: Metadata = { title: 'Overview' };

const rel = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)} min ago`;
  if (d < 86400) return `${Math.floor(d / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default async function Overview() {
  const { user, workspace } = await requireWorkspace();
  const profile = getProfile(workspace.id);
  const strategies = listStrategies(workspace.id).slice(0, 5);
  const tasks = listTasks(workspace.id).filter((t) => t.status !== 'done').slice(0, 6);
  const outputs = listOutputs(workspace.id, { limit: 5 });
  const plan = getPlan(user.id);
  const actor = { type: 'user' as const, userId: user.id, plan };
  const gen = usageSummary(actor, 'generation');
  const strat = usageSummary(actor, 'strategy');
  const missing = profile ? missingRequired(profile.data) : null;
  const firstName = user.name?.split(' ')[0];
  const mode = aiMode();

  return (
    <>
      <PageHeader title={firstName ? `Welcome, ${firstName}` : 'Overview'} description={workspace.name} />

      {!profile || (missing && missing.length) ? (
        <section className="panel panel-pad panel-chrome mb-6 next-step">
          <div>
            <p className="small muted">{profile ? 'Your brief is a draft' : 'Start here'}</p>
            <h2 className="mt-2" style={{ fontSize: '1.45rem' }}>
              {profile ? 'Finish your business brief' : 'Describe your business in about five minutes'}
            </h2>
            <p className="muted mt-2 measure">
              {profile
                ? `Still needed: ${missing!.join(', ')}. Your answers are saved, so you can pick up where you stopped.`
                : 'The brief gives every strategy and tool the context it needs: what you sell, who buys it, and what you want to happen next.'}
            </p>
          </div>
          <Link href="/app/brief" className="btn btn-primary btn-lg">
            {profile ? 'Continue the brief' : 'Start the brief'}
          </Link>
        </section>
      ) : strategies.length === 0 ? (
        <section className="panel panel-pad panel-chrome mb-6 next-step">
          <div>
            <p className="small muted">Your brief is complete</p>
            <h2 className="mt-2" style={{ fontSize: '1.45rem' }}>
              Build your first strategy
            </h2>
            <p className="muted mt-2 measure">Review the brief once more, then generate. It takes a few minutes and each section is saved as it is written.</p>
          </div>
          <Link href="/app/brief" className="btn btn-primary btn-lg">
            Review and build
          </Link>
        </section>
      ) : null}

      <div className="overview-grid">
        <div className="stack" style={{ '--stack': '24px' } as React.CSSProperties}>
          <section aria-labelledby="ov-strat">
            <div className="cluster mb-4" style={{ justifyContent: 'space-between' }}>
              <h2 id="ov-strat" className="ov-h">Recent strategies</h2>
              <Link href="/app/strategies" className="link-quiet small">
                All strategies
              </Link>
            </div>
            {strategies.length ? (
              <ul className="row-list" role="list">
                {strategies.map((s) => (
                  <li key={s.id}>
                    <Link href={`/app/strategies/${s.id}`} className="row">
                      <div style={{ minWidth: 0 }}>
                        <div className="row-title">{s.title}</div>
                        <div className="row-meta">
                          <span>Updated {rel(s.updated_at)}</span>
                          <span>{s.ready_sections} of 11 sections</span>
                        </div>
                      </div>
                      <span className="cluster" style={{ '--gap': '6px' } as React.CSSProperties}>
                        {s.status === 'generating' ? <span className="tag tag-ice">Generating</span> : null}
                        {s.status === 'partial' ? <span className="tag tag-warn">Incomplete</span> : null}
                        {s.generation_mode === 'preview' ? <span className="tag tag-warn">Preview</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                <h3>No strategies yet</h3>
                <p>Once your brief is complete, a strategy turns it into positioning, personas, channels and a prioritized plan.</p>
              </div>
            )}
          </section>

          <section aria-labelledby="ov-tasks">
            <div className="cluster mb-4" style={{ justifyContent: 'space-between' }}>
              <h2 id="ov-tasks" className="ov-h">Next tasks</h2>
              <Link href="/app/plan" className="link-quiet small">
                Action plan
              </Link>
            </div>
            {tasks.length ? (
              <ul className="row-list" role="list">
                {tasks.map((t) => (
                  <li key={t.id} className="row">
                    <div style={{ minWidth: 0 }}>
                      <div className="row-title">{t.title}</div>
                      <div className="row-meta">
                        {t.channel ? <span>{t.channel}</span> : null}
                        {t.due_date ? <span>Due {new Date(`${t.due_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span> : null}
                      </div>
                    </div>
                    <span className={`tag ${t.status === 'doing' ? 'tag-ice' : ''}`}>{t.status === 'doing' ? 'In progress' : 'To do'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                <h3>No open tasks</h3>
                <p>Add a strategy’s experiments to your action plan from the strategy’s menu, or add tasks yourself.</p>
                <Link href="/app/plan" className="btn btn-secondary btn-sm">
                  Open action plan
                </Link>
              </div>
            )}
          </section>
        </div>

        <div className="stack" style={{ '--stack': '24px' } as React.CSSProperties}>
          <section className="panel panel-pad" aria-labelledby="ov-usage">
            <h2 id="ov-usage" className="ov-h">Usage</h2>
            <p className="xs subtle mt-1">{plan === 'paid' ? 'Paid plan' : 'Free plan'}</p>
            <div className="stack mt-5" style={{ '--stack': '18px' } as React.CSSProperties}>
              <UsageMeter label="Generations, last 24 hours" used={gen.used} limit={gen.limit} />
              <UsageMeter label="Strategies, last 30 days" used={strat.used} limit={strat.limit} />
            </div>
            {mode === 'preview' ? (
              <p className="xs subtle mt-5">Preview mode: generations produce labeled placeholder text until an AI provider is connected.</p>
            ) : null}
          </section>

          <section aria-labelledby="ov-out">
            <div className="cluster mb-4" style={{ justifyContent: 'space-between' }}>
              <h2 id="ov-out" className="ov-h">Saved outputs</h2>
              <Link href="/app/tools" className="link-quiet small">
                Open tools
              </Link>
            </div>
            {outputs.length ? (
              <ul className="row-list" role="list">
                {outputs.map((o) => (
                  <li key={o.id}>
                    <Link href={`/app/outputs/${o.id}`} className="row">
                      <div style={{ minWidth: 0 }}>
                        <div className="row-title">{o.title}</div>
                        <div className="row-meta">
                          <span>{TOOL_BY_SLUG[o.tool_slug]?.name ?? o.tool_slug}</span>
                          <span>{rel(o.created_at)}</span>
                        </div>
                      </div>
                      <Icon.ChevronRight width={16} height={16} className="subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                <h3>Nothing saved yet</h3>
                <p>Results from the tools can be saved here with one click.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;
  return (
    <div>
      <div className="cluster small" style={{ justifyContent: 'space-between' }}>
        <span className="muted">{label}</span>
        <span className="nums">
          {used} / {limit}
        </span>
      </div>
      <div className="meter mt-2" role="meter" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} aria-label={label}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
