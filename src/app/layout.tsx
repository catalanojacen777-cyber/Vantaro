import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { config } from '@/config/site';
import { Toaster } from '@/components/ui/toast';
import { Enhancements } from '@/components/ui/enhancements';
import './globals.css';

const mona = localFont({
  src: './fonts/MonaSans-Variable.woff2',
  weight: '200 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-mona',
  declarations: [{ prop: 'font-stretch', value: '75% 125%' }],
  adjustFontFallback: 'Arial',
});

export const metadata: Metadata = {
  metadataBase: new URL(config.site.url),
  title: { default: `${config.site.name}: AI marketing workspace for founders`, template: `%s | ${config.site.name}` },
  description: config.site.description,
  applicationName: config.site.name,
  robots: config.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#090a0c',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mona.variable} suppressHydrationWarning>
      <head>
        {/* Marks JS as available so reveal styles only apply when they can be undone. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <Toaster />
        <Enhancements />
      </body>
    </html>
  );
}
