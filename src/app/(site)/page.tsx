import type { Metadata } from 'next';
import Link from 'next/link';
import { billingState, config, formatPrice } from '@/config/site';
import { FaqList, GuidedSample, HeroPreview, ProductExplorer, SampleStrategyExplorer, UseCaseSelector } from '@/components/marketing/home-islands';
import { CalcResultView } from '@/components/tools/calculator-runner';
import { Icon } from '@/components/ui/icons';
import { JsonLd } from '@/components/ui/json-ld';
import { StructuredView } from '@/components/ui/structured-view';
import { getFaqs } from '@/content/faq';
import { SAMPLE_SECTIONS } from '@/content/sample-strategy';
import { pageMeta, softwareLd } from '@/lib/seo';
import { computeMarketSize } from '@/lib/tools/calculators';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';

export const metadata: Metadata = pageMeta({
  title: 'Vantaro: AI marketing workspace for founders and small businesses',
  description:
    'Turn what you know about your business into a marketing strategy, audience hypotheses and a prioritized action plan. Plus 34 free marketing tools.',
  path: '/',
});

const CURATED = [
  'business-ideas-generator',
  'user-persona-generator',
  'marketing-plan-generator',
  'value-proposition-generator',
  'ad-generator',
  'headline-analyzer',
  'market-size-calculator',
  'competitor-finder',
];

export default function HomePage() {
  const billing = billingState();
  const price = formatPrice();
  const faqs = getFaqs({
    anonPerDay: config.limits.anonymousGenerationsPerDay,
    freePerDay: config.limits.free.generationsPerDay,
    freeStrategies: config.limits.free.strategiesPer30Days,
    price,
    refundDays: config.billing.refundDays,
    billingReady: billing.ready,
    languages: config.ai.outputLanguages,
  });
  const persona = (SAMPLE_SECTIONS.audience as { personas: Record<string, unknown>[] }).personas[0];
  const market = computeMarketSize({ currency: 'USD', customers: 42000, source: 'Example figure for a fictional business', price: 180, purchasesPerYear: 4, serviceablePct: 25, obtainablePct: 3 });

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="chrome-ornament" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1 className="display">Your next move, made clear.</h1>
            <p className="lead">Build your marketing strategy, understand your audience, and turn ideas into work you can actually ship.</p>
            <div className="hero-ctas">
              <Link href="/signup?next=%2Fapp%2Fbrief" className="btn btn-primary btn-lg">
                Build my strategy
              </Link>
              <Link href="/free-tools" className="btn btn-secondary btn-lg">
                Explore free tools
              </Link>
            </div>
            <p className="hero-note">Free to start. The preview on this page uses a fictional sample business.</p>
          </div>
          <HeroPreview sections={SAMPLE_SECTIONS} />
        </div>
      </section>

      {/* Guided sample */}
      <section className="section band" aria-labelledby="guided-h">
        <div className="container">
          <div className="section-head reveal">
            <h2 id="guided-h">See what you would get</h2>
            <p>Pick a business like yours. These are examples written for fictional businesses; describe your own to run it for real.</p>
          </div>
          <GuidedSample />
        </div>
      </section>

      {/* Explorer */}
      <section className="section band-alt" aria-labelledby="explorer-h">
        <div className="container">
          <div className="section-head reveal">
            <h2 id="explorer-h">One brief. Every part of the plan.</h2>
            <p>A strategy covers what to say, who to say it to, where to show up, and what to do first.</p>
          </div>
          <ProductExplorer sections={SAMPLE_SECTIONS} />
        </div>
      </section>

      {/* Workflow */}
      <section className="section band" aria-labelledby="flow-h">
        <div className="container">
          <div className="section-head reveal">
            <h2 id="flow-h">From brief to first task in an afternoon</h2>
            <p>Three steps, each saved as you go, so you can stop and pick up later.</p>
          </div>
          <ol className="flow" role="list">
            <li className="flow-step reveal">
              <span className="flow-n">Step 1</span>
              <h3>Write the brief</h3>
              <p className="muted small">What you sell, who buys, your stage, budget and goal. About five minutes, saved automatically.</p>
              <div className="flow-ui" aria-hidden="true">
                <div className="line"><span>Stage</span><span>Early customers</span></div>
                <div className="line"><span>Objective</span><span>More qualified leads</span></div>
                <div className="line"><span>Budget</span><span>Under $500 / month</span></div>
              </div>
            </li>
            <li className="flow-step reveal">
              <span className="flow-n">Step 2</span>
              <h3>Generate the strategy</h3>
              <p className="muted small">Eleven sections written one by one in the background. Edit any of them, or regenerate a single section.</p>
              <div className="flow-ui" aria-hidden="true">
                <div className="line"><span>Positioning</span><span>Ready</span></div>
                <div className="line"><span>Audience and personas</span><span>Ready</span></div>
                <div className="line"><span>Channels</span><span>Writing…</span></div>
              </div>
            </li>
            <li className="flow-step reveal">
              <span className="flow-n">Step 3</span>
              <h3>Work the plan</h3>
              <p className="muted small">Send experiments to your action plan and move them from To do to Done.</p>
              <div className="flow-ui" aria-hidden="true">
                <div className="line"><span>Launch solar page</span><span>In progress</span></div>
                <div className="line"><span>Referral text</span><span>To do</span></div>
                <div className="line"><span>Update business profile</span><span>Done</span></div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Editorial features */}
      <section className="section band-alt" aria-labelledby="ed-h">
        <div className="container">
          <div className="section-head reveal">
            <h2 id="ed-h">Built to be checked, not just believed</h2>
            <p>Good marketing decisions need to know what is a fact and what is a guess. Vantaro keeps the two apart.</p>
          </div>
          <div className="editorial">
            <div className="editorial-row reveal">
              <div className="editorial-copy">
                <h3>Personas that admit they are hypotheses</h3>
                <p className="muted">Every persona and segment says whether it comes from your brief or is an inference, and ends with a concrete way to check it with real customers.</p>
                <ul>
                  <li><Icon.Check /> Goals, frustrations and buying triggers</li>
                  <li><Icon.Check /> Where to reach them, in specific places</li>
                  <li><Icon.Check /> A validation step you can do this week</li>
                </ul>
              </div>
              <div className="panel editorial-demo">
                <div className="cluster" style={{ justifyContent: 'space-between' }}>
                  <strong className="sv-card-title" style={{ fontSize: '1.1rem' }}>{String(persona.name)}</strong>
                  <span className="tag tag-warn">Hypothesis</span>
                </div>
                <div className="mt-4">
                  <StructuredView view={[{ kind: 'fields', fields: [{ key: 'role', label: 'Who they are' }, { key: 'context', label: 'Situation' }, { key: 'triggers', label: 'Buying triggers' }, { key: 'message_that_lands', label: 'Message that lands' }, { key: 'validate_by', label: 'How to validate' }] }]} data={persona} headingLevel={4} />
                </div>
              </div>
            </div>
            <div className="editorial-row reveal">
              <div className="editorial-copy">
                <h3>Numbers with the arithmetic showing</h3>
                <p className="muted">Calculators never invent market data. You enter each assumption and its source; every figure shows the formula that produced it.</p>
                <ul>
                  <li><Icon.Check /> Market size, valuation scenarios and budgets</li>
                  <li><Icon.Check /> Warnings when an assumption looks ambitious</li>
                  <li><Icon.Check /> Results you can save and share</li>
                </ul>
                <Link href="/tools/market-size-calculator" className="text-link small">Open the Market Size Calculator</Link>
              </div>
              <div className="panel editorial-demo">
                <span className="sample-label mb-4">Example assumptions</span>
                <div className="mt-4">
                  <CalcResultView result={market} />
                </div>
              </div>
            </div>
            <div className="editorial-row reveal">
              <div className="editorial-copy">
                <h3>Edits you never lose</h3>
                <p className="muted">Change anything. Regenerate one section without touching the rest. Before anything is replaced, a version is saved so you can restore it.</p>
                <ul>
                  <li><Icon.Check /> Section-by-section editing</li>
                  <li><Icon.Check /> Automatic and named versions</li>
                  <li><Icon.Check /> Read-only share links that expire</li>
                </ul>
              </div>
              <div className="panel editorial-demo" aria-hidden="true">
                <div className="stack" style={{ '--stack': '10px' } as React.CSSProperties}>
                  {[
                    ['Before team review', 'Today, 4:12 pm'],
                    ['Before regenerating channel recommendations', 'Today, 3:58 pm'],
                    ['Generated', 'Today, 3:41 pm'],
                  ].map(([label, when]) => (
                    <div key={label} className="cluster" style={{ justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--obsidian)' }}>
                      <span>
                        <span className="small" style={{ fontWeight: 560, display: 'block' }}>{label}</span>
                        <span className="xs subtle">{when}</span>
                      </span>
                      <span className="small subtle">Restore</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free tools */}
      <section className="section band" aria-labelledby="tools-h">
        <div className="container">
          <div className="cluster reveal" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--s6)' }}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <h2 id="tools-h">34 free tools for the jobs in between</h2>
              <p>No account needed to try them. Sign up to save results.</p>
            </div>
            <form action="/free-tools" role="search" className="cluster" style={{ flexWrap: 'nowrap' }}>
              <label htmlFor="home-tool-q" className="sr-only">Search tools</label>
              <input id="home-tool-q" name="q" className="input" placeholder="Search tools" style={{ width: 220 }} />
              <button className="btn btn-secondary">Search</button>
            </form>
          </div>
          <ul className="tool-list" role="list">
            {CURATED.map((slug) => {
              const t = TOOL_BY_SLUG[slug];
              return (
                <li key={slug}>
                  <Link href={`/tools/${slug}`} className="tool-row">
                    <span>
                      <strong>{t.name}</strong>
                      <p>{t.summary}</p>
                    </span>
                    <Icon.ChevronRight />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6">
            <Link href="/free-tools" className="btn btn-secondary">See all 34 tools</Link>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="section band-alt" aria-labelledby="uc-h">
        <div className="container">
          <div className="section-head reveal">
            <h2 id="uc-h">Made for small teams with big to-do lists</h2>
          </div>
          <UseCaseSelector />
        </div>
      </section>

      {/* Sample strategy */}
      <section className="section band" aria-labelledby="sample-h">
        <div className="container two-col">
          <div>
            <div className="section-head reveal">
              <h2 id="sample-h">Open a complete sample strategy</h2>
              <p>All eleven sections for Brightside Window &amp; Solar, a fictional two-crew cleaning company. Expand any section, and switch between personas.</p>
            </div>
            <SampleStrategyExplorer sections={SAMPLE_SECTIONS} />
          </div>
          <aside className="aside">
            <div className="panel panel-pad stack">
              <h3 style={{ fontSize: '1.1rem' }}>Generate your own version</h3>
              <p className="small muted">Your strategy is written from your own brief. It takes about five minutes to fill in, and generation runs in the background.</p>
              <Link href="/signup?next=%2Fapp%2Fbrief" className="btn btn-primary btn-block">Build my strategy</Link>
              <Link href="/examples/strategy/window-and-solar-cleaning" className="link-quiet small">Read the annotated example</Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Pricing summary */}
      <section className="section band-alt" aria-labelledby="price-h">
        <div className="container">
          <div className="section-head reveal">
            <h2 id="price-h">Start free</h2>
            <p>Use the tools and build a strategy without paying. Limits are stated plainly because every generation has a real cost.</p>
          </div>
          <div className="plans">
            <div className="plan">
              <h3>Free</h3>
              <div className="plan-price">$0</div>
              <ul>
                <li><Icon.Check /> {config.limits.free.generationsPerDay} AI generations a day</li>
                <li><Icon.Check /> {config.limits.free.strategiesPer30Days} full {config.limits.free.strategiesPer30Days === 1 ? 'strategy' : 'strategies'} every 30 days</li>
                <li><Icon.Check /> Saved results, versions and share links</li>
                <li><Icon.Check /> Unlimited calculator use</li>
              </ul>
              <Link href="/signup" className="btn btn-primary">Create a free account</Link>
            </div>
            <div className="plan">
              <h3>{config.billing.planName}</h3>
              {billing.ready && price ? (
                <>
                  <div className="plan-price">{price}</div>
                  <p className="small muted">One-time purchase.</p>
                </>
              ) : (
                <p className="small muted">Paid access is not open yet. The price, limits and refund terms will be published here before anything can be bought.</p>
              )}
              <ul>
                <li><Icon.Check /> {config.limits.paid.generationsPerDay} AI generations a day</li>
                <li><Icon.Check /> {config.limits.paid.strategiesPer30Days} strategies every 30 days</li>
                <li><Icon.Check /> Up to {config.limits.paid.personasPerStrategy} personas per strategy</li>
                <li><Icon.Check /> {config.limits.paid.workspaces} workspaces</li>
              </ul>
              <Link href="/pricing" className="btn btn-secondary">See pricing details</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section band" aria-labelledby="faq-h">
        <div className="container two-col">
          <div>
            <div className="section-head">
              <h2 id="faq-h">Questions, answered plainly</h2>
            </div>
            <FaqList items={faqs.slice(0, 6)} />
            <Link href="/faq" className="text-link small mt-5" style={{ display: 'inline-block' }}>All questions</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container">
        <div className="cta-band panel-chrome" style={{ background: 'var(--graphite)' }}>
          <h2>Know what to do next week, and why.</h2>
          <p className="lead">Write your brief, get a strategy, and leave with your first two experiments.</p>
          <div className="hero-ctas">
            <Link href="/signup?next=%2Fapp%2Fbrief" className="btn btn-primary btn-lg">Build my strategy</Link>
            <Link href="/free-tools" className="btn btn-secondary btn-lg">Explore free tools</Link>
          </div>
        </div>
      </section>

      <JsonLd data={softwareLd({ name: 'Vantaro', description: config.site.description, path: '/', free: true })} />
    </>
  );
}
