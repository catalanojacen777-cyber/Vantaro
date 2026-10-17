'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ToolIndexItem } from '@/lib/tools/registry';
import { Icon } from '@/components/ui/icons';

type Cat = { key: string; label: string; description: string };

/** Searchable, filterable directory. Without JavaScript every tool is still listed. */
export function ToolDirectory({ tools, categories }: { tools: ToolIndexItem[]; categories: Cat[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQ(sp.get('q') ?? '');
    const c = sp.get('category');
    if (c && categories.some((x) => x.key === c)) setCat(c);
  }, [categories]);

  // Keep the URL shareable without creating indexable duplicates (canonical stays /free-tools).
  useEffect(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    if (cat) sp.set('category', cat);
    const next = `${window.location.pathname}${sp.toString() ? `?${sp}` : ''}`;
    window.history.replaceState(null, '', next);
  }, [q, cat]);

  const term = q.trim().toLowerCase();
  const filtered = useMemo(
    () => tools.filter((t) => (!cat || t.category === cat) && (!term || `${t.name} ${t.summary}`.toLowerCase().includes(term))),
    [tools, cat, term],
  );

  return (
    <div>
      <div className="directory-tools">
        <label htmlFor="tool-search" className="sr-only">Search tools</label>
        <input id="tool-search" type="search" className="input" placeholder="Search 34 tools" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="result-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'tool' : 'tools'}
        </span>
      </div>
      <div className="filter-chips mb-6" role="group" aria-label="Filter by category">
        <button type="button" className="filter-chip" aria-pressed={!cat} onClick={() => setCat(null)}>All</button>
        {categories.map((c) => (
          <button key={c.key} type="button" className="filter-chip" aria-pressed={cat === c.key} onClick={() => setCat(cat === c.key ? null : c.key)}>
            {c.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty">
          <h3>No tools match “{q}”</h3>
          <p>Try a broader word like “ad”, “persona” or “plan”, or clear the filters.</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setQ(''); setCat(null); }}>Clear filters</button>
        </div>
      ) : (
        categories.map((c) => {
          const items = filtered.filter((t) => t.category === c.key);
          if (!items.length) return null;
          return (
            <section key={c.key} className="dir-group" aria-labelledby={`cat-${c.key}`}>
              <h2 id={`cat-${c.key}`}>{c.label}</h2>
              <p>{c.description}</p>
              <ul className="tool-list stagger" role="list">
                {items.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/tools/${t.slug}`} className="tool-row">
                      <span>
                        <strong>{t.name}</strong>
                        <p>{t.summary}</p>
                      </span>
                      <Icon.ChevronRight />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
