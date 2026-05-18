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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return errorResponse(401, 'Authentication required');
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await anonClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (!user) return errorResponse(401, 'Invalid or expired session');

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* body is optional */ }

  const origin = safeOrigin(body.origin as string | undefined);

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await adminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  const stripeCustomerId = profile?.stripe_customer_id;
  if (!stripeCustomerId) {
    return errorResponse(404, 'No Stripe customer found for this account');
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

  let portalSession: Stripe.BillingPortal.Session;
  try {
    portalSession = await stripe.billingPortal.sessions.create({
      customer:   stripeCustomerId,
      return_url: `${origin}/Settings`,
    });
  } catch (err) {
    console.error('Stripe portal session creation failed:', err);
    return errorResponse(500, 'Could not create portal session');
  }

  return new Response(JSON.stringify({ portalUrl: portalSession.url }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
