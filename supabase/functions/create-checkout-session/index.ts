import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Server-authoritative tier amounts — client never controls the price for named tiers
const SUPPORT_TIERS: Record<string, { amount_cents: number; label: string }> = {
  supporter: { amount_cents: 5000,  label: 'JUnited Supporter – Thank You' },   // $50
  champion:  { amount_cents: 9500,  label: 'JUnited Community Champion' },       // $95
  patron:    { amount_cents: 17000, label: 'JUnited Patron' },                   // $170
};

const MIN_DONATION_CENTS = 100;     // $1 minimum
const MAX_DONATION_CENTS = 1000000; // $10,000 maximum

const ALLOWED_ORIGINS = new Set([
  'https://www.junited.us',
  'https://junited.us',
]);

function safeOrigin(raw: string | undefined): string {
  if (!raw) return 'https://www.junited.us';
  if (ALLOWED_ORIGINS.has(raw)) return raw;
  // Allow localhost only during development
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

  // Resolve authenticated user from Bearer token if present
  let userId: string | null = null;
  const authHeader = req.headers.get('authorization') ?? '';
  if (authHeader.startsWith('Bearer ')) {
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user } } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    userId = user?.id ?? null;
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const { checkoutType, tier, amount: rawAmount, purpose: rawPurpose, origin: rawOrigin } = body as {
    checkoutType?: string;
    tier?: string;
    amount?: number;
    purpose?: string;
    origin?: string;
  };

  const origin = safeOrigin(rawOrigin);

  let amountCents: number;
  let lineItemName: string;
  let resolvedPurpose: string;

  if (checkoutType === 'support_junited' && tier) {
    // Named tier: server owns the amount, client cannot override it
    const tierConfig = SUPPORT_TIERS[tier];
    if (!tierConfig) return errorResponse(400, 'Invalid support tier');

    amountCents = tierConfig.amount_cents;
    lineItemName = tierConfig.label;
    resolvedPurpose = `support_junited_${tier}`;

  } else if (checkoutType === 'donation' && rawAmount != null) {
    // Free-amount donation: validate server-side
    amountCents = Math.round(Number(rawAmount) * 100);
    if (!Number.isFinite(amountCents) || amountCents < MIN_DONATION_CENTS || amountCents > MAX_DONATION_CENTS) {
      return errorResponse(400, 'Donation amount must be between $1 and $10,000');
    }
    lineItemName = typeof rawPurpose === 'string' && rawPurpose.trim()
      ? rawPurpose.trim()
      : 'Donation to JUnited';
    resolvedPurpose = 'donation';

  } else {
    return errorResponse(400, 'checkoutType must be "support_junited" (with tier) or "donation" (with amount)');
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: lineItemName,
            description: 'JUnited — Jewish community platform',
          },
        },
        quantity: 1,
      }],
      success_url: `${origin}/ThankYou?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/SupportJUnited`,
      metadata: {
        user_id: userId ?? '',
        purpose: resolvedPurpose,
        tier: typeof tier === 'string' ? tier : '',
      },
    });
  } catch (err) {
    console.error('Stripe session creation failed:', err);
    return errorResponse(500, 'Could not create checkout session');
  }

  // Insert pending transaction row — use service role so RLS doesn't block
  const { error: dbError } = await adminClient.from('transactions').insert({
    user_id: userId,
    amount: amountCents,
    currency: 'usd',
    stripe_session_id: session.id,
    purpose: resolvedPurpose,
    tier: typeof tier === 'string' ? tier : null,
    status: 'pending',
  });

  if (dbError) {
    // Log but don't block — webhook can reconcile later
    console.error('Transaction insert error:', dbError.message);
  }

  return new Response(JSON.stringify({ checkoutUrl: session.url }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
