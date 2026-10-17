'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

/** Tabs with a sliding indicator and full keyboard support (arrows, Home, End). */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idBase,
}: {
  items: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  label: string;
  idBase: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-key="${value}"]`);
      if (el) setIndicator({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [value]);

  function onKeyDown(e: KeyboardEvent) {
    const i = items.findIndex((it) => it.key === value);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % items.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(items[next].key);
      listRef.current?.querySelector<HTMLButtonElement>(`[data-key="${items[next].key}"]`)?.focus();
    }
  }

  return (
    <div ref={listRef} className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {indicator ? <span className="tab-indicator" aria-hidden="true" style={{ transform: `translateX(${indicator.x - 4}px)`, width: indicator.w, left: 4 }} /> : null}
      {items.map((it) => (
        <button
          key={it.key}
          data-key={it.key}
          role="tab"
          type="button"
          id={`${idBase}-tab-${it.key}`}
          aria-selected={value === it.key}
          aria-controls={`${idBase}-panel`}
          tabIndex={value === it.key ? 0 : -1}
          className="tab"
          onClick={() => onChange(it.key)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
