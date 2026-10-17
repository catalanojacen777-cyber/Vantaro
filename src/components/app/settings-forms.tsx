'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/client-api';
import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icons';
import { toast } from '@/components/ui/toast';

function Section({ id, title, description, children }: { id?: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="panel panel-pad settings-section" aria-labelledby={`${id ?? title}-h`}>
      <div>
        <h2 id={`${id ?? title}-h`} style={{ fontSize: '1.1rem' }}>{title}</h2>
        {description ? <p className="small muted mt-1">{description}</p> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function ProfileForm({ name, email }: { name: string | null; email: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name ?? '');
  const [pending, setPending] = useState(false);
  return (
    <Section title="Profile" description="Your name appears in your workspace. Your email is used to log in.">
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          try {
            await api('/api/account', { method: 'PATCH', body: { name: value } });
            toast('Profile saved');
            router.refresh();
          } catch (err) {
            toast((err as Error).message, 'error');
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="field"><span className="field-label">Name</span><input className="input" value={value} onChange={(e) => setValue(e.target.value)} maxLength={80} autoComplete="name" /></label>
        <label className="field"><span className="field-label">Email</span><input className="input" value={email} disabled readOnly /></label>
        <div><button className="btn btn-primary" disabled={pending}>Save profile</button></div>
      </form>
    </Section>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  return (
    <Section title="Password" description="Changing your password signs you out on other devices.">
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setErrors({});
          if (next.length < 10) return setErrors({ next: 'Use at least 10 characters.' });
          setPending(true);
          try {
            await api('/api/account/password', { body: { current, next } });
            setCurrent('');
            setNext('');
            toast('Password changed');
          } catch (err) {
            if (err instanceof ApiError && typeof err.data.field === 'string') setErrors({ [err.data.field]: err.message });
            else toast((err as Error).message, 'error');
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="field">
          <span className="field-label">Current password</span>
          <input className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} aria-invalid={!!errors.current} />
          {errors.current ? <span className="field-error" role="alert">{errors.current}</span> : null}
        </label>
        <label className="field">
          <span className="field-label">New password</span>
          <input className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-invalid={!!errors.next} />
          {errors.next ? <span className="field-error" role="alert">{errors.next}</span> : null}
        </label>
        <div><button className="btn btn-primary" disabled={pending || !current || !next}>Change password</button></div>
      </form>
    </Section>
  );
}

export function WorkspacesForm({ workspaces, currentId, limit }: { workspaces: { id: string; name: string; role: string }[]; currentId: string; limit: number }) {
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [names, setNames] = useState(Object.fromEntries(workspaces.map((w) => [w.id, w.name])));
  const owned = workspaces.filter((w) => w.role === 'owner').length;
  return (
    <Section id="workspaces" title="Workspaces" description={`Keep separate businesses or clients apart. Your plan includes ${limit} owned ${limit === 1 ? 'workspace' : 'workspaces'}.`}>
      <ul className="stack" style={{ listStyle: 'none', padding: 0, '--stack': '10px' } as React.CSSProperties}>
        {workspaces.map((w) => (
          <li key={w.id} className="cluster" style={{ flexWrap: 'nowrap' }}>
            <label className="sr-only" htmlFor={`ws-${w.id}`}>Name of {w.name}</label>
            <input id={`ws-${w.id}`} className="input" value={names[w.id]} onChange={(e) => setNames({ ...names, [w.id]: e.target.value })} disabled={w.role !== 'owner'} maxLength={80} />
            {w.id === currentId ? <span className="tag tag-ice">Current</span> : null}
            {w.role === 'owner' && names[w.id] !== w.name ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  try {
                    await api(`/api/workspaces/${w.id}`, { method: 'PATCH', body: { name: names[w.id] } });
                    toast('Workspace renamed');
                    router.refresh();
                  } catch (err) {
                    toast((err as Error).message, 'error');
                  }
                }}
              >
                Save
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <form
        className="cluster mt-5"
        style={{ flexWrap: 'nowrap' }}
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api('/api/workspaces', { body: { name: newName } });
            toast('Workspace created and selected');
            setNewName('');
            router.push('/app');
            router.refresh();
          } catch (err) {
            toast((err as Error).message, 'error');
          }
        }}
      >
        <label className="sr-only" htmlFor="ws-new">New workspace name</label>
        <input id="ws-new" className="input" placeholder="New workspace name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} disabled={owned >= limit} />
        <button className="btn btn-secondary" disabled={!newName.trim() || owned >= limit}><Icon.Plus /> Create</button>
      </form>
      {owned >= limit ? <p className="xs subtle mt-2">You have reached your plan’s workspace limit.</p> : null}
    </Section>
  );
}

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <Section title="Delete account" description="Permanently deletes your account and every workspace you own, including strategies, saved outputs, tasks and share links.">
      <button className="btn btn-danger" onClick={() => setOpen(true)}><Icon.Trash /> Delete my account</button>
      {open ? (
        <Dialog title="Delete your account?" description="This cannot be undone. Export anything you want to keep first." onClose={() => setOpen(false)}>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);
              setError(null);
              try {
                await api('/api/account', { method: 'DELETE', body: { password } });
                window.location.href = '/';
              } catch (err) {
                setError((err as Error).message);
                setPending(false);
              }
            }}
          >
            <label className="field">
              <span className="field-label">Enter your password to confirm</span>
              <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {error ? <span className="field-error" role="alert">{error}</span> : null}
            </label>
            <div className="cluster" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Keep my account</button>
              <button className="btn btn-danger" disabled={!password || pending}>Delete permanently</button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </Section>
  );
}
