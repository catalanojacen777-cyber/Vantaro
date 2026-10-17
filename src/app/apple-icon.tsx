import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090A0C' }}>
        <svg width="124" height="124" viewBox="0 0 64 64">
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
      </div>
    ),
    size,
  );
}
