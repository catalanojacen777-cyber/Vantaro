'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/ui/icons';
import { api } from '@/lib/client-api';

type Result = { href: string; label: string; group: string; hint?: string };

const PAGES: Result[] = [
  { href: '/app', label: 'Overview', group: 'Go to' },
  { href: '/app/brief', label: 'Business brief', group: 'Go to' },
  { href: '/app/strategies', label: 'Strategies', group: 'Go to' },
  { href: '/app/personas', label: 'Personas', group: 'Go to' },
  { href: '/app/plan', label: 'Action plan', group: 'Go to' },
  { href: '/app/tools', label: 'Tools', group: 'Go to' },
  { href: '/app/outputs', label: 'Saved outputs', group: 'Go to' },
  { href: '/app/shared', label: 'Shared reports', group: 'Go to' },
  { href: '/app/settings', label: 'Settings', group: 'Go to' },
  { href: '/app/billing', label: 'Billing', group: 'Go to' },
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [remote, setRemote] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<Element | null>(null);

  useEffect(() => {
    restoreRef.current = document.activeElement;
    inputRef.current?.focus();
    return () => (restoreRef.current as HTMLElement | null)?.focus?.();
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRemote([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      api<{ results: Result[] }>(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => setRemote(r.results))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 140);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pages = term ? PAGES.filter((p) => p.label.toLowerCase().includes(term)) : PAGES;
    return [...remote, ...pages].slice(0, 30);
  }, [q, remote]);

  useEffect(() => setActive(0), [results.length]);

  function go(r: Result | undefined) {
    if (!r) return;
    onClose();
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  }

  let lastGroup = '';
  return (
    <div className="dialog-backdrop" style={{ alignItems: 'start', paddingTop: '12vh' }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog palette" role="dialog" aria-modal="true" aria-label="Search" onKeyDown={onKeyDown}>
        <div className="palette-input">
          <Icon.Search />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search strategies, saved outputs, tools…"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `pal-${active}` : undefined}
            maxLength={100}
          />
          {loading ? <span className="spinner" aria-hidden="true" /> : <kbd>Esc</kbd>}
        </div>
        <ul id="palette-list" role="listbox" className="palette-list">
          {results.length === 0 ? <li className="small muted" style={{ padding: '14px 12px' }}>No matches for “{q}”.</li> : null}
          {results.map((r, i) => {
            const header = r.group !== lastGroup ? r.group : null;
            lastGroup = r.group;
            return (
              <li key={`${r.href}-${i}`} role="presentation">
                {header ? <div className="menu-label">{header}</div> : null}
                <div
                  id={`pal-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className="palette-item"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                >
                  <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.label}
                  </span>
                  {r.hint ? <span className="xs subtle">{r.hint}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
