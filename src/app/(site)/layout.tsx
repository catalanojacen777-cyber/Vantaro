import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { JsonLd } from '@/components/ui/json-ld';
import { FEATURES } from '@/content/features';
import { SOLUTIONS } from '@/content/solutions';
import { organizationLd, websiteLd } from '@/lib/seo';
import '@/styles/site.css';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader
        features={FEATURES.map((f) => ({ href: `/features/${f.slug}`, name: f.name }))}
        solutions={SOLUTIONS.map((s) => ({ href: `/solutions/${s.slug}`, name: s.name }))}
      />
      <main id="main">{children}</main>
      <SiteFooter />
      <JsonLd data={[organizationLd(), websiteLd()]} />
    </>
  );
}
