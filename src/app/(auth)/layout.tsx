import Link from 'next/link';
import { Wordmark } from '@/components/ui/brand';
import '@/styles/auth.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="container auth-top">
        <Wordmark />
        <Link href="/free-tools" className="link-quiet small">
          Free tools
        </Link>
      </header>
      <main id="main" className="auth-main">
        {children}
      </main>
      <footer className="container auth-foot small subtle">
        <Link href="/privacy" className="link-quiet">Privacy</Link>
        <Link href="/terms" className="link-quiet">Terms</Link>
        <Link href="/contact" className="link-quiet">Contact</Link>
      </footer>
    </div>
  );
}
