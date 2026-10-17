'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SECTIONS, personaView } from '@/lib/strategy/sections';
import { StructuredView } from '@/components/ui/structured-view';
import { Tabs } from '@/components/ui/tabs';
import { Icon } from '@/components/ui/icons';
import { EXPLORER_TABS, GUIDED_SAMPLES, USE_CASES } from '@/content/home';

type SampleSections = Record<string, unknown>;

/** Hero: the real strategy view component, populated with a labeled sample. */
export function HeroPreview({ sections }: { sections: SampleSections }) {
  const keys = ['actions', 'positioning', 'audience', 'channels'] as const;
  const [active, setActive] = useState<(typeof keys)[number]>('actions');
  const def = SECTIONS.find((s) => s.key === active)!;
  const personas = active === 'audience' ? ((sections.audience as { personas: Record<string, unknown>[] }).personas ?? []) : [];
  return (
    <div className="preview panel-chrome" aria-label="Product preview with sample data">
      <div className="preview-bar">
        <div className="preview-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="small" style={{ fontWeight: 560 }}>
          Brightside Window &amp; Solar
        </span>
        <span className="sample-label" style={{ marginLeft: 'auto' }}>
          Sample data, fictional business
        </span>
      </div>
      <div className="preview-mobile-tabs" role="tablist" aria-label="Sample sections">
        {keys.map((k) => (
          <button key={k} role="tab" aria-selected={active === k} className="tab" onClick={() => setActive(k)} style={active === k ? { background: 'var(--slate-2)', color: 'var(--bone)' } : undefined}>
            {SECTIONS.find((s) => s.key === k)!.title.split(' ')[0]}
          </button>
        ))}
      </div>
      <div className="preview-body">
        <div className="preview-toc" role="tablist" aria-label="Sample strategy sections" aria-orientation="vertical">
          {SECTIONS.map((s) => {
            const enabled = (keys as readonly string[]).includes(s.key);
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={active === s.key}
                disabled={!enabled}
                onClick={() => enabled && setActive(s.key as (typeof keys)[number])}
                style={!enabled ? { opacity: 0.45, cursor: 'default' } : undefined}
              >
                <span className="toc-dot" aria-hidden="true" style={{ background: active === s.key ? 'var(--ice)' : 'var(--pewter)' }} />
                {s.title}
              </button>
            );
          })}
        </div>
        <div className="preview-main" role="tabpanel" aria-label={def.title} tabIndex={0}>
          <div key={active} className="fade-in">
            <h3 style={{ fontSize: '1.1rem', fontStretch: '106%' }}>{def.title}</h3>
            <p className="xs muted mt-1 mb-5">{def.summary}</p>
            <StructuredView view={def.view} data={sections[active]} />
            {personas[0] ? (
              <div className="persona-card mt-5" style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 12 }}>
                <div className="cluster" style={{ justifyContent: 'space-between' }}>
                  <strong>{String(personas[0].name)}</strong>
                  <span className="tag tag-warn">Hypothesis</span>
                </div>
                <div className="mt-3">
                  <StructuredView view={personaView.slice(0, 1)} data={personas[0]} headingLevel={4} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GuidedSample() {
  const router = useRouter();
  const [key, setKey] = useState<(typeof GUIDED_SAMPLES)[number]['key']>(GUIDED_SAMPLES[0].key);
  const [own, setOwn] = useState('');
  const s = GUIDED_SAMPLES.find((x) => x.key === key)!;
  return (
    <div className="guided">
      <div className="guided-options" role="radiogroup" aria-label="Sample business type">
        {GUIDED_SAMPLES.map((g) => (
          <button
            key={g.key}
            role="radio"
            aria-checked={key === g.key}
            className="guided-option"
            onClick={() => setKey(g.key)}
            onKeyDown={(e) => {
              const i = GUIDED_SAMPLES.findIndex((x) => x.key === key);
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                setKey(GUIDED_SAMPLES[(i + 1) % GUIDED_SAMPLES.length].key);
              }
              if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setKey(GUIDED_SAMPLES[(i - 1 + GUIDED_SAMPLES.length) % GUIDED_SAMPLES.length].key);
              }
            }}
            tabIndex={key === g.key ? 0 : -1}
          >
            <strong>{g.label}</strong>
            <span className="xs muted">{g.business}</span>
          </button>
        ))}
      </div>
      <div className="guided-result" aria-live="polite">
        <div key={s.key} className="stack fade-in" style={{ '--stack': '12px' } as React.CSSProperties}>
          <span className="sample-label">Example output for a fictional business</span>
          <div className="guided-row">
            <h3>Who to target first</h3>
            <p>{s.audience}</p>
          </div>
          <div className="guided-row">
            <h3>Positioning idea</h3>
            <p>{s.positioning}</p>
          </div>
          <div className="guided-row">
            <h3>Next task</h3>
            <p>{s.nextTask}</p>
          </div>
        </div>
        <form
          className="try-own mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const value = own.trim();
            router.push(`/tools/target-audience-generator${value ? `?business=${encodeURIComponent(value.slice(0, 1200))}` : ''}`);
          }}
        >
          <label htmlFor="own-business" className="sr-only">
            Describe your business
          </label>
          <input id="own-business" className="input" placeholder="Describe your business to try it on yours" value={own} onChange={(e) => setOwn(e.target.value)} maxLength={1200} />
          <button className="btn btn-secondary">Try it on mine</button>
        </form>
      </div>
    </div>
  );
}

export function ProductExplorer({ sections }: { sections: SampleSections }) {
  const [tab, setTab] = useState<(typeof EXPLORER_TABS)[number]['key']>(EXPLORER_TABS[0].key);
  const t = EXPLORER_TABS.find((x) => x.key === tab)!;
  const def = SECTIONS.find((s) => s.key === t.section)!;
  return (
    <div>
      <Tabs items={EXPLORER_TABS} value={tab} onChange={setTab} label="Product areas" idBase="explorer" />
      <div className="explorer-panel" id="explorer-panel" role="tabpanel" aria-labelledby={`explorer-tab-${tab}`}>
        <div key={`c-${tab}`} className="explorer-copy fade-in">
          <h3>{t.title}</h3>
          <p className="muted">{t.body}</p>
          <p className="xs subtle">Shown with the sample strategy for a fictional business.</p>
        </div>
        <div key={`v-${tab}`} className="panel panel-pad explorer-view fade-in" tabIndex={0} aria-label={`${def.title} sample`}>
          <StructuredView view={def.view} data={sections[def.key]} />
        </div>
      </div>
    </div>
  );
}

export function UseCaseSelector() {
  const [key, setKey] = useState<(typeof USE_CASES)[number]['key']>(USE_CASES[0].key);
  const u = USE_CASES.find((x) => x.key === key)!;
  return (
    <div>
      <Tabs items={USE_CASES} value={key} onChange={setKey} label="Use cases" idBase="usecase" />
      <div className="usecase" id="usecase-panel" role="tabpanel" aria-labelledby={`usecase-tab-${key}`}>
        <div key={`l-${key}`} className="stack fade-in">
          <p className="usecase-line">{u.line}</p>
          <Link href={`/solutions/${u.key}`} className="btn btn-secondary">
            {u.cta}
          </Link>
        </div>
        <ul key={`p-${key}`} className="stagger" role="list">
          {u.points.map((p) => (
            <li key={p}>
              <Icon.Check />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Full sample strategy with expandable sections and a persona switcher. */
export function SampleStrategyExplorer({ sections }: { sections: SampleSections }) {
  const [open, setOpen] = useState<string | null>('positioning');
  const [persona, setPersona] = useState(0);
  const personas = (sections.audience as { personas: Record<string, unknown>[] }).personas;
  return (
    <div>
      {SECTIONS.map((def) => {
        const isOpen = open === def.key;
        return (
          <div key={def.key} className="disclosure">
            <h3 style={{ fontSize: 'inherit', fontStretch: '100%' }}>
              <button className="disclosure-btn" aria-expanded={isOpen} aria-controls={`ss-${def.key}`} onClick={() => setOpen(isOpen ? null : def.key)}>
                <span>
                  {def.title}
                  <span className="small muted" style={{ display: 'block', fontWeight: 450, marginTop: 2 }}>
                    {def.summary}
                  </span>
                </span>
                <Icon.Plus className="chev" />
              </button>
            </h3>
            <div className="disclosure-body" id={`ss-${def.key}`} data-open={isOpen}>
              <div>
                {isOpen ? (
                  <div className="disclosure-inner" style={{ maxWidth: 'none', color: 'inherit' }}>
                    <StructuredView view={def.view} data={sections[def.key]} />
                    {def.key === 'audience' ? (
                      <div className="mt-6">
                        <Tabs items={personas.map((p, i) => ({ key: String(i), label: String(p.name) }))} value={String(persona)} onChange={(k) => setPersona(Number(k))} label="Sample personas" idBase="persona" />
                        <div id="persona-panel" role="tabpanel" className="persona-card fade-in" key={persona} style={{ marginTop: 16, padding: 20, border: '1px solid var(--line)', borderRadius: 12, background: 'var(--obsidian)' }}>
                          <div className="cluster" style={{ justifyContent: 'space-between' }}>
                            <strong className="sv-card-title" style={{ fontSize: '1.1rem' }}>
                              {String(personas[persona].name)}
                            </strong>
                            <span className={`tag ${personas[persona].basis === 'provided' ? 'tag-ok' : 'tag-warn'}`}>{personas[persona].basis === 'provided' ? 'From the brief' : 'Hypothesis'}</span>
                          </div>
                          <div className="mt-4">
                            <StructuredView view={personaView} data={personas[persona]} headingLevel={4} />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      {items.map((f, i) => (
        <div key={f.q} className="disclosure">
          <h3 style={{ fontSize: 'inherit', fontStretch: '100%' }}>
            <button className="disclosure-btn" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)}>
              {f.q}
              <Icon.Plus className="chev" />
            </button>
          </h3>
          <div className="disclosure-body" id={`faq-${i}`} data-open={open === i} role="region" aria-label={f.q}>
            <div inert={open !== i}>
              <p className="disclosure-inner">{f.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
