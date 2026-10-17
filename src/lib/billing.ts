import crypto from 'node:crypto';
import { absoluteUrl, billingState, config } from '@/config/site';
import { getDb, now } from '@/lib/db';
import { newId } from '@/lib/ids';
import { HttpError } from '@/lib/security/request';
import { track } from '@/lib/analytics';

/**
 * Stripe Checkout over its REST API (no SDK dependency). Purchase status is
 * only ever changed by verified webhooks, never by the success redirect.
 */

function form(data: Record<string, string | number>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

export async function createCheckout(user: { id: string; email: string }): Promise<{ url: string; purchaseId: string }> {
  const state = billingState();
  if (!state.ready) throw new HttpError(503, 'billing_unconfigured', 'Paid access is not available yet.');
  const db = getDb();
  if (db.prepare(`SELECT 1 FROM entitlements WHERE user_id=? AND revoked_at IS NULL`).get(user.id)) {
    throw new HttpError(409, 'already_paid', 'Your account already has paid access.');
  }
  const purchaseId = newId('pur');
  const ts = now();
  db.prepare(
    `INSERT INTO purchases (id, user_id, provider, status, amount, currency, livemode, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(purchaseId, user.id, 'stripe', 'pending', config.billing.priceAmount, config.billing.priceCurrency, state.testMode ? 0 : 1, ts, ts);

  const res = await fetch(`${config.billing.stripeApiBase}/v1/checkout/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.billing.stripeSecretKey}`,
      'content-type': 'application/x-www-form-urlencoded',
      'idempotency-key': purchaseId,
    },
    body: form({
      mode: 'payment',
      'line_items[0][quantity]': 1,
      'line_items[0][price_data][currency]': config.billing.priceCurrency!,
      'line_items[0][price_data][unit_amount]': config.billing.priceAmount!,
      'line_items[0][price_data][product_data][name]': config.billing.planName,
      client_reference_id: user.id,
      customer_email: user.email,
      'metadata[purchase_id]': purchaseId,
      'metadata[user_id]': user.id,
      'payment_intent_data[metadata][purchase_id]': purchaseId,
      success_url: `${absoluteUrl('/app/billing')}?checkout=success`,
      cancel_url: `${absoluteUrl('/app/billing')}?checkout=cancelled`,
    }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  if (!res || !res.ok) {
    db.prepare(`UPDATE purchases SET status='failed', updated_at=? WHERE id=?`).run(now(), purchaseId);
    console.error(`[billing] checkout creation failed status=${res?.status ?? 'network'}`);
    throw new HttpError(502, 'checkout_failed', 'Checkout could not be started. Nothing was charged; try again shortly.');
  }
  const session = (await res.json()) as { id: string; url: string };
  db.prepare('UPDATE purchases SET checkout_session_id=?, updated_at=? WHERE id=?').run(session.id, now(), purchaseId);
  track('checkout_initiated');
  return { url: session.url, purchaseId };
}

/** Verify a Stripe-Signature header (v1 HMAC-SHA256 over "timestamp.payload"). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSeconds = 300, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!header) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !sigs.length || !/^\d+$/.test(t)) return false;
  if (Math.abs(nowSeconds - Number(t)) > toleranceSeconds) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

type StripeEvent = { id: string; type: string; livemode: boolean; data: { object: Record<string, unknown> } };

function grant(purchaseId: string, livemode: boolean) {
  const db = getDb();
  const p = db.prepare('SELECT id, user_id FROM purchases WHERE id=?').get(purchaseId) as { id: string; user_id: string } | undefined;
  if (!p) return;
  const existing = db.prepare('SELECT id FROM entitlements WHERE purchase_id=?').get(purchaseId) as { id: string } | undefined;
  if (existing) {
    db.prepare('UPDATE entitlements SET revoked_at=NULL, revoke_reason=NULL WHERE id=?').run(existing.id);
  } else {
    db.prepare('INSERT INTO entitlements (id, user_id, plan, purchase_id, livemode, granted_at) VALUES (?,?,?,?,?,?)').run(newId('ent'), p.user_id, 'paid', purchaseId, livemode ? 1 : 0, now());
  }
}

function revoke(purchaseId: string, reason: string) {
  getDb().prepare('UPDATE entitlements SET revoked_at=?, revoke_reason=? WHERE purchase_id=? AND revoked_at IS NULL').run(now(), reason, purchaseId);
}

function purchaseByPaymentIntent(pi: unknown): string | null {
  if (typeof pi !== 'string') return null;
  const row = getDb().prepare('SELECT id FROM purchases WHERE payment_intent_id=?').get(pi) as { id: string } | undefined;
  return row?.id ?? null;
}

/**
 * Apply a verified event exactly once. Returns false if it was already
 * processed (Stripe retries deliveries).
 */
export function handleStripeEvent(event: StripeEvent): boolean {
  const db = getDb();
  return db.transaction(() => {
    const seen = db.prepare('SELECT processed_at FROM webhook_events WHERE id=?').get(event.id) as { processed_at: string | null } | undefined;
    if (seen?.processed_at) return false;
    db.prepare('INSERT OR IGNORE INTO webhook_events (id, provider, type, received_at) VALUES (?,?,?,?)').run(event.id, 'stripe', event.type, now());
    const obj = event.data.object;
    const meta = (obj.metadata ?? {}) as Record<string, string>;
    const ts = now();
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const purchaseId = meta.purchase_id;
        if (!purchaseId) break;
        const paid = obj.payment_status === 'paid' || event.type === 'checkout.session.async_payment_succeeded';
        db.prepare('UPDATE purchases SET payment_intent_id=COALESCE(?, payment_intent_id), status=?, livemode=?, amount=COALESCE(?, amount), currency=COALESCE(?, currency), updated_at=? WHERE id=?').run(
          typeof obj.payment_intent === 'string' ? obj.payment_intent : null,
          paid ? 'paid' : 'pending',
          event.livemode ? 1 : 0,
          typeof obj.amount_total === 'number' ? obj.amount_total : null,
          typeof obj.currency === 'string' ? obj.currency : null,
          ts,
          purchaseId,
        );
        if (paid) {
          grant(purchaseId, event.livemode);
          track('purchase_confirmed', { livemode: event.livemode });
        }
        break;
      }
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        if (meta.purchase_id) db.prepare(`UPDATE purchases SET status=?, updated_at=? WHERE id=? AND status='pending'`).run(event.type.endsWith('expired') ? 'expired' : 'failed', ts, meta.purchase_id);
        break;
      }
      case 'charge.refunded': {
        const purchaseId = purchaseByPaymentIntent(obj.payment_intent) ?? meta.purchase_id;
        if (!purchaseId) break;
        // Partial refunds keep access; a full refund removes it.
        if (obj.refunded === true) {
          db.prepare(`UPDATE purchases SET status='refunded', updated_at=? WHERE id=?`).run(ts, purchaseId);
          revoke(purchaseId, 'refunded');
        }
        break;
      }
      case 'charge.dispute.created': {
        const purchaseId = purchaseByPaymentIntent(obj.payment_intent);
        if (!purchaseId) break;
        db.prepare(`UPDATE purchases SET status='disputed', updated_at=? WHERE id=?`).run(ts, purchaseId);
        revoke(purchaseId, 'disputed');
        break;
      }
      case 'charge.dispute.closed': {
        const purchaseId = purchaseByPaymentIntent(obj.payment_intent);
        if (!purchaseId) break;
        if (obj.status === 'won') {
          db.prepare(`UPDATE purchases SET status='paid', updated_at=? WHERE id=?`).run(ts, purchaseId);
          grant(purchaseId, event.livemode);
        }
        break;
      }
      default:
        break;
    }
    db.prepare('UPDATE webhook_events SET processed_at=? WHERE id=?').run(ts, event.id);
    return true;
  })();
}

export function billingSummary(userId: string) {
  const db = getDb();
  const entitlement = db
    .prepare('SELECT id, livemode, granted_at, revoked_at, revoke_reason FROM entitlements WHERE user_id=? ORDER BY granted_at DESC LIMIT 1')
    .get(userId) as { id: string; livemode: number; granted_at: string; revoked_at: string | null; revoke_reason: string | null } | undefined;
  const purchases = db
    .prepare('SELECT id, status, amount, currency, livemode, created_at FROM purchases WHERE user_id=? ORDER BY created_at DESC LIMIT 20')
    .all(userId) as { id: string; status: string; amount: number | null; currency: string | null; livemode: number; created_at: string }[];
  return { entitlement: entitlement ?? null, purchases };
}
