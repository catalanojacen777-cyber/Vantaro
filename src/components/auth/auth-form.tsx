'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, ApiError, safeNext } from '@/lib/client-api';
import { describedBy, Field, SubmitButton, useFieldId } from '@/components/ui/form';
import { Icon } from '@/components/ui/icons';

type Mode = 'login' | 'signup' | 'reset-request' | 'reset-confirm';

const COPY: Record<Mode, { title: string; lede: string; submit: string; pending: string }> = {
  login: { title: 'Log in', lede: 'Pick up where you left off.', submit: 'Log in', pending: 'Logging in' },
  signup: {
    title: 'Create your account',
    lede: 'Free to start. Save tool results, build a strategy, and come back to it any time.',
    submit: 'Create account',
    pending: 'Creating account',
  },
  'reset-request': {
    title: 'Reset your password',
    lede: 'Enter the email you signed up with and we will send a link to set a new password.',
    submit: 'Send reset link',
    pending: 'Sending',
  },
  'reset-confirm': { title: 'Choose a new password', lede: 'This also signs you out of other devices.', submit: 'Save new password', pending: 'Saving' },
};

export function AuthForm({ mode, next, token }: { mode: Mode; next?: string; token?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const ids = { name: useFieldId('name'), email: useFieldId('email'), password: useFieldId('password') };
  const copy = COPY[mode];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const errs: Record<string, string> = {};
    if (mode !== 'reset-confirm' && !/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    if ((mode === 'signup' || mode === 'reset-confirm') && password.length < 10) errs.password = 'Use at least 10 characters.';
    if (mode === 'login' && !password) errs.password = 'Enter your password.';
    setFieldErrors(errs);
    setError(null);
    if (Object.keys(errs).length) return;
    setPending(true);
    try {
      if (mode === 'login') {
        await api('/api/auth/login', { body: { email, password } });
        router.replace(safeNext(next));
        router.refresh();
        return;
      }
      if (mode === 'signup') {
        await api('/api/auth/signup', { body: { email, password, name: String(form.get('name') ?? '') } });
        router.replace(safeNext(next, '/app/brief'));
        router.refresh();
        return;
      }
      if (mode === 'reset-request') {
        const res = await api<{ message: string }>('/api/auth/reset-request', { body: { email } });
        setDone(res.message);
        return;
      }
      await api('/api/auth/reset-confirm', { body: { token, password } });
      router.replace('/app');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && typeof err.data.field === 'string') setFieldErrors({ [err.data.field]: err.message });
      else setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="stack" style={{ '--stack': '10px' } as React.CSSProperties}>
        <h1 className="auth-title">{copy.title}</h1>
        <p className="muted">{copy.lede}</p>
      </div>

      {done ? (
        <div className="notice notice-ice mt-6" role="status">
          <Icon.Mail />
          <span>{done}</span>
        </div>
      ) : (
        <form className="stack mt-6" style={{ '--stack': '18px' } as React.CSSProperties} onSubmit={onSubmit} noValidate>
          {error ? (
            <div className="notice notice-danger" role="alert">
              <Icon.Warning />
              <span>{error}</span>
            </div>
          ) : null}
          {mode === 'signup' ? (
            <Field label="Your name" optional htmlFor={ids.name}>
              <input id={ids.name} name="name" className="input" autoComplete="name" maxLength={80} />
            </Field>
          ) : null}
          {mode !== 'reset-confirm' ? (
            <Field label="Email" htmlFor={ids.email} error={fieldErrors.email}>
              <input
                id={ids.email}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="input"
                required
                maxLength={254}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={describedBy(ids.email, { error: fieldErrors.email })}
              />
            </Field>
          ) : null}
          {mode !== 'reset-request' ? (
            <Field
              label={mode === 'login' ? 'Password' : 'New password'}
              htmlFor={ids.password}
              error={fieldErrors.password}
              help={mode === 'login' ? undefined : 'At least 10 characters. A short phrase works well.'}
            >
              <div className="input-affix">
                <input
                  id={ids.password}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="input has-suffix"
                  required
                  maxLength={200}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={describedBy(ids.password, { error: fieldErrors.password, help: mode !== 'login' })}
                />
                <button
                  type="button"
                  className="affix affix-end btn-show"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-controls={ids.password}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>
          ) : null}
          {mode === 'login' ? (
            <div className="small">
              <Link href="/reset-password" className="link-quiet">
                Forgot your password?
              </Link>
            </div>
          ) : null}
          <SubmitButton pending={pending} pendingLabel={copy.pending} className="btn btn-primary btn-lg btn-block">
            {copy.submit}
          </SubmitButton>
        </form>
      )}

      <p className="small muted mt-6">
        {mode === 'login' ? (
          <>
            New to Vantaro?{' '}
            <Link className="text-link" href={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}>
              Create an account
            </Link>
          </>
        ) : mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <Link className="text-link" href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>
              Log in
            </Link>
          </>
        ) : (
          <Link className="text-link" href="/login">
            Back to log in
          </Link>
        )}
      </p>
      {mode === 'signup' ? (
        <p className="xs subtle mt-4">
          By creating an account you agree to the <Link className="text-link" href="/terms">terms</Link> and acknowledge the{' '}
          <Link className="text-link" href="/privacy">privacy policy</Link>.
        </p>
      ) : null}
    </div>
  );
}
