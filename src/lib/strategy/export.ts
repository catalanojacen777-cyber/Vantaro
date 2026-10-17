import { toMarkdown } from '@/lib/view';
import { personaView, SECTIONS } from './sections';
import type { Strategy } from './repo';

type Exportable = Pick<Strategy, 'title' | 'generation_mode' | 'updated_at' | 'sections'> & { brief?: Strategy['brief'] };

export function strategyToMarkdown(st: Exportable, opts: { includeBrief?: boolean } = {}): string {
  const lines: string[] = [`# ${st.title}`, ''];
  lines.push(`Last updated ${new Date(st.updated_at).toISOString().slice(0, 10)}.`);
  if (st.sections.some((s) => s.mode === 'preview')) {
    lines.push('', '> Preview output: some sections contain placeholder text produced without an AI provider. They are not analysis.');
  }
  lines.push(
    '',
    '> Audience and persona content is a set of hypotheses based on the business brief. Validate it with real customers before relying on it.',
    '',
  );

  if (opts.includeBrief && st.brief) {
    lines.push('## Business brief', '');
    const b = st.brief;
    const rows: [string, string | undefined][] = [
      ['Business', b.businessName],
      ['What it sells', b.productDescription],
      ['Customers', b.customerType],
      ['Region', b.region],
      ['Stage', b.stage],
      ['Objective', b.objective],
      ['Budget', b.budget],
    ];
    for (const [k, v] of rows) if (v) lines.push(`- **${k}:** ${v}`);
    lines.push('');
  }

  for (const def of SECTIONS) {
    const sec = st.sections.find((s) => s.key === def.key);
    lines.push(`## ${def.title}`, '');
    if (!sec || sec.status !== 'ready' || !sec.content) {
      lines.push('_This section has not been generated._', '');
      continue;
    }
    lines.push(toMarkdown(def.view, sec.content), '');
    if (def.key === 'audience') {
      const personas = (sec.content as { personas?: unknown[] }).personas ?? [];
      personas.forEach((p) => {
        const name = (p as { name?: string }).name ?? 'Persona';
        const basis = (p as { basis?: string }).basis;
        lines.push(`### Persona: ${name}${basis ? ` (${basis})` : ''}`, '', toMarkdown(personaView, p, 4), '');
      });
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function fileSafe(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'strategy';
}
