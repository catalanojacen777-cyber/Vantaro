/**
 * A tiny schema language for structured model output. One definition yields:
 *  - JSON Schema for the model's tool input (so the model returns structure)
 *  - a validator/normalizer for what comes back (never trust the model)
 *  - a deterministic preview sample (labeled placeholder output for
 *    environments without an AI key)
 */

export type Schema =
  | { t: 'str'; d: string; min?: number; max?: number }
  | { t: 'num'; d: string; min?: number; max?: number; int?: boolean }
  | { t: 'enum'; d: string; values: readonly string[] }
  | { t: 'bool'; d: string }
  | { t: 'arr'; d: string; of: Schema; min?: number; max?: number }
  | { t: 'obj'; d?: string; props: Record<string, Schema>; optional?: readonly string[] };

export const s = {
  str: (d: string, opts: { min?: number; max?: number } = {}): Schema => ({ t: 'str', d, max: 2000, ...opts }),
  text: (d: string, max = 1200): Schema => ({ t: 'str', d, max }),
  short: (d: string, max = 160): Schema => ({ t: 'str', d, max }),
  num: (d: string, opts: { min?: number; max?: number; int?: boolean } = {}): Schema => ({ t: 'num', d, ...opts }),
  enum: (values: readonly string[], d: string): Schema => ({ t: 'enum', d, values }),
  bool: (d: string): Schema => ({ t: 'bool', d }),
  arr: (of: Schema, min: number, max: number, d: string): Schema => ({ t: 'arr', d, of, min, max }),
  obj: (props: Record<string, Schema>, d?: string, optional?: readonly string[]): Schema => ({
    t: 'obj',
    d,
    props,
    optional,
  }),
  /** Where a claim comes from. Keeps facts and hypotheses visibly separate. */
  basis: (): Schema => ({
    t: 'enum',
    d: 'provided = stated in the user input; hypothesis = your inference to be validated',
    values: ['provided', 'hypothesis'] as const,
  }),
};

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export function toJsonSchema(schema: Schema): Record<string, unknown> {
  switch (schema.t) {
    case 'str':
      return { type: 'string', description: schema.d, ...(schema.max ? { maxLength: schema.max } : {}) };
    case 'num':
      return {
        type: schema.int ? 'integer' : 'number',
        description: schema.d,
        ...(schema.min !== undefined ? { minimum: schema.min } : {}),
        ...(schema.max !== undefined ? { maximum: schema.max } : {}),
      };
    case 'enum':
      return { type: 'string', enum: [...schema.values], description: schema.d };
    case 'bool':
      return { type: 'boolean', description: schema.d };
    case 'arr':
      return {
        type: 'array',
        description: schema.d,
        items: toJsonSchema(schema.of),
        ...(schema.min !== undefined ? { minItems: schema.min } : {}),
        ...(schema.max !== undefined ? { maxItems: schema.max } : {}),
      };
    case 'obj': {
      const optional = new Set(schema.optional ?? []);
      return {
        type: 'object',
        ...(schema.d ? { description: schema.d } : {}),
        properties: Object.fromEntries(Object.entries(schema.props).map(([k, v]) => [k, toJsonSchema(v)])),
        required: Object.keys(schema.props).filter((k) => !optional.has(k)),
        additionalProperties: false,
      };
    }
  }
}

export type ValidationResult = { ok: true; value: Json } | { ok: false; errors: string[] };

/**
 * Validate and normalize. Lenient where it is safe (trim, truncate overlong
 * strings, drop extra array items, drop unknown keys); strict where content
 * would be missing or wrong-typed.
 */
export function validate(schema: Schema, value: unknown, path = '$'): ValidationResult {
  const errors: string[] = [];
  const out = walk(schema, value, path, errors);
  return errors.length ? { ok: false, errors: errors.slice(0, 20) } : { ok: true, value: out as Json };
}

function walk(schema: Schema, value: unknown, path: string, errors: string[]): Json | undefined {
  switch (schema.t) {
    case 'str': {
      if (typeof value !== 'string') {
        errors.push(`${path}: expected text`);
        return undefined;
      }
      let v = value.replace(/\u0000/g, '').trim();
      if (!v && (schema.min ?? 1) > 0) {
        errors.push(`${path}: must not be empty`);
        return undefined;
      }
      if (schema.max && v.length > schema.max) v = v.slice(0, schema.max).trimEnd();
      return v;
    }
    case 'num': {
      const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
      if (typeof n !== 'number' || !Number.isFinite(n)) {
        errors.push(`${path}: expected a number`);
        return undefined;
      }
      if (schema.min !== undefined && n < schema.min) errors.push(`${path}: must be ≥ ${schema.min}`);
      if (schema.max !== undefined && n > schema.max) errors.push(`${path}: must be ≤ ${schema.max}`);
      return schema.int ? Math.round(n) : n;
    }
    case 'enum': {
      if (typeof value !== 'string') {
        errors.push(`${path}: expected one of ${schema.values.join(', ')}`);
        return undefined;
      }
      const match = schema.values.find((v) => v.toLowerCase() === value.trim().toLowerCase());
      if (!match) errors.push(`${path}: "${value.slice(0, 40)}" is not one of ${schema.values.join(', ')}`);
      return match;
    }
    case 'bool':
      if (typeof value !== 'boolean') {
        errors.push(`${path}: expected true or false`);
        return undefined;
      }
      return value;
    case 'arr': {
      if (!Array.isArray(value)) {
        errors.push(`${path}: expected a list`);
        return undefined;
      }
      const items = schema.max !== undefined ? value.slice(0, schema.max) : value;
      if (schema.min !== undefined && items.length < schema.min) {
        errors.push(`${path}: expected at least ${schema.min} items, got ${items.length}`);
      }
      return items.map((item, i) => walk(schema.of, item, `${path}[${i}]`, errors)) as Json[];
    }
    case 'obj': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`${path}: expected an object`);
        return undefined;
      }
      const optional = new Set(schema.optional ?? []);
      const src = value as Record<string, unknown>;
      const out: Record<string, Json> = {};
      for (const [k, sub] of Object.entries(schema.props)) {
        if (src[k] === undefined || src[k] === null) {
          if (!optional.has(k)) errors.push(`${path}.${k}: missing`);
          continue;
        }
        const v = walk(sub, src[k], `${path}.${k}`, errors);
        if (v !== undefined) out[k] = v;
      }
      return out;
    }
  }
}

/**
 * Deterministic, clearly-labeled placeholder that matches the schema shape.
 * Used only in preview mode so the full workflow can be exercised without an
 * AI provider. It never pretends to be analysis.
 */
export function sample(schema: Schema, subject: string, index = 0): Json {
  switch (schema.t) {
    case 'str': {
      const label = schema.d.replace(/\.$/, '');
      const base = `[Preview] ${label}`;
      const withSubject = index === 0 && subject ? `${base} for ${subject}` : `${base} (${index + 1})`;
      return schema.max ? withSubject.slice(0, schema.max) : withSubject;
    }
    case 'num':
      return schema.min !== undefined ? Math.max(schema.min, 1) : 1;
    case 'enum':
      // Placeholder text must never be labeled as a fact from the user's brief.
      if (schema.values.includes('hypothesis')) return 'hypothesis';
      return schema.values[index % schema.values.length];
    case 'bool':
      return index % 2 === 0;
    case 'arr': {
      const count = Math.min(schema.max ?? 3, Math.max(schema.min ?? 0, 3));
      return Array.from({ length: count }, (_, i) => sample(schema.of, subject, i));
    }
    case 'obj':
      return Object.fromEntries(Object.entries(schema.props).map(([k, v]) => [k, sample(v, subject, index)]));
  }
}
