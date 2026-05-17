import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const STRIPE_SECRET_KEY     = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe     = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  // Read raw body as text — must not parse JSON before constructing the event,
  // or Stripe signature verification will fail.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return new Response(`Webhook signature error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await setTransactionStatus(session.id, 'canceled');
        break;
      }

      // payment_intent.payment_failed can fire for declined cards even before
      // the session is explicitly failed; handle it defensively.
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.id) {
          await adminClient
            .from('transactions')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('stripe_payment_intent_id', pi.id)
            .eq('status', 'pending');
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Handler error for ${event.type}:`, (err as Error).message);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { error } = await adminClient
    .from('transactions')
    .update({
      status: 'completed',
      stripe_payment_intent_id: (session.payment_intent as string) ?? null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending'); // idempotency: only update once

  if (error) {
    console.error('Failed to mark transaction completed:', error.message);
    throw error;
  }

  console.log(`Transaction completed: session=${session.id} amount=${session.amount_total}`);
}

async function setTransactionStatus(sessionId: string, status: string) {
  const { error } = await adminClient
    .from('transactions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('stripe_session_id', sessionId)
    .eq('status', 'pending');

  if (error) {
    console.error(`Failed to set status ${status}:`, error.message);
    throw error;
  }
}
