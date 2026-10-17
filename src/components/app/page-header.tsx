import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/icons';

export function PageHeader({
  crumbs,
  title,
  description,
  actions,
}: {
  crumbs?: { href: string; label: string }[];
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div style={{ minWidth: 0, flex: '1 1 420px' }}>
        {crumbs?.length ? (
          <nav aria-label="Breadcrumb">
            <ol className="crumbs" role="list">
              {crumbs.map((c) => (
                <li key={c.href} className="cluster" style={{ '--gap': '6px' } as React.CSSProperties}>
                  <Link href={c.href}>{c.label}</Link>
                  <Icon.ChevronRight />
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1>{title}</h1>
        {description ? <p className="muted mt-2 measure">{description}</p> : null}
      </div>
      {actions ? <div className="cluster">{actions}</div> : null}
    </div>
  );
}
