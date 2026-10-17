import { config } from '@/config/site';
import { handleStripeEvent, verifyStripeSignature } from '@/lib/billing';

/** Stripe webhooks: signature-verified, idempotent, cross-origin by design. */
export async function POST(req: Request) {
  const secret = config.billing.stripeWebhookSecret;
  if (!secret) return Response.json({ error: 'not_configured' }, { status: 503 });
  const payload = await req.text();
  if (payload.length > 512_000) return Response.json({ error: 'too_large' }, { status: 413 });
  if (!verifyStripeSignature(payload, req.headers.get('stripe-signature'), secret)) {
    return Response.json({ error: 'invalid_signature' }, { status: 400 });
  }
  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 });
  }
  if (!event?.id || !event?.type || !event?.data?.object) return Response.json({ error: 'bad_event' }, { status: 400 });
  try {
    const applied = handleStripeEvent(event);
    return Response.json({ received: true, duplicate: !applied });
  } catch (err) {
    console.error('[billing] webhook processing failed', err instanceof Error ? err.message : '');
    // A 500 makes Stripe retry later; processing is idempotent.
    return Response.json({ error: 'processing_failed' }, { status: 500 });
  }
}
