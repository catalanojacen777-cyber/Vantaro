'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export type MenuAction = { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean } | 'sep';

/** Button that opens a keyboard-navigable action menu. */
export function MenuButton({
  label,
  items,
  align = 'end',
  buttonClass = 'btn btn-secondary btn-sm',
  ariaLabel,
}: {
  label: ReactNode;
  items: MenuAction[];
  align?: 'start' | 'end';
  buttonClass?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? []);
    items()[0]?.focus();
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      const list = items();
      const i = list.indexOf(document.activeElement as HTMLButtonElement);
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        list[(i + 1) % list.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        list[(i - 1 + list.length) % list.length]?.focus();
      } else if (e.key === 'Tab') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button ref={btnRef} type="button" className={buttonClass} aria-haspopup="menu" aria-expanded={open} aria-controls={id} aria-label={ariaLabel} onClick={() => setOpen((v) => !v)}>
        {label}
      </button>
      {open ? (
        <div id={id} className="menu" role="menu" style={{ top: 'calc(100% + 6px)', [align === 'end' ? 'right' : 'left']: 0 }}>
          {items.map((it, i) =>
            it === 'sep' ? (
              <div key={i} className="menu-sep" role="separator" />
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                className="menu-item"
                disabled={it.disabled}
                style={it.danger ? { color: 'var(--danger)' } : it.disabled ? { opacity: 0.45 } : undefined}
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
              >
                {it.icon}
                {it.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
