'use client';

import { useEffect, useState } from 'react';
import { Icon } from './icons';

type ToastItem = { id: number; message: string; tone: 'ok' | 'error' };
let counter = 0;
const listeners = new Set<(t: ToastItem) => void>();

export function toast(message: string, tone: 'ok' | 'error' = 'ok') {
  const item = { id: ++counter, message, tone };
  listeners.forEach((l) => l(item));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const add = (t: ToastItem) => {
      setItems((prev) => [...prev.slice(-2), t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), t.tone === 'error' ? 6000 : 3200);
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast" data-tone={t.tone}>
          {t.tone === 'error' ? <Icon.Warning /> : <Icon.Check />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
