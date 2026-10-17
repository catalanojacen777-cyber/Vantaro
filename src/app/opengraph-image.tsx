import { ImageResponse } from 'next/og';

export const alt = 'Vantaro: your next move, made clear.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: '#090A0C', color: '#F4F5F7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="g" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#F7F8FA" />
                <stop offset="0.28" stopColor="#9AA1AB" />
                <stop offset="0.5" stopColor="#EEF0F3" />
                <stop offset="0.74" stopColor="#6D7480" />
                <stop offset="1" stopColor="#D6DAE0" />
              </linearGradient>
            </defs>
            <path d="M5 15h12.4L32 47.2 45.6 5H58L38.7 58.5H25.3Z" fill="url(#g)" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>Vantaro</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>Your next move, made clear.</div>
          <div style={{ fontSize: 32, color: '#A8AFBA' }}>Marketing strategy, audience insight and a plan you can ship.</div>
        </div>
      </div>
    ),
    size,
  );
}
