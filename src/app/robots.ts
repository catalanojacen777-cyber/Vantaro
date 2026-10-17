import type { MetadataRoute } from 'next';
import { absoluteUrl, config } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  if (!config.allowIndexing) {
    // Preview and development deployments are never indexed.
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/app', '/api/', '/share/', '/login', '/signup', '/reset-password'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
