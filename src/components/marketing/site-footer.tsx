import Link from 'next/link';
import { config } from '@/config/site';
import { Wordmark } from '@/components/ui/brand';
import { FEATURES } from '@/content/features';
import { SOLUTIONS } from '@/content/solutions';

const POPULAR = [
  ['business-ideas-generator', 'Business Ideas Generator'],
  ['marketing-plan-generator', 'Marketing Plan Generator'],
  ['user-persona-generator', 'User Persona Generator'],
  ['value-proposition-generator', 'Value Proposition Generator'],
  ['ad-generator', 'Ad Generator'],
  ['market-size-calculator', 'Market Size Calculator'],
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Wordmark />
            <p className="small muted" style={{ maxWidth: '30ch' }}>
              An AI marketing workspace for founders and small businesses.
            </p>
          </div>
          <div className="footer-col">
            <h2>Product</h2>
            <ul role="list">
              <li><Link href="/marketing-strategy">Marketing strategy</Link></li>
              <li><Link href="/features">Features</Link></li>
              {FEATURES.slice(0, 4).map((f) => (
                <li key={f.slug}><Link href={`/features/${f.slug}`}>{f.name}</Link></li>
              ))}
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h2>Free tools</h2>
            <ul role="list">
              {POPULAR.map(([slug, name]) => (
                <li key={slug}><Link href={`/tools/${slug}`}>{name}</Link></li>
              ))}
              <li><Link href="/free-tools">All 34 tools</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h2>Solutions</h2>
            <ul role="list">
              {SOLUTIONS.map((s) => (
                <li key={s.slug}><Link href={`/solutions/${s.slug}`}>{s.name}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h2>Company</h2>
            <ul role="list">
              <li><Link href="/examples">Examples</Link></li>
              <li><Link href="/resources">Guides</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {year} {config.operator.legalName ?? 'Vantaro'}
          </span>
          <span>AI output can be wrong. Check facts and figures before you rely on them.</span>
        </div>
      </div>
    </footer>
  );
}
