'use client';

import { useState } from 'react';
import { Icon } from './icons';

export function CopyButton({ text, label = 'Copy', className = 'btn btn-ghost btn-sm copy-btn', showText = true }: { text: string | (() => string); label?: string; className?: string; showText?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const value = typeof text === 'function' ? text() : text;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button type="button" className={className} onClick={copy} data-copied={copied} aria-label={label}>
      {copied ? <Icon.Check /> : <Icon.Copy />}
      {showText ? <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span> : <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>}
    </button>
  );
}
