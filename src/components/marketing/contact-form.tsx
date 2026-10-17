'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/client-api';
import { describedBy, Field, SubmitButton } from '@/components/ui/form';
import { Icon } from '@/components/ui/icons';

const TOPICS = ['Product question', 'Account help', 'Billing', 'Privacy and data', 'Feedback', 'Something else'];

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; email: string } | null>(null);
  const [startedAt] = useState(() => Date.now());

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      topic: String(fd.get('topic') ?? ''),
      message: String(fd.get('message') ?? ''),
      website: String(fd.get('website') ?? ''),
      elapsedMs: Date.now() - startedAt,
    };
    const errs: Record<string, string> = {};
    if (!body.name.trim()) errs.name = 'Tell us your name.';
    if (!/^\S+@\S+\.\S+$/.test(body.email.trim())) errs.email = 'Enter a valid email address so we can reply.';
    if (body.message.trim().length < 10) errs.message = 'Add a little more detail (at least 10 characters).';
    setErrors(errs);
    setError(null);
    if (Object.keys(errs).length) return;
    setPending(true);
    try {
      const res = await api<{ reference: string }>('/api/contact', { body });
      setDone({ reference: res.reference, email: body.email });
    } catch (err) {
      if (err instanceof ApiError && err.data.fields) setErrors(err.data.fields as Record<string, string>);
      else setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="panel panel-pad stack" role="status">
        <h2 style={{ fontSize: '1.3rem' }}>Message received</h2>
        <p className="muted">We have your message (reference {done.reference}) and will reply to {done.email}.</p>
      </div>
    );
  }

  return (
    <form className="panel panel-pad stack" style={{ '--stack': '18px' } as React.CSSProperties} onSubmit={submit} noValidate>
      {error ? <div className="notice notice-danger" role="alert"><Icon.Warning /><span>{error}</span></div> : null}
      <Field label="Name" htmlFor="c-name" error={errors.name}>
        <input id="c-name" name="name" className="input" autoComplete="name" maxLength={100} aria-invalid={!!errors.name} aria-describedby={describedBy('c-name', { error: errors.name })} />
      </Field>
      <Field label="Email" htmlFor="c-email" error={errors.email}>
        <input id="c-email" name="email" type="email" inputMode="email" className="input" autoComplete="email" maxLength={254} aria-invalid={!!errors.email} aria-describedby={describedBy('c-email', { error: errors.email })} />
      </Field>
      <Field label="Topic" htmlFor="c-topic">
        <select id="c-topic" name="topic" className="select">
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Message" htmlFor="c-message" error={errors.message}>
        <textarea id="c-message" name="message" className="textarea" rows={6} maxLength={4000} aria-invalid={!!errors.message} aria-describedby={describedBy('c-message', { error: errors.message })} />
      </Field>
      {/* Honeypot: hidden from people, often filled by bots. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton pending={pending} pendingLabel="Sending" className="btn btn-primary btn-lg">Send message</SubmitButton>
    </form>
  );
}
