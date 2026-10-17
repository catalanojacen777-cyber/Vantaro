'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Wordmark } from '@/components/ui/brand';
import { Icon } from '@/components/ui/icons';

type LinkItem = { href: string; name: string; blurb?: string };

export function SiteHeader({ features, solutions }: { features: LinkItem[]; solutions: LinkItem[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Pages stay static; the signed-in state is checked after load.
  useEffect(() => {
    fetch('/api/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d: { signedIn: boolean }) => setSignedIn(d.signedIn))
      .catch(() => setSignedIn(false));
  }, []);

  useEffect(() => {
    setProductOpen(false);
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!productOpen) return;
    const onDown = (e: PointerEvent) => !productRef.current?.contains(e.target as Node) && setProductOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProductOpen(false);
        (productRef.current?.querySelector('button') as HTMLButtonElement | null)?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [productOpen]);

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer]);

  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined);
  const hoverOpen = () => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setProductOpen(true);
  };
  const hoverClose = () => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    closeTimer.current = setTimeout(() => setProductOpen(false), 160);
  };
  const ctaHref = signedIn ? '/app/brief' : '/signup?next=%2Fapp%2Fbrief';

  return (
    <header className="site-header" data-scrolled={scrolled || productOpen}>
      <div className="container site-header-inner">
        <Wordmark />
        <nav className="site-nav" aria-label="Main">
          <div ref={productRef} style={{ position: 'relative' }} onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
            <button className="nav-item" aria-expanded={productOpen} aria-controls="product-menu" onClick={() => setProductOpen((v) => !v)}>
              Product <Icon.ChevronDown />
            </button>
            {productOpen ? (
              <div className="mega" id="product-menu">
                <div className="mega-feature">
                  <h3 style={{ paddingLeft: 0 }}>Flagship</h3>
                  <strong>Marketing strategy</strong>
                  <p>Eleven sections from a five-minute brief: positioning, personas, channels and a prioritized plan.</p>
                  <div className="cluster">
                    <Link href="/marketing-strategy" className="btn btn-secondary btn-sm">
                      How it works
                    </Link>
                    <Link href="/features" className="link-quiet small">
                      All features
                    </Link>
                  </div>
                </div>
                <div>
                  <h3>Capabilities</h3>
                  {features.map((f) => (
                    <Link key={f.href} href={f.href}>
                      {f.name}
                    </Link>
                  ))}
                </div>
                <div>
                  <h3>Who it is for</h3>
                  {solutions.map((s) => (
                    <Link key={s.href} href={s.href}>
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <Link className="nav-item" href="/free-tools" aria-current={current('/free-tools') ?? current('/tools')}>
            Free tools
          </Link>
          <Link className="nav-item" href="/examples" aria-current={current('/examples')}>
            Examples
          </Link>
          <Link className="nav-item" href="/pricing" aria-current={current('/pricing')}>
            Pricing
          </Link>
          <Link className="nav-item" href="/resources" aria-current={current('/resources')}>
            Resources
          </Link>
        </nav>
        <div className="site-actions">
          {signedIn ? (
            <Link href="/app" className="btn btn-ghost btn-sm hide-mobile">
              Open workspace
            </Link>
          ) : (
            <Link href="/login" className="btn btn-ghost btn-sm hide-mobile">
              Log in
            </Link>
          )}
          <Link href={ctaHref} className="btn btn-primary btn-sm hide-mobile">
            Build my strategy
          </Link>
          <button className="btn btn-ghost btn-icon mobile-toggle" aria-label="Open menu" aria-expanded={drawer} aria-controls="site-drawer" onClick={() => setDrawer(true)}>
            <Icon.Menu />
          </button>
        </div>
      </div>

      {drawer ? (
        <div className="drawer" id="site-drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="drawer-top">
            <Wordmark />
            <button className="btn btn-ghost btn-icon" aria-label="Close menu" onClick={() => setDrawer(false)} autoFocus>
              <Icon.Close />
            </button>
          </div>
          <nav aria-label="Mobile">
            <button className="drawer-link" aria-expanded={drawerProduct} onClick={() => setDrawerProduct((v) => !v)}>
              Product <Icon.ChevronDown width={18} height={18} style={{ transform: drawerProduct ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
            </button>
            {drawerProduct ? (
              <div className="drawer-sub fade-in">
                <Link href="/marketing-strategy">Marketing strategy</Link>
                <Link href="/features">All features</Link>
                {solutions.map((s) => (
                  <Link key={s.href} href={s.href}>
                    For {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            ) : null}
            <Link href="/free-tools">Free tools</Link>
            <Link href="/examples">Examples</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/resources">Resources</Link>
            <Link href="/faq">FAQ</Link>
          </nav>
          <div className="drawer-actions">
            <Link href={ctaHref} className="btn btn-primary btn-lg btn-block">
              Build my strategy
            </Link>
            <Link href={signedIn ? '/app' : '/login'} className="btn btn-secondary btn-lg btn-block">
              {signedIn ? 'Open workspace' : 'Log in'}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
