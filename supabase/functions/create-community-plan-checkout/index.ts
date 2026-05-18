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

const ALLOWED_ORIGINS = new Set([
  'https://www.junited.us',
  'https://junited.us',
]);

function safeOrigin(raw: string | undefined): string {
  if (!raw) return 'https://junited.us';
  if (ALLOWED_ORIGINS.has(raw)) return raw;
  if (raw.startsWith('http://localhost:') || raw.startsWith('http://127.0.0.1:')) return raw;
  return 'https://junited.us';
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function getPriceId(interval: string): string | null {
  const key = `STRIPE_PRICE_COMMUNITY_PREMIUM_${interval.toUpperCase()}`;
  return Deno.env.get(key) ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return errorResponse(401, 'Authentication required');

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return errorResponse(401, 'Invalid or expired session');

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const { communityId, interval, origin: rawOrigin } = body as {
    communityId?: string;
    interval?: string;
    origin?: string;
  };

  if (!communityId) return errorResponse(400, 'communityId is required');
  if (!interval || !['monthly', 'annual'].includes(interval)) {
    return errorResponse(400, 'interval must be "monthly" or "annual"');
  }

  const priceId = getPriceId(interval);
  if (!priceId) {
    return errorResponse(500, `Premium Community price ID is not configured for ${interval}`);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, email, display_name, role, stripe_customer_id')
    .eq('id', user.id)
    .single();
  if (profileError || !profile) return errorResponse(404, 'Profile not found');

  const { data: community, error: communityError } = await adminClient
    .from('communities')
    .select('id, name, created_by_user_id')
    .eq('id', communityId)
    .single();
  if (communityError || !community) return errorResponse(404, 'Community not found');

  const { data: membership } = await adminClient
    .from('community_memberships')
    .select('role, status')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .maybeSingle();

  const role = String(membership?.role ?? '').toLowerCase();
  const status = String(membership?.status ?? '').toLowerCase();
  const canManageBilling = profile.role === 'admin'
    || community.created_by_user_id === user.id
    || (status === 'active' && ['owner', 'admin'].includes(role));

  if (!canManageBilling) {
    return errorResponse(403, 'Only community owners and admins can manage billing');
  }

  const { data: existingPlan } = await adminClient
    .from('community_plan_subscriptions')
    .select('id, status')
    .eq('community_id', communityId)
    .in('status', ['active', 'trialing', 'past_due', 'incomplete'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPlan) {
    return errorResponse(409, 'This community already has an active or pending Premium plan. Use billing management instead.');
  }

  const origin = safeOrigin(rawOrigin);
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

  let stripeCustomerId = profile.stripe_customer_id ?? '';
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: profile.email ?? user.email ?? undefined,
      name: profile.display_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = customer.id;
    await adminClient
      .from('profiles')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', user.id);
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/Communities?community=${communityId}&billing=success`,
      cancel_url: `${origin}/Communities?community=${communityId}&billing=cancel`,
      metadata: {
        checkout_type: 'community_plan',
        community_id: communityId,
        purchaser_user_id: user.id,
        plan_key: 'community_premium',
        interval,
      },
      subscription_data: {
        metadata: {
          checkout_type: 'community_plan',
          community_id: communityId,
          purchaser_user_id: user.id,
          plan_key: 'community_premium',
          interval,
        },
      },
    });
  } catch (err) {
    console.error('Community plan checkout creation failed:', err);
    return errorResponse(500, 'Could not create Premium checkout session');
  }

  return new Response(JSON.stringify({ checkoutUrl: session.url }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
