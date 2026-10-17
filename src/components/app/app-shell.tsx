'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Wordmark } from '@/components/ui/brand';
import { Icon } from '@/components/ui/icons';
import { api } from '@/lib/client-api';
import { toast } from '@/components/ui/toast';
import { CommandPalette } from './command-palette';

type Ws = { id: string; name: string; role: string };

const NAV: { title: string; items: { href: string; label: string; icon: keyof typeof Icon; exact?: boolean }[] }[] = [
  {
    title: 'Workspace',
    items: [
      { href: '/app', label: 'Overview', icon: 'Home', exact: true },
      { href: '/app/brief', label: 'Business brief', icon: 'Brief' },
      { href: '/app/strategies', label: 'Strategies', icon: 'Compass' },
      { href: '/app/personas', label: 'Personas', icon: 'Users' },
      { href: '/app/plan', label: 'Action plan', icon: 'List' },
    ],
  },
  {
    title: 'Create',
    items: [
      { href: '/app/tools', label: 'Tools', icon: 'Wand' },
      { href: '/app/outputs', label: 'Saved outputs', icon: 'Inbox' },
      { href: '/app/shared', label: 'Shared reports', icon: 'Share' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/app/settings', label: 'Settings', icon: 'Settings' },
      { href: '/app/billing', label: 'Billing', icon: 'Card' },
    ],
  },
];

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOutside();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, onOutside, active]);
}

export function AppShell({
  user,
  workspaces,
  current,
  plan,
  aiMode,
  children,
}: {
  user: { name: string | null; email: string };
  workspaces: Ws[];
  current: Ws;
  plan: 'free' | 'paid';
  aiMode: 'live' | 'preview' | 'unavailable';
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const closeWs = useCallback(() => setWsOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  useClickOutside(wsRef, closeWs, wsOpen);
  useClickOutside(profileRef, closeProfile, profileOpen);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('vt-sidebar') === 'collapsed');
    } catch {}
  }, []);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === 'Escape') setDrawer(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem('vt-sidebar', c ? 'expanded' : 'collapsed');
      } catch {}
      return !c;
    });
  }

  async function switchWorkspace(id: string) {
    setWsOpen(false);
    try {
      await api('/api/workspaces/switch', { body: { workspaceId: id } });
      router.push('/app');
      router.refresh();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function logout() {
    await api('/api/auth/logout', { body: {} }).catch(() => null);
    router.replace('/login');
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const initials = (user.name || user.email).trim().slice(0, 1).toUpperCase();

  return (
    <div className="app-shell" data-collapsed={collapsed} data-drawer={drawer}>
      {drawer ? <div className="drawer-scrim" onClick={() => setDrawer(false)} aria-hidden="true" /> : null}
      <aside className="app-sidebar" id="app-sidebar" aria-label="Workspace navigation">
        <div className="app-sidebar-top">
          <Wordmark href="/app" label="Vantaro workspace overview" />
          <button
            className="btn btn-ghost btn-icon btn-sm collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
          >
            <Icon.Sidebar />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm show-sm" onClick={() => setDrawer(false)} aria-label="Close navigation">
            <Icon.Close />
          </button>
        </div>

        <div className="ws-switch" ref={wsRef}>
          <button aria-haspopup="menu" aria-expanded={wsOpen} onClick={() => setWsOpen((v) => !v)} title={current.name}>
            <span className="ws-avatar" aria-hidden="true">
              {current.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="ws-switch-label">{current.name}</span>
            <Icon.ChevronDown width={14} height={14} className="ws-switch-label" />
          </button>
          {wsOpen ? (
            <div className="menu" role="menu" style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}>
              <div className="menu-label">Workspaces</div>
              {workspaces.map((w) => (
                <button key={w.id} role="menuitemradio" aria-checked={w.id === current.id} className="menu-item" onClick={() => switchWorkspace(w.id)}>
                  <span className="ws-avatar" aria-hidden="true">
                    {w.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.name}
                  </span>
                </button>
              ))}
              <div className="menu-sep" />
              <Link role="menuitem" className="menu-item" href="/app/settings#workspaces" onClick={() => setWsOpen(false)}>
                <Icon.Plus /> New workspace
              </Link>
            </div>
          ) : null}
        </div>

        <nav className="stack" style={{ '--stack': '6px', overflowY: 'auto' } as React.CSSProperties}>
          {NAV.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group-title">{group.title}</div>
              {group.items.map((item) => {
                const I = Icon[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="nav-link"
                    aria-current={isActive(item.href, item.exact) ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <I />
                    <span className="nav-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot" ref={profileRef} style={{ position: 'relative' }}>
          {plan === 'free' ? (
            <Link href="/app/billing" className="nav-link" title="Plan">
              <Icon.Sparkle />
              <span className="sidebar-foot-text">Free plan</span>
            </Link>
          ) : null}
          <button className="profile-btn" aria-haspopup="menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((v) => !v)}>
            <span className="avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="sidebar-foot-text grow" style={{ minWidth: 0 }}>
              <span className="small" style={{ display: 'block', fontWeight: 560, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || user.email}
              </span>
              <span className="xs subtle">{plan === 'paid' ? 'Paid plan' : 'Free plan'}</span>
            </span>
          </button>
          {profileOpen ? (
            <div className="menu" role="menu" style={{ bottom: 'calc(100% + 6px)', left: 0, minWidth: 230 }}>
              <div className="menu-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <Link role="menuitem" className="menu-item" href="/app/settings" onClick={closeProfile}>
                <Icon.Settings /> Settings
              </Link>
              <Link role="menuitem" className="menu-item" href="/" onClick={closeProfile}>
                <Icon.Home /> Vantaro website
              </Link>
              <div className="menu-sep" />
              <button role="menuitem" className="menu-item" onClick={logout}>
                <Icon.LogOut /> Log out
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button className="btn btn-ghost btn-icon menu-btn" onClick={() => setDrawer(true)} aria-label="Open navigation" aria-controls="app-sidebar" aria-expanded={drawer}>
            <Icon.Menu />
          </button>
          <button className="search-trigger" onClick={() => setPaletteOpen(true)} aria-haspopup="dialog">
            <Icon.Search />
            <span>Search or jump to…</span>
            <kbd className="hide-sm">⌘K</kbd>
          </button>
          <span className="mode-badge">
            {aiMode === 'preview' ? (
              <span className="tag tag-warn" title="No AI provider is connected. Generated content is labeled placeholder text.">
                <span className="dot" /> Preview mode
              </span>
            ) : aiMode === 'unavailable' ? (
              <span className="tag tag-danger">
                <span className="dot" /> Generation offline
              </span>
            ) : null}
          </span>
        </header>
        <main id="main" className="app-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      {paletteOpen ? <CommandPalette onClose={() => setPaletteOpen(false)} /> : null}
    </div>
  );
}
