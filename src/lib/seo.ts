import type { Metadata } from 'next';
import { absoluteUrl, config } from '@/config/site';

/**
 * Per-page metadata with an absolute self-referencing canonical built from the
 * configured production origin. Non-production deployments are never indexed.
 */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const url = absoluteUrl(opts.path);
  const index = config.allowIndexing && !opts.noindex;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: !opts.noindex },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: config.site.name,
      type: opts.type ?? 'website',
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description },
  };
}

export const PRIVATE_META: Metadata = { robots: { index: false, follow: false } };

type JsonLd = Record<string, unknown>;

export function organizationLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.site.name,
    url: config.site.url,
    logo: absoluteUrl('/icon.svg'),
    ...(config.operator.supportEmail
      ? { contactPoint: { '@type': 'ContactPoint', email: config.operator.supportEmail, contactType: 'customer support' } }
      : {}),
  };
}

export function websiteLd(): JsonLd {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: config.site.name, url: config.site.url };
}

export function breadcrumbLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

/** SoftwareApplication; an Offer is included only when a real price is configured. */
export function softwareLd(opts: { name: string; description: string; path: string; price?: { amount: number; currency: string } | null; free?: boolean }): JsonLd {
  const offer = opts.free
    ? { '@type': 'Offer', price: '0', priceCurrency: (config.billing.priceCurrency ?? 'usd').toUpperCase() }
    : opts.price
      ? { '@type': 'Offer', price: (opts.price.amount / 100).toFixed(2), priceCurrency: opts.price.currency.toUpperCase() }
      : null;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    ...(offer && (opts.free || config.billing.priceCurrency) ? { offers: offer } : {}),
  };
}

export function articleLd(opts: { title: string; description: string; path: string; published: string; modified: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    mainEntityOfPage: absoluteUrl(opts.path),
    datePublished: opts.published,
    dateModified: opts.modified,
    author: { '@type': 'Organization', name: config.site.name },
    publisher: { '@type': 'Organization', name: config.site.name, logo: { '@type': 'ImageObject', url: absoluteUrl('/icon.svg') } },
  };
}

export function faqLd(items: { q: string; a: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.a } })),
  };
}
