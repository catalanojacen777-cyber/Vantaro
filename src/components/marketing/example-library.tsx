'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Item = { href: string; title: string; description: string; category: string };

export function ExampleLibrary({ items, categories }: { items: Item[]; categories: { key: string; label: string }[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => items.filter((i) => (!cat || i.category === cat) && (!term || `${i.title} ${i.description}`.toLowerCase().includes(term))), [items, cat, term]);
  return (
    <div>
      <div className="directory-tools">
        <label htmlFor="ex-search" className="sr-only">Search examples</label>
        <input id="ex-search" type="search" className="input" placeholder="Search examples" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'example' : 'examples'}</span>
      </div>
      <div className="filter-chips mb-6" role="group" aria-label="Filter by type">
        <button type="button" className="filter-chip" aria-pressed={!cat} onClick={() => setCat(null)}>All</button>
        {categories.map((c) => (
          <button key={c.key} type="button" className="filter-chip" aria-pressed={cat === c.key} onClick={() => setCat(cat === c.key ? null : c.key)}>{c.label}</button>
        ))}
      </div>
      {filtered.length ? (
        <div className="card-grid stagger" key={`${cat}-${term}`}>
          {filtered.map((i) => (
            <Link key={i.href} href={i.href} className="link-card spot">
              <span className="xs subtle">{categories.find((c) => c.key === i.category)?.label}</span>
              <h3>{i.title}</h3>
              <p>{i.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty"><h3>No examples match</h3><p>Try another word or clear the filter.</p></div>
      )}
    </div>
  );
}
