'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Faq } from '@/content/faq';

/** Searchable FAQ. All answers are visible text (no collapsed content). */
export function FaqSearch({ items }: { items: Faq[] }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => items.filter((f) => !term || `${f.q} ${f.a}`.toLowerCase().includes(term)), [items, term]);
  const groups = Array.from(new Set(items.map((f) => f.group)));
  return (
    <div>
      <div className="directory-tools">
        <label htmlFor="faq-q" className="sr-only">Search questions</label>
        <input id="faq-q" type="search" className="input" placeholder="Search questions" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="result-count" aria-live="polite">{filtered.length} of {items.length}</span>
      </div>
      {filtered.length === 0 ? (
        <div className="empty"><h3>No questions match “{q}”</h3><p>Try another word, or <Link className="text-link" href="/contact">ask us directly</Link>.</p></div>
      ) : (
        groups.map((g) => {
          const list = filtered.filter((f) => f.group === g);
          if (!list.length) return null;
          return (
            <section key={g} className="mb-7" aria-labelledby={`g-${g}`}>
              <h2 id={`g-${g}`} className="mb-4" style={{ fontSize: '1.2rem' }}>{g}</h2>
              <dl className="stack" style={{ '--stack': '22px' } as React.CSSProperties}>
                {list.map((f) => (
                  <div key={f.q} className="stack" style={{ '--stack': '6px', paddingBottom: 18, borderBottom: '1px solid var(--line)' } as React.CSSProperties}>
                    <dt style={{ fontWeight: 600, fontSize: '1.05rem' }}>{f.q}</dt>
                    <dd className="muted measure">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })
      )}
    </div>
  );
}
