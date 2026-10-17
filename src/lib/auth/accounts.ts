import 'server-only';
import { z } from 'zod';
import { absoluteUrl, config } from '@/config/site';
import { getDb, now } from '@/lib/db';
import { newId, newToken, sha256 } from '@/lib/ids';
import { sendEmail } from '@/lib/email';
import { HttpError } from '@/lib/security/request';
import { hashPassword, passwordProblem, verifyPassword } from './password';
import { createWorkspace, revokeAllSessions } from './session';

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);

export async function registerUser(input: { email: string; password: string; name?: string }) {
  const email = emailSchema.parse(input.email);
  const problem = passwordProblem(input.password);
  if (problem) throw new HttpError(422, 'weak_password', problem, { field: 'password' });
  const db = getDb();
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) {
    // Generic enough not to leak much, specific enough to be useful.
    throw new HttpError(409, 'email_taken', 'An account with that email already exists. Log in instead, or reset your password.', {
      field: 'email',
    });
  }
  const hash = await hashPassword(input.password);
  const id = newId('usr');
  const ts = now();
  const name = input.name?.trim().slice(0, 80) || null;
  db.prepare('INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?,?,?,?,?,?)').run(id, email, name, hash, ts, ts);
  const workspaceId = createWorkspace(id, name ? `${name.split(' ')[0]}’s workspace` : 'My workspace');
  return { userId: id, workspaceId };
}

// A constant hash so failed lookups take as long as real verifications.
let dummyHash: Promise<string> | null = null;

export async function authenticate(emailRaw: string, password: string): Promise<string | null> {
  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success || !password) return null;
  const row = getDb().prepare('SELECT id, password_hash FROM users WHERE email=?').get(parsed.data) as
    | { id: string; password_hash: string }
    | undefined;
  if (!row) {
    dummyHash ??= hashPassword('not-a-real-password-0000');
    await verifyPassword(password, await dummyHash);
    return null;
  }
  return (await verifyPassword(password, row.password_hash)) ? row.id : null;
}

export async function requestPasswordReset(emailRaw: string): Promise<{ delivery: 'sent' | 'not_configured' | 'failed' | 'no_account' }> {
  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success) throw new HttpError(422, 'invalid_email', 'Enter a valid email address.', { field: 'email' });
  const db = getDb();
  const user = db.prepare('SELECT id, email FROM users WHERE email=?').get(parsed.data) as { id: string; email: string } | undefined;
  if (!user) return { delivery: 'no_account' };
  const token = newToken();
  const ts = now();
  db.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at, created_at) VALUES (?,?,?,?)').run(
    sha256(token),
    user.id,
    new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ts,
  );
  const link = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  const result = await sendEmail({
    to: user.email,
    subject: 'Reset your Vantaro password',
    text: `Someone asked to reset the password for this Vantaro account.\n\nSet a new password: ${link}\n\nThis link expires in one hour and can be used once. If you did not ask for this, you can ignore this email.`,
  });
  if (result.status === 'not_configured' && config.deployment !== 'production') {
    // Development only: there is no inbox, so the link goes to the server log.
    console.info(`[dev] password reset link for ${user.email}: ${link}`);
  }
  return { delivery: result.status };
}

export async function resetPassword(token: string, password: string): Promise<string> {
  const problem = passwordProblem(password);
  if (problem) throw new HttpError(422, 'weak_password', problem, { field: 'password' });
  const db = getDb();
  const row = db.prepare('SELECT user_id, expires_at, used_at FROM password_resets WHERE token_hash=?').get(sha256(token)) as
    | { user_id: string; expires_at: string; used_at: string | null }
    | undefined;
  if (!row || row.used_at || row.expires_at < now()) {
    throw new HttpError(400, 'invalid_token', 'This reset link is invalid or has expired. Request a new one.');
  }
  const hash = await hashPassword(password);
  db.transaction(() => {
    db.prepare('UPDATE users SET password_hash=?, updated_at=? WHERE id=?').run(hash, now(), row.user_id);
    db.prepare('UPDATE password_resets SET used_at=? WHERE token_hash=?').run(now(), sha256(token));
  })();
  revokeAllSessions(row.user_id);
  return row.user_id;
}
