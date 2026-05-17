import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const STRIPE_SECRET_KEY     = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe      = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
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
        if (session.mode === 'subscription') {
          await handleSubscriptionCheckoutCompleted(session);
        } else {
          await handleOneTimeCheckoutCompleted(session);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') {
          await setTransactionStatus(session.id, 'canceled');
        }
        break;
      }

      // payment_intent.payment_failed can fire for declined cards before
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

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await adminClient
            .from('subscriptions')
            .update({
              status:               'active',
              stripe_status:        sub.status,
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end,
              updated_at:           new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subId);
          console.log(`invoice.paid: subscription ${subId} marked active`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        if (subId) {
          await adminClient
            .from('subscriptions')
            .update({
              status:     'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subId);
          console.log(`invoice.payment_failed: subscription ${subId} marked past_due`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await adminClient
          .from('subscriptions')
          .update({
            status:               mapStripeStatus(sub.status),
            stripe_status:        sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at:          sub.canceled_at
                                    ? new Date(sub.canceled_at * 1000).toISOString()
                                    : null,
            updated_at:           new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        console.log(`customer.subscription.updated: ${sub.id} → ${sub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await adminClient
          .from('subscriptions')
          .update({
            status:       'canceled',
            stripe_status: sub.status,
            canceled_at:   new Date().toISOString(),
            updated_at:    new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        console.log(`customer.subscription.deleted: ${sub.id} canceled`);
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

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':             return 'active';
    case 'trialing':           return 'trialing';
    case 'past_due':           return 'past_due';
    case 'canceled':           return 'canceled';
    case 'incomplete_expired': return 'canceled';
    case 'incomplete':         return 'incomplete';
    case 'unpaid':             return 'past_due';
    default:                   return 'incomplete';
  }
}

async function handleSubscriptionCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId    = session.metadata?.user_id;
  const tier      = session.metadata?.tier;
  const interval  = session.metadata?.interval;
  const stripeSubId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;
  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id;

  if (!userId || !tier || !interval || !stripeSubId || !stripeCustomerId) {
    console.error('Missing metadata in subscription checkout session', session.id);
    return;
  }

  // Fetch full subscription to get billing period dates
  const sub = await stripe.subscriptions.retrieve(stripeSubId);

  const { error } = await adminClient.from('subscriptions').upsert({
    user_id:                userId,
    stripe_subscription_id: stripeSubId,
    stripe_customer_id:     stripeCustomerId,
    tier,
    interval,
    status:               mapStripeStatus(sub.status),
    stripe_status:        sub.status,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
  }, { onConflict: 'stripe_subscription_id' });

  if (error) {
    console.error('Failed to upsert subscription:', error.message);
    throw error;
  }

  // Ensure stripe_customer_id is stored on profiles (may already be set)
  await adminClient
    .from('profiles')
    .update({ stripe_customer_id: stripeCustomerId })
    .eq('id', userId);

  console.log(`Subscription upserted: ${stripeSubId} tier=${tier}/${interval} user=${userId}`);
}

async function handleOneTimeCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { error } = await adminClient
    .from('transactions')
    .update({
      status:                  'completed',
      stripe_payment_intent_id: (session.payment_intent as string) ?? null,
      completed_at:             new Date().toISOString(),
      updated_at:               new Date().toISOString(),
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
