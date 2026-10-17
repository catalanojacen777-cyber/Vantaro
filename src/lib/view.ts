/**
 * Declarative description of how structured output is displayed and exported.
 * The same spec drives the on-screen renderer and the Markdown export, so
 * what people see and what they download never drift apart.
 */
export type FieldRef = { key: string; label: string };

export type ViewBlock =
  | { kind: 'text'; key: string; label?: string }
  | { kind: 'list'; key: string; label?: string; ordered?: boolean }
  | {
      kind: 'cards';
      key: string;
      label?: string;
      title: string;
      body?: string;
      fields?: FieldRef[];
      badges?: FieldRef[];
      /** Show as a compact two-column grid on wide screens. */
      grid?: boolean;
    }
  | { kind: 'fields'; key?: string; label?: string; fields: FieldRef[] }
  | { kind: 'table'; key: string; label?: string; columns: FieldRef[] }
  | { kind: 'quad'; label?: string; cells: [FieldRef, FieldRef, FieldRef, FieldRef] };

type Obj = Record<string, unknown>;

export function get(obj: unknown, key: string | undefined): unknown {
  if (!key) return obj;
  return key.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Obj)[k] : undefined), obj);
}

export function asText(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(asText).filter(Boolean).join('; ');
  if (typeof v === 'object') return Object.values(v as Obj).map(asText).filter(Boolean).join(' — ');
  return String(v);
}

function mdEscape(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

export function toMarkdown(view: ViewBlock[], data: unknown, headingLevel = 3): string {
  const h = '#'.repeat(headingLevel);
  const out: string[] = [];
  for (const b of view) {
    switch (b.kind) {
      case 'text': {
        const v = asText(get(data, b.key));
        if (!v) break;
        if (b.label) out.push(`${h} ${b.label}`, '');
        out.push(v, '');
        break;
      }
      case 'list': {
        const v = get(data, b.key);
        if (!Array.isArray(v) || !v.length) break;
        if (b.label) out.push(`${h} ${b.label}`, '');
        v.forEach((item, i) => out.push(`${b.ordered ? `${i + 1}.` : '-'} ${asText(item)}`));
        out.push('');
        break;
      }
      case 'cards': {
        const v = get(data, b.key);
        if (!Array.isArray(v) || !v.length) break;
        if (b.label) out.push(`${h} ${b.label}`, '');
        for (const item of v) {
          out.push(`**${asText(get(item, b.title))}**`);
          const badges = (b.badges ?? []).map((f) => `${f.label}: ${asText(get(item, f.key))}`).filter((x) => !x.endsWith(': '));
          if (badges.length) out.push(`_${badges.join(' | ')}_`);
          if (b.body) {
            const body = asText(get(item, b.body));
            if (body) out.push('', body);
          }
          for (const f of b.fields ?? []) {
            const fv = get(item, f.key);
            if (Array.isArray(fv) && fv.length) {
              out.push('', `${f.label}:`);
              fv.forEach((x) => out.push(`- ${asText(x)}`));
            } else if (asText(fv)) {
              out.push(`- ${f.label}: ${asText(fv)}`);
            }
          }
          out.push('');
        }
        break;
      }
      case 'fields': {
        const base = get(data, b.key);
        if (b.label) out.push(`${h} ${b.label}`, '');
        for (const f of b.fields) {
          const fv = get(base, f.key);
          if (Array.isArray(fv) && fv.length) {
            out.push(`**${f.label}**`);
            fv.forEach((x) => out.push(`- ${asText(x)}`));
            out.push('');
          } else if (asText(fv)) {
            out.push(`**${f.label}:** ${asText(fv)}`, '');
          }
        }
        break;
      }
      case 'table': {
        const v = get(data, b.key);
        if (!Array.isArray(v) || !v.length) break;
        if (b.label) out.push(`${h} ${b.label}`, '');
        out.push(`| ${b.columns.map((c) => c.label).join(' | ')} |`);
        out.push(`| ${b.columns.map(() => '---').join(' | ')} |`);
        for (const row of v) out.push(`| ${b.columns.map((c) => mdEscape(asText(get(row, c.key)))).join(' | ')} |`);
        out.push('');
        break;
      }
      case 'quad': {
        if (b.label) out.push(`${h} ${b.label}`, '');
        for (const cell of b.cells) {
          const v = get(data, cell.key);
          out.push(`**${cell.label}**`);
          if (Array.isArray(v)) v.forEach((x) => out.push(`- ${asText(x)}`));
          else if (asText(v)) out.push(asText(v));
          out.push('');
        }
        break;
      }
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Plain text for clipboard copy. */
export function toPlainText(view: ViewBlock[], data: unknown): string {
  return toMarkdown(view, data)
    .replace(/^#+\s/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/_(.+?)_/g, '$1');
}
