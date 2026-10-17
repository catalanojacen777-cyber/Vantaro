import { describe, expect, it } from 'vitest';
import { TOOLS, TOOL_BY_SLUG } from '@/lib/tools/registry';
import { sample, toJsonSchema, validate } from '@/lib/ai/schema';
import { validateToolInput } from '@/lib/tools/validate';

describe('tool registry', () => {
  it('has all 34 tools with unique slugs and valid relations', () => {
    expect(TOOLS).toHaveLength(34);
    expect(new Set(TOOLS.map((t) => t.slug)).size).toBe(34);
    for (const t of TOOLS) {
      for (const r of t.related) expect(TOOL_BY_SLUG[r], `${t.slug} -> ${r}`).toBeTruthy();
      expect(t.examples.length, t.slug).toBeGreaterThan(0);
      expect(t.answer.length).toBeGreaterThan(80);
    }
  });

  it('every AI tool schema compiles, samples validly, and its example inputs validate', () => {
    for (const t of TOOLS) {
      const ex = validateToolInput(t, t.examples[0].values);
      expect(ex.ok, `${t.slug} example: ${JSON.stringify(!ex.ok && ex.errors)}`).toBe(true);
      if (t.kind !== 'ai') continue;
      expect(t.fields.some((f) => f.name === t.subjectField), `${t.slug} subjectField`).toBe(true);
      const js = toJsonSchema(t.schema) as { type: string };
      expect(js.type).toBe('object');
      const res = validate(t.schema, sample(t.schema, 'Acme'));
      expect(res.ok, `${t.slug}: ${!res.ok ? res.errors.join(',') : ''}`).toBe(true);
      for (const block of t.view) {
        if ('key' in block && block.key) expect(Object.keys((t.schema as { props: object }).props), `${t.slug} view key ${block.key}`).toContain(block.key.split('.')[0]);
      }
    }
  });

  it('rejects missing required fields and over-long input', () => {
    const t = TOOL_BY_SLUG['slogan-generator'];
    const r = validateToolInput(t, { business: '' });
    expect(r.ok).toBe(false);
    const long = validateToolInput(t, { business: 'x'.repeat(5000) });
    expect(long.ok).toBe(false);
  });
});
