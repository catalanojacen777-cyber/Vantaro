'use client';

import { useId, type ReactNode } from 'react';
import { Icon } from './icons';

export function Field({
  label,
  help,
  error,
  optional,
  children,
  counter,
  htmlFor,
}: {
  label: string;
  help?: ReactNode;
  error?: string | null;
  optional?: boolean;
  counter?: { value: number; max: number };
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        <span>{label}</span>
        {optional ? <span className="optional">Optional</span> : null}
      </label>
      {help ? (
        <p className="field-help" id={`${htmlFor}-help`}>
          {help}
        </p>
      ) : null}
      {children}
      <div className="cluster" style={{ justifyContent: 'space-between', minHeight: error || counter ? 18 : 0 }}>
        {error ? (
          <p className="field-error" id={`${htmlFor}-error`} role="alert">
            <Icon.Warning width={14} height={14} />
            {error}
          </p>
        ) : (
          <span />
        )}
        {counter && counter.value > counter.max * 0.7 ? (
          <span className={`counter${counter.value > counter.max ? ' over' : ''}`} aria-live="polite">
            {counter.value}/{counter.max}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function describedBy(id: string, opts: { help?: unknown; error?: unknown }) {
  return [opts.help ? `${id}-help` : null, opts.error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
}

export function useFieldId(name: string) {
  const base = useId().replace(/:/g, '');
  return `${name}-${base}`;
}

export function SubmitButton({
  pending,
  children,
  pendingLabel,
  className = 'btn btn-primary',
  disabled,
}: {
  pending: boolean;
  children: ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
