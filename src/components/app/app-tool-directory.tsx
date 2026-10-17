'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ToolIndexItem } from '@/lib/tools/registry';
import { Icon } from '@/components/ui/icons';

export function AppToolDirectory({ tools, categories }: { tools: ToolIndexItem[]; categories: { key: string; label: string }[] }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = useMemo(() => tools.filter((t) => !term || `${t.name} ${t.summary}`.toLowerCase().includes(term)), [tools, term]);
  return (
    <div>
      <div className="cluster mb-5">
        <label htmlFor="app-tool-q" className="sr-only">Search tools</label>
        <input id="app-tool-q" type="search" className="input" placeholder="Search tools" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360 }} />
        <span className="small muted" aria-live="polite">{list.length} tools</span>
      </div>
      {categories.map((c) => {
        const items = list.filter((t) => t.category === c.key);
        if (!items.length) return null;
        return (
          <section key={c.key} className="mb-6" aria-labelledby={`ac-${c.key}`}>
            <h2 id={`ac-${c.key}`} className="ov-h mb-3">{c.label}</h2>
            <ul className="row-list" role="list">
              {items.map((t) => (
                <li key={t.slug}>
                  <Link href={`/app/tools/${t.slug}`} className="row">
                    <div style={{ minWidth: 0 }}>
                      <div className="row-title">{t.name}</div>
                      <div className="row-meta"><span>{t.summary}</span></div>
                    </div>
                    <Icon.ChevronRight width={16} height={16} className="subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {list.length === 0 ? <div className="empty"><h3>No tools match “{q}”</h3><p>Try a broader word.</p></div> : null}
    </div>
  );
}
