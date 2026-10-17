import { createHmac } from 'node:crypto';
import { config } from '@/config/site';
import { getDb, now } from '@/lib/db';
import { newId } from '@/lib/ids';

/**
 * First-party product events. Only whitelisted, non-content properties are
 * stored: never prompts, business descriptions, outputs, or email addresses.
 */
export const EVENTS = [
  'tool_viewed',
  'generation_started',
  'generation_succeeded',
  'generation_failed',
  'result_saved',
  'signup_completed',
  'strategy_completed',
  'checkout_initiated',
  'purchase_confirmed',
  'return_usage',
] as const;
export type EventName = (typeof EVENTS)[number];

const ALLOWED_PROPS = new Set(['kind', 'tool', 'mode', 'code', 'plan', 'livemode', 'source']);

export function track(name: EventName, props: Record<string, string | number | boolean | null | undefined> = {}, subjectHash?: string) {
  try {
    const clean: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(props)) {
      if (ALLOWED_PROPS.has(k) && v !== undefined && v !== null) clean[k] = typeof v === 'string' ? v.slice(0, 64) : v;
    }
    getDb()
      .prepare('INSERT INTO analytics_events (id, name, props, subject, is_test, created_at) VALUES (?,?,?,?,?,?)')
      .run(newId('evt'), name, JSON.stringify(clean), subjectHash ?? null, config.deployment === 'production' ? 0 : 1, now());
  } catch {
    // Analytics must never break the product.
  }
}

/** Keyed hash so events can be grouped per person without storing who they are. */
export function subjectFor(userId: string): string {
  return createHmac('sha256', config.security.appSecret).update(`user:${userId}`).digest('hex').slice(0, 32);
}

/**
 * Count a signed-in person coming back on a later day than they signed up.
 * At most one event per person per UTC day.
 */
export function trackReturnUsage(user: { id: string; created_at: string }) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (user.created_at.slice(0, 10) >= today) return;
    const subject = subjectFor(user.id);
    const seen = getDb()
      .prepare(`SELECT 1 FROM analytics_events WHERE name='return_usage' AND subject=? AND created_at >= ? LIMIT 1`)
      .get(subject, `${today}T00:00:00.000Z`);
    if (!seen) track('return_usage', {}, subject);
  } catch {
    // never break the page
  }
}

/** Events a browser may report. Everything else is recorded server-side only. */
export const CLIENT_EVENTS = new Set<EventName>(['tool_viewed']);
