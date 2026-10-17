import { z } from 'zod';
import { config } from '@/config/site';
import { handle } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb, now } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { newId } from '@/lib/ids';
import { rateLimit } from '@/lib/security/rate-limit';
import { HttpError, ipHash, readJson } from '@/lib/security/request';

const body = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  topic: z.enum(['Product question', 'Account help', 'Billing', 'Privacy and data', 'Feedback', 'Something else']),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(200).optional(),
  elapsedMs: z.number().optional(),
});

export const POST = handle(async (req) => {
  const ip = ipHash(req);
  if (!rateLimit(`contact:${ip ?? 'unknown'}`, ip ? 5 : 30, 3600)) {
    throw new HttpError(429, 'rate_limited', 'Too many messages in a short time. Try again in an hour.');
  }
  const parsed = body.safeParse(await readJson(req, 16_000));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= 'Check this field.';
    throw new HttpError(422, 'invalid', 'Some fields need attention.', { fields });
  }
  const d = parsed.data;
  const reference = newId('msg', 8).toUpperCase().replace('MSG_', '');
  // Bots: honeypot filled or submitted implausibly fast. Answer as normal, store nothing.
  if ((d.website && d.website.trim()) || (d.elapsedMs !== undefined && d.elapsedMs < 1500)) {
    return Response.json({ ok: true, reference });
  }
  const user = await getCurrentUser();
  const id = `msg_${reference.toLowerCase()}`;
  let delivery: 'stored' | 'emailed' | 'email_failed' = 'stored';
  if (config.email.supportInbox) {
    const res = await sendEmail({
      to: config.email.supportInbox,
      subject: `[Vantaro contact] ${d.topic} (${reference})`,
      text: `From: ${d.name} <${d.email}>\nTopic: ${d.topic}\nReference: ${reference}\n\n${d.message}`,
      replyTo: d.email,
    });
    delivery = res.status === 'sent' ? 'emailed' : res.status === 'failed' ? 'email_failed' : 'stored';
  }
  getDb()
    .prepare('INSERT INTO support_requests (id, name, email, topic, message, user_id, delivery, ip_hash, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, d.name, d.email, d.topic, d.message, user?.id ?? null, delivery, ip, now());
  return Response.json({ ok: true, reference });
});
