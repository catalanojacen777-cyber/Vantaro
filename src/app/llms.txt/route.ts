import { absoluteUrl, config } from '@/config/site';
import { GUIDES } from '@/content/resources';
import { TOOLS } from '@/lib/tools/registry';

export const dynamic = 'force-static';

/** Optional, experimental summary of public resources. Not a ranking mechanism. */
export function GET() {
  const lines = [
    `# ${config.site.name}`,
    '',
    `> ${config.site.description}`,
    '',
    '## Product',
    `- [Marketing strategy](${absoluteUrl('/marketing-strategy')}): eleven-section strategy from a business brief`,
    `- [Features](${absoluteUrl('/features')})`,
    `- [Pricing](${absoluteUrl('/pricing')})`,
    `- [FAQ](${absoluteUrl('/faq')})`,
    '',
    '## Free tools',
    ...TOOLS.map((t) => `- [${t.name}](${absoluteUrl(`/tools/${t.slug}`)}): ${t.summary}`),
    '',
    '## Guides',
    ...GUIDES.map((g) => `- [${g.title}](${absoluteUrl(`/resources/${g.slug}`)}): ${g.description}`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
