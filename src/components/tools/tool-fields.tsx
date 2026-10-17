'use client';

import type { Field } from '@/lib/tools/types';
import { Field as FieldWrap, describedBy } from '@/components/ui/form';

export type Values = Record<string, string | number>;

export function ToolFields({
  fields,
  values,
  errors,
  onChange,
  idPrefix,
  columns,
}: {
  fields: Field[];
  values: Values;
  errors: Record<string, string>;
  onChange: (name: string, value: string | number) => void;
  idPrefix: string;
  columns?: boolean;
}) {
  return (
    <div className={columns ? 'tool-fields tool-fields-cols' : 'tool-fields'}>
      {fields.map((f) => {
        const id = `${idPrefix}-${f.name}`;
        const err = errors[f.name];
        const value = values[f.name] ?? '';
        const common = {
          id,
          'aria-invalid': !!err,
          'aria-describedby': describedBy(id, { help: 'help' in f && f.help, error: err }),
        };
        const wide = f.type === 'textarea';
        return (
          <div key={f.name} className={wide ? 'tool-field-wide' : undefined}>
            <FieldWrap
              label={f.label}
              htmlFor={id}
              optional={!f.required && f.type !== 'select'}
              help={'help' in f ? f.help : undefined}
              error={err}
              counter={f.type === 'textarea' || f.type === 'text' ? { value: String(value).length, max: f.max } : undefined}
            >
              {f.type === 'textarea' ? (
                <textarea
                  {...common}
                  className="textarea"
                  rows={4}
                  maxLength={f.max + 200}
                  placeholder={f.placeholder}
                  value={String(value)}
                  onChange={(e) => onChange(f.name, e.target.value)}
                  required={f.required}
                />
              ) : f.type === 'text' ? (
                <input {...common} className="input" maxLength={f.max + 50} placeholder={f.placeholder} value={String(value)} onChange={(e) => onChange(f.name, e.target.value)} required={f.required} />
              ) : f.type === 'select' ? (
                <select {...common} className="select" value={String(value || f.default || f.options[0])} onChange={(e) => onChange(f.name, e.target.value)}>
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <div className="input-affix">
                  <input
                    {...common}
                    className="input nums"
                    type="number"
                    inputMode="decimal"
                    step={f.step ?? 'any'}
                    min={f.min}
                    max={f.max}
                    value={value === '' ? '' : String(value)}
                    onChange={(e) => onChange(f.name, e.target.value)}
                    required={f.required}
                  />
                </div>
              )}
            </FieldWrap>
          </div>
        );
      })}
    </div>
  );
}

export function initialValues(fields: Field[]): Values {
  const v: Values = {};
  for (const f of fields) {
    if (f.type === 'select') v[f.name] = f.default ?? f.options[0];
    else if (f.type === 'number' && f.default !== undefined) v[f.name] = f.default;
    else v[f.name] = '';
  }
  return v;
}

/** Client-side mirror of server validation, for instant feedback. */
export function clientValidate(fields: Field[], values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.name];
    const s = typeof v === 'string' ? v.trim() : v;
    if (f.required && (s === '' || s === undefined)) {
      errors[f.name] = f.type === 'select' ? `Choose ${f.label.toLowerCase()}.` : `${f.label} is required.`;
      continue;
    }
    if ((f.type === 'text' || f.type === 'textarea') && typeof s === 'string' && s) {
      if (f.min && s.length < f.min) errors[f.name] = `Add a bit more detail (at least ${f.min} characters).`;
      else if (s.length > f.max) errors[f.name] = `Keep this under ${f.max} characters.`;
    }
    if (f.type === 'number' && s !== '' && s !== undefined) {
      const n = Number(s);
      if (!Number.isFinite(n)) errors[f.name] = `${f.label} must be a number.`;
      else if (f.min !== undefined && n < f.min) errors[f.name] = `${f.label} must be at least ${f.min}.`;
      else if (f.max !== undefined && n > f.max) errors[f.name] = `${f.label} must be at most ${f.max}.`;
    }
  }
  return errors;
}
