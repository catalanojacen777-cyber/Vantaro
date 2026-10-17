import { config, emailReady } from '@/config/site';

export type EmailResult = { status: 'sent' } | { status: 'not_configured' } | { status: 'failed' };

/**
 * Send a transactional email through Resend's REST API. When email is not
 * configured we say so; callers must not tell people an email was sent.
 */
export async function sendEmail(msg: { to: string; subject: string; text: string; replyTo?: string }): Promise<EmailResult> {
  if (!emailReady()) return { status: 'not_configured' };
  try {
    const res = await fetch(`${config.email.resendApiBase}/emails`, {
      method: 'POST',
      headers: { authorization: `Bearer ${config.email.resendApiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: config.email.from,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[email] provider responded ${res.status}`);
      return { status: 'failed' };
    }
    return { status: 'sent' };
  } catch {
    console.error('[email] provider unreachable');
    return { status: 'failed' };
  }
}
