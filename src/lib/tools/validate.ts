import type { Field, Tool } from './types';

export type FieldValues = Record<string, string | number>;

export function validateFields(
  fields: Field[],
  raw: Record<string, unknown>,
): { ok: true; values: FieldValues } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const values: FieldValues = {};
  for (const f of fields) {
    const v = raw[f.name];
    if (f.type === 'number') {
      if (v === undefined || v === null || v === '') {
        if (f.required) errors[f.name] = `Enter ${f.label.toLowerCase()}.`;
        else if (f.default !== undefined) values[f.name] = f.default;
        continue;
      }
      const n = typeof v === 'number' ? v : Number(String(v).replace(/[,\s]/g, ''));
      if (!Number.isFinite(n)) errors[f.name] = `${f.label} must be a number.`;
      else if (f.min !== undefined && n < f.min) errors[f.name] = `${f.label} must be at least ${f.min}.`;
      else if (f.max !== undefined && n > f.max) errors[f.name] = `${f.label} must be at most ${f.max}.`;
      else values[f.name] = n;
      continue;
    }
    const sv = typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
    if (f.type === 'select') {
      if (!sv) {
        if (f.required) errors[f.name] = `Choose ${f.label.toLowerCase()}.`;
        else if (f.default) values[f.name] = f.default;
        continue;
      }
      if (!f.options.includes(sv)) errors[f.name] = `Choose one of the listed options for ${f.label.toLowerCase()}.`;
      else values[f.name] = sv;
      continue;
    }
    if (!sv) {
      if (f.required) errors[f.name] = `${f.label} is required.`;
      continue;
    }
    if (f.min && sv.length < f.min) errors[f.name] = `Add a bit more detail (at least ${f.min} characters).`;
    else if (sv.length > f.max) errors[f.name] = `Keep this under ${f.max} characters.`;
    else values[f.name] = sv;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values };
}

export function validateToolInput(tool: Tool, raw: Record<string, unknown>) {
  return validateFields(tool.fields, raw);
}
