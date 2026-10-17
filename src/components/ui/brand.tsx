import Link from 'next/link';
import { useId } from 'react';

/**
 * The Vantaro mark: a V whose right arm rises higher than the left, a quiet
 * nod to "the next move". Works as a flat monochrome shape; the chrome variant
 * is decoration only.
 */
export const V_PATH = 'M5 15h12.4L32 47.2 45.6 5H58L38.7 58.5H25.3Z';

export function VMark({
  variant = 'flat',
  className,
  title,
}: {
  variant?: 'flat' | 'chrome';
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      {variant === 'chrome' ? (
        <defs>
          <linearGradient id={`vg-${id}`} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F7F8FA" />
            <stop offset="0.28" stopColor="#9AA1AB" />
            <stop offset="0.5" stopColor="#EEF0F3" />
            <stop offset="0.74" stopColor="#6D7480" />
            <stop offset="1" stopColor="#D6DAE0" />
          </linearGradient>
        </defs>
      ) : null}
      <path d={V_PATH} fill={variant === 'chrome' ? `url(#vg-${id})` : 'currentColor'} />
    </svg>
  );
}

export function Wordmark({ href = '/', label = 'Vantaro home' }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="wordmark" aria-label={label}>
      <VMark variant="chrome" />
      <span>Vantaro</span>
    </Link>
  );
}

