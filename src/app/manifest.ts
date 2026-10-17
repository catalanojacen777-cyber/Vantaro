import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vantaro',
    short_name: 'Vantaro',
    description: 'AI marketing workspace for founders and small businesses.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#090a0c',
    theme_color: '#090a0c',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
