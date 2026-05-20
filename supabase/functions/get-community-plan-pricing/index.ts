import Stripe from 'npm:stripe@14';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'GET') return errorResponse(405, 'Method not allowed');

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) return errorResponse(500, 'Stripe is not configured');

  const monthlyPriceId = Deno.env.get('STRIPE_PRICE_COMMUNITY_PREMIUM_MONTHLY');
  const annualPriceId  = Deno.env.get('STRIPE_PRICE_COMMUNITY_PREMIUM_ANNUAL');

  if (!monthlyPriceId || !annualPriceId) {
    return errorResponse(500, 'Community Premium price IDs are not configured');
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

  let monthlyPrice: Stripe.Price;
  let annualPrice: Stripe.Price;

  try {
    [monthlyPrice, annualPrice] = await Promise.all([
      stripe.prices.retrieve(monthlyPriceId),
      stripe.prices.retrieve(annualPriceId),
    ]);
  } catch (err) {
    console.error('Failed to retrieve Stripe prices:', err);
    return errorResponse(502, 'Could not fetch pricing from Stripe');
  }

  const payload = {
    monthly: {
      amount: monthlyPrice.unit_amount,
      currency: monthlyPrice.currency,
    },
    annual: {
      amount: annualPrice.unit_amount,
      currency: annualPrice.currency,
    },
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
