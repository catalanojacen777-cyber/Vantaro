import { config, policiesReady } from '@/config/site';
import { Icon } from '@/components/ui/icons';
import { PageHero } from './page-parts';

/** Policies render from configuration. Missing operator facts are shown as gaps, never invented. */
export function PolicyShell({ title, path, children }: { title: string; path: string; children: React.ReactNode }) {
  const ready = policiesReady();
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: title, path }]} title={title}>
        {ready ? (
          <p className="meta-row">Effective {config.operator.policiesEffectiveDate}</p>
        ) : (
          <div className="notice notice-warn" role="note">
            <Icon.Warning />
            <span>
              <strong>Draft, not yet in force.</strong> This policy describes how the software handles data today, but the operator’s legal details have not been configured. It must be completed and reviewed before launch.
            </span>
          </div>
        )}
      </PageHero>
      <section className="container">
        <div className="prose">{children}</div>
      </section>
    </>
  );
}

export function Operator() {
  const o = config.operator;
  return <>{o.legalName ? `${o.legalName}${o.address ? `, ${o.address}` : ''}` : '[operator legal name and address not configured]'}</>;
}
