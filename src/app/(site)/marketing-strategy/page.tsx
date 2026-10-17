import type { Metadata } from 'next';
import Link from 'next/link';
import { config } from '@/config/site';
import { SampleStrategyExplorer } from '@/components/marketing/home-islands';
import { PageHero } from '@/components/marketing/page-parts';
import { Icon } from '@/components/ui/icons';
import { JsonLd } from '@/components/ui/json-ld';
import { SAMPLE_SECTIONS } from '@/content/sample-strategy';
import { BUDGETS, CHANNELS, OBJECTIVES, STAGES } from '@/lib/strategy/brief';
import { SECTIONS } from '@/lib/strategy/sections';
import { pageMeta, softwareLd } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'AI marketing strategy generator',
  description: 'Generate an eleven-section marketing strategy from a short business brief: positioning, personas, channels, KPIs and prioritized experiments. Free to start.',
  path: '/marketing-strategy',
});

export default function MarketingStrategyPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Marketing strategy', path: '/marketing-strategy' }]}
        title="A marketing strategy you can act on this week"
        answer="Vantaro’s strategy generator turns a five-minute business brief into an eleven-section marketing strategy, from positioning and personas to channels, KPIs and prioritized experiments. Every section is editable, can be regenerated on its own, and is saved with version history."
      >
        <div className="cluster mt-2">
          <Link href="/signup?next=%2Fapp%2Fbrief" className="btn btn-primary btn-lg">Build my strategy</Link>
          <Link href="/examples/strategy/window-and-solar-cleaning" className="btn btn-secondary btn-lg">Read a sample</Link>
        </div>
      </PageHero>

      <section className="container section-tight" aria-labelledby="in-h">
        <div className="two-col">
          <div>
            <h2 id="in-h" className="mb-5">What the brief asks</h2>
            <p className="muted measure mb-6">Five required answers and a handful of optional ones. Each question explains why it matters, and answers save as you type.</p>
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Questions in the brief">
              <table className="table">
                <thead><tr><th scope="col">Question</th><th scope="col">Why it matters</th><th scope="col">Required</th></tr></thead>
                <tbody>
                  {[
                    ['Business name and what you sell', 'Everything else is built on it', 'Yes'],
                    ['Who you sell to', 'Consumer and business buyers need different channels', 'Yes'],
                    [`Stage (${STAGES.length} options)`, 'Pre-launch plans focus on validation; growing businesses on optimization', 'Yes'],
                    [`Primary objective (${OBJECTIVES.length} options)`, 'Sets what the experiments are trying to move', 'Yes'],
                    ['Best customers, region, differentiation', 'Sharpens audience hypotheses and positioning', 'No'],
                    [`Current channels (${CHANNELS.length} options) and budget (${BUDGETS.length} ranges)`, 'Keeps recommendations realistic', 'No'],
                    ['Constraints', 'Respects time, regulations and things you will not do', 'No'],
                  ].map((r) => (
                    <tr key={r[0]}><th scope="row" style={{ background: 'transparent', color: 'var(--bone)', whiteSpace: 'normal' }}>{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <aside className="aside">
            <div className="panel panel-pad stack" style={{ '--stack': '10px' } as React.CSSProperties}>
              <h3 style={{ fontSize: '1.05rem' }}>Included for free</h3>
              <p className="small muted">{config.limits.free.strategiesPer30Days} full {config.limits.free.strategiesPer30Days === 1 ? 'strategy' : 'strategies'} every 30 days, with up to {config.limits.free.personasPerStrategy} personas, plus {config.limits.free.generationsPerDay} section regenerations or tool runs a day.</p>
              <Link href="/pricing" className="text-link small">See all limits</Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="container section-tight" aria-labelledby="out-h">
        <h2 id="out-h" className="mb-5">What you get: eleven sections</h2>
        <ol className="card-grid" role="list">
          {SECTIONS.map((s, i) => (
            <li key={s.key} className="link-card">
              <span className="xs subtle nums">Section {i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.summary}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container section-tight" aria-labelledby="sample-h">
        <div className="section-head">
          <h2 id="sample-h">Explore the sample</h2>
          <p>The complete strategy for a fictional cleaning company. Expand any section.</p>
        </div>
        <SampleStrategyExplorer sections={SAMPLE_SECTIONS} />
      </section>

      <section className="container section-tight" aria-labelledby="trust-h">
        <h2 id="trust-h" className="mb-5">How it stays honest</h2>
        <div className="outcomes">
          {[
            ['Facts and hypotheses are labeled', 'Segments, personas and proof points say whether they come from your brief or are inferences to check.'],
            ['No invented numbers', 'Targets are set relative to your own baseline. No market sizes, benchmarks or search volumes are made up.'],
            ['You stay in control', 'Edit any section. Regenerating one section saves a version first, so your edits are never lost.'],
          ].map(([t, b]) => (
            <div key={t} className="outcome"><h3>{t}</h3><p>{b}</p></div>
          ))}
        </div>
        <ul className="stack mt-7 small muted" style={{ listStyle: 'none', padding: 0 }}>
          <li className="cluster" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><Icon.Info width={16} height={16} style={{ flex: 'none', marginTop: 4 }} /> Personas are hypotheses. They help you plan customer conversations; they do not replace them.</li>
          <li className="cluster" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><Icon.Info width={16} height={16} style={{ flex: 'none', marginTop: 4 }} /> A strategy does not guarantee results. It helps you choose what to test first.</li>
        </ul>
      </section>
      <JsonLd data={softwareLd({ name: 'Vantaro marketing strategy generator', description: 'Generates an eleven-section marketing strategy from a business brief.', path: '/marketing-strategy', free: true })} />
    </>
  );
}
