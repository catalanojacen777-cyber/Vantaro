import type { MetadataRoute } from 'next';
import { absoluteUrl, policiesReady } from '@/config/site';
import { EXAMPLES, EXAMPLE_CATEGORIES } from '@/content/examples';
import { FEATURES } from '@/content/features';
import { GUIDES } from '@/content/resources';
import { SOLUTIONS } from '@/content/solutions';
import { TOOLS } from '@/lib/tools/registry';

/** Canonical, indexable public pages only. */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['/', '/features', '/marketing-strategy', '/free-tools', '/examples', '/solutions', '/pricing', '/faq', '/contact', '/about', '/resources'];
  if (policiesReady()) staticPaths.push('/privacy', '/terms');
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({ url: absoluteUrl(p) }));
  for (const f of FEATURES) entries.push({ url: absoluteUrl(`/features/${f.slug}`) });
  for (const s of SOLUTIONS) entries.push({ url: absoluteUrl(`/solutions/${s.slug}`) });
  for (const t of TOOLS) entries.push({ url: absoluteUrl(`/tools/${t.slug}`) });
  for (const c of Object.keys(EXAMPLE_CATEGORIES)) entries.push({ url: absoluteUrl(`/examples/${c}`) });
  for (const e of EXAMPLES) entries.push({ url: absoluteUrl(`/examples/${e.category}/${e.slug}`), lastModified: e.updated });
  for (const g of GUIDES) entries.push({ url: absoluteUrl(`/resources/${g.slug}`), lastModified: g.updated });
  return entries;
}
