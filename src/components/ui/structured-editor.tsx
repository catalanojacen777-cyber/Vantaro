'use client';

import { useId } from 'react';
import type { Schema } from '@/lib/ai/schema';
import { Icon } from './icons';

type Json = unknown;

export function humanize(key: string) {
  const s = key.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function blank(schema: Schema): Json {
  switch (schema.t) {
    case 'str':
      return '';
    case 'num':
      return schema.min ?? 0;
    case 'enum':
      return schema.values[0];
    case 'bool':
      return false;
    case 'arr':
      return [];
    case 'obj':
      return Object.fromEntries(Object.entries(schema.props).map(([k, v]) => [k, blank(v)]));
  }
}

/**
 * Schema-driven editor: every field the model produced is editable, list
 * lengths respect the schema, and the server validates again on save.
 */
export function StructuredEditor({
  schema,
  value,
  onChange,
  label,
  depth = 0,
}: {
  schema: Schema;
  value: Json;
  onChange: (v: Json) => void;
  label?: string;
  depth?: number;
}) {
  const id = useId().replace(/:/g, '');
  switch (schema.t) {
    case 'str': {
      const long = (schema.max ?? 2000) > 200;
      const v = typeof value === 'string' ? value : '';
      return (
        <div className="field">
          {label ? (
            <label className="field-label" htmlFor={id}>
              {label}
            </label>
          ) : null}
          {long ? (
            <textarea
              id={id}
              className="textarea se-textarea"
              value={v}
              maxLength={schema.max}
              rows={Math.min(8, Math.max(2, Math.ceil(v.length / 70)))}
              onChange={(e) => onChange(e.target.value)}
              aria-label={label ? undefined : schema.d}
            />
          ) : (
            <input id={id} className="input" value={v} maxLength={schema.max} onChange={(e) => onChange(e.target.value)} aria-label={label ? undefined : schema.d} />
          )}
        </div>
      );
    }
    case 'num':
      return (
        <div className="field">
          {label ? (
            <label className="field-label" htmlFor={id}>
              {label}
            </label>
          ) : null}
          <input id={id} className="input" type="number" inputMode="decimal" value={typeof value === 'number' ? value : ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      );
    case 'enum':
      return (
        <div className="field">
          {label ? (
            <label className="field-label" htmlFor={id}>
              {label}
            </label>
          ) : null}
          <select id={id} className="select" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)}>
            {schema.values.map((o) => (
              <option key={o} value={o}>
                {o === 'provided' ? 'From your brief' : o === 'hypothesis' ? 'Hypothesis' : o}
              </option>
            ))}
          </select>
        </div>
      );
    case 'bool':
      return (
        <label className="choice">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span className="check" aria-hidden="true">
            <Icon.Check />
          </span>
          {label}
        </label>
      );
    case 'arr': {
      const items = Array.isArray(value) ? value : [];
      const canAdd = schema.max === undefined || items.length < schema.max;
      const canRemove = schema.min === undefined || items.length > schema.min;
      const scalar = schema.of.t !== 'obj';
      return (
        <fieldset className="se-group">
          {label ? <legend className="field-label">{label}</legend> : null}
          <div className="stack" style={{ '--stack': scalar ? '8px' : '14px' } as React.CSSProperties}>
            {items.map((item, i) => (
              <div key={i} className={scalar ? 'se-row' : 'se-item'}>
                <div className="grow">
                  <StructuredEditor
                    schema={schema.of}
                    value={item}
                    depth={depth + 1}
                    label={scalar ? undefined : undefined}
                    onChange={(nv) => onChange(items.map((x, j) => (j === i ? nv : x)))}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  disabled={!canRemove}
                  title={canRemove ? 'Remove' : `Keep at least ${schema.min}`}
                  aria-label={`Remove item ${i + 1}${label ? ` from ${label.toLowerCase()}` : ''}`}
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                >
                  <Icon.Trash />
                </button>
              </div>
            ))}
          </div>
          {canAdd ? (
            <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => onChange([...items, blank(schema.of)])}>
              <Icon.Plus /> Add {label ? label.toLowerCase().replace(/s$/, '') : 'item'}
            </button>
          ) : null}
        </fieldset>
      );
    }
    case 'obj': {
      const obj = (value && typeof value === 'object' ? value : {}) as Record<string, Json>;
      return (
        <div className={depth > 0 ? 'se-obj' : 'stack'} style={{ '--stack': '18px' } as React.CSSProperties}>
          {label && depth > 0 ? <div className="field-label">{label}</div> : null}
          {Object.entries(schema.props).map(([k, sub]) => (
            <StructuredEditor key={k} schema={sub} value={obj[k]} depth={depth + 1} label={humanize(k)} onChange={(nv) => onChange({ ...obj, [k]: nv })} />
          ))}
        </div>
      );
    }
  }
}
