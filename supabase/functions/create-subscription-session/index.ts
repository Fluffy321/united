import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Server-authoritative tier labels
const TIER_LABELS: Record<string, string> = {
  supporter: 'JUnited Supporter',
  builder:   'JUnited Community Builder',
  champion:  'JUnited Champion',
};

const ALLOWED_ORIGINS = new Set([
  'https://www.junited.us',
  'https://junited.us',
]);

function safeOrigin(raw: string | undefined): string {
  if (!raw) return 'https://www.junited.us';
  if (ALLOWED_ORIGINS.has(raw)) return raw;
  if (raw.startsWith('http://localhost:') || raw.startsWith('http://127.0.0.1:')) return raw;
  return 'https://www.junited.us';
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function getPriceId(tier: string, interval: string): string | null {
  const key = `STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()}`;
  return Deno.env.get(key) ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  // Subscriptions require an authenticated user
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return errorResponse(401, 'Authentication required');
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await anonClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (!user) return errorResponse(401, 'Invalid or expired session');

  const userId = user.id;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const { tier, interval, origin: rawOrigin } = body as {
    tier?: string;
    interval?: string;
    origin?: string;
  };

  if (!tier || !(tier in TIER_LABELS)) {
    return errorResponse(400, 'tier must be "supporter", "builder", or "champion"');
  }
  if (!interval || !['monthly', 'annual'].includes(interval)) {
    return errorResponse(400, 'interval must be "monthly" or "annual"');
  }

  const priceId = getPriceId(tier, interval);
  if (!priceId) {
    return errorResponse(500, `Price ID not configured for ${tier}/${interval}`);
  }

  const origin = safeOrigin(rawOrigin);
  const stripe     = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Retrieve or create Stripe Customer for this user
  const { data: profile } = await adminClient
    .from('profiles')
    .select('stripe_customer_id, email, display_name')
    .eq('id', userId)
    .single();

  let stripeCustomerId: string = profile?.stripe_customer_id ?? '';

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      name:  profile?.display_name ?? undefined,
      metadata: { supabase_user_id: userId },
    });
    stripeCustomerId = customer.id;

    await adminClient
      .from('profiles')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', userId);
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/ThankYou?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/SupportJUnited`,
      metadata: {
        user_id:       userId,
        tier,
        interval,
        checkout_type: 'subscription',
      },
      subscription_data: {
        metadata: { user_id: userId, tier, interval },
      },
    });
  } catch (err) {
    console.error('Stripe subscription session creation failed:', err);
    return errorResponse(500, 'Could not create subscription checkout session');
  }

  return new Response(JSON.stringify({ checkoutUrl: session.url }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
