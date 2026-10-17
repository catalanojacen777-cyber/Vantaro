import { describe, expect, it } from 'vitest';
import { validate } from '@/lib/ai/schema';
import { TOOL_BY_SLUG } from '@/lib/tools/registry';
import { EXAMPLES, EXAMPLE_CATEGORIES } from '@/content/examples';
import { GUIDES } from '@/content/resources';
import { SOLUTIONS } from '@/content/solutions';

describe('examples library', () => {
  it('has unique paths and known categories', () => {
    const paths = EXAMPLES.map((e) => `${e.category}/${e.slug}`);
    expect(new Set(paths).size).toBe(paths.length);
    for (const e of EXAMPLES) {
      expect(EXAMPLE_CATEGORIES[e.category], e.slug).toBe(e.categoryName);
      expect(e.notes.length, e.slug).toBeGreaterThanOrEqual(2);
      expect(e.description.length, e.slug).toBeGreaterThan(40);
    }
  });

  it('tool examples match the live tool: same input labels and a valid output', () => {
    for (const e of EXAMPLES.filter((x) => x.kind === 'tool')) {
      const tool = TOOL_BY_SLUG[e.toolSlug!];
      expect(tool, e.slug).toBeTruthy();
      expect(tool.kind, e.slug).toBe('ai');
      const labels = new Set(tool.fields.map((f) => f.label));
      for (const k of Object.keys(e.inputs)) expect(labels.has(k), `${e.slug}: unknown input label "${k}"`).toBe(true);
      if (tool.kind !== 'ai') continue;
      const res = validate(tool.schema, e.output);
      expect(res.ok, `${e.slug}: ${!res.ok ? res.errors.join('; ') : ''}`).toBe(true);
      // Validation may truncate over-long strings; examples must already fit.
      expect(JSON.stringify(res.ok && res.value), `${e.slug}: text exceeds a field limit`).toBe(JSON.stringify(e.output));
    }
  });
});

describe('guides and solutions', () => {
  it('guides have unique slugs, a direct answer and valid related links', () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
    for (const g of GUIDES) {
      expect(g.answer.length, g.slug).toBeGreaterThan(120);
      for (const t of g.related.tools) expect(TOOL_BY_SLUG[t], `${g.slug} -> ${t}`).toBeTruthy();
    }
  });

  it('solutions have unique slugs', () => {
    expect(new Set(SOLUTIONS.map((x) => x.slug)).size).toBe(SOLUTIONS.length);
  });
});
