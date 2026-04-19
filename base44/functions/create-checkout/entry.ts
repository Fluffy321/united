import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const WIX_API_KEY = Deno.env.get('WIX_PAYMENTS_API_KEY');
const WIX_SITE_ID = Deno.env.get('WIX_PAYMENTS_SITE_ID');

// Verified Community pricing matrix
const VERIFIED_PRICES = {
  small:  { monthly: 19, annual: 179 },
  medium: { monthly: 39, annual: 359 },
  large:  { monthly: 69, annual: 629 },
};

// Business listing premium pricing
const BUSINESS_PREMIUM_PRICE = { monthly: 29, annual: 269 };

// Support JUnited tiers
const SUPPORT_TIERS = {
  supporter: { monthly: 5,  annual: 50  },
  champion:  { monthly: 10, annual: 95  },
  patron:    { monthly: 18, annual: 170 },
};

Deno.serve(async (req) => {
  try {
    const origin = req.headers.get('origin') || 'https://united.community';
    const body = await req.json();
    const { checkoutType, billing = 'monthly', ...params } = body;

    let items = [];
    let thankYouUrl = `${origin}/ThankYou`;
    let postFlowUrl = `${origin}/`;
    let transactionMeta = {};

    // ── 1. Verified Community plan ─────────────────────────────────────────
    if (checkoutType === 'verified_community') {
      const { tier, communityId, communityName } = params;
      if (!tier || !communityId) {
        return Response.json({ error: 'Missing tier or communityId' }, { status: 400 });
      }
      const prices = VERIFIED_PRICES[tier];
      if (!prices) return Response.json({ error: 'Invalid tier' }, { status: 400 });
      const price = prices[billing];
      const periodLabel = billing === 'annual' ? 'year' : 'month';
      const freq = billing === 'annual' ? 'YEAR' : 'MONTH';

      items = [{
        name: `JUnited Verified Community — ${tier.charAt(0).toUpperCase() + tier.slice(1)} (${billing})`,
        quantity: 1,
        price: price.toFixed(2),
        subscriptionInfo: {
          subscriptionSettings: { frequency: freq },
          title: `Verified Community: ${communityName || communityId}`,
          description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} plan, billed ${billing}. Includes verified badge, analytics, and premium community tools.`,
        },
      }];

      thankYouUrl = `${origin}/ThankYou?type=verified_community&communityId=${communityId}&tier=${tier}&billing=${billing}`;
      postFlowUrl = `${origin}/communities/${communityId}`;
      transactionMeta = { type: 'verified_community', related_entity_id: communityId, related_entity_type: 'community' };
    }

    // ── 2. Business listing premium ────────────────────────────────────────
    else if (checkoutType === 'business_premium') {
      const { businessId, businessName } = params;
      if (!businessId) return Response.json({ error: 'Missing businessId' }, { status: 400 });
      const price = BUSINESS_PREMIUM_PRICE[billing];
      const freq = billing === 'annual' ? 'YEAR' : 'MONTH';

      items = [{
        name: `JUnited Business Premium — ${businessName || businessId} (${billing})`,
        quantity: 1,
        price: price.toFixed(2),
        subscriptionInfo: {
          subscriptionSettings: { frequency: freq },
          title: `Business Premium: ${businessName || businessId}`,
          description: 'Priority placement, photo gallery, menu link, and verified badge for your business.',
        },
      }];

      thankYouUrl = `${origin}/ThankYou?type=business_premium&businessId=${businessId}&billing=${billing}`;
      postFlowUrl = `${origin}/BusinessDirectory`;
      transactionMeta = { type: 'business_premium', related_entity_id: businessId, related_entity_type: 'business' };
    }

    // ── 3. Support JUnited subscription ───────────────────────────────────
    else if (checkoutType === 'support_junited') {
      const { tier } = params;
      if (!tier || !SUPPORT_TIERS[tier]) return Response.json({ error: 'Invalid support tier' }, { status: 400 });
      const price = SUPPORT_TIERS[tier][billing];
      const freq = billing === 'annual' ? 'YEAR' : 'MONTH';
      const tierLabels = { supporter: 'Supporter', champion: 'Champion', patron: 'Patron' };

      items = [{
        name: `Support JUnited — ${tierLabels[tier]} (${billing})`,
        quantity: 1,
        price: price.toFixed(2),
        subscriptionInfo: {
          subscriptionSettings: { frequency: freq },
          title: `JUnited ${tierLabels[tier]}`,
          description: 'Help keep JUnited free and community-first. No locked features — just your support.',
        },
      }];

      thankYouUrl = `${origin}/ThankYou?type=support_junited&tier=${tier}`;
      postFlowUrl = `${origin}/`;
      transactionMeta = { type: 'support_junited' };
    }

    // ── unknown type ───────────────────────────────────────────────────────
    else {
      return Response.json({ error: 'Unknown checkoutType' }, { status: 400 });
    }

    console.log('Creating checkout:', checkoutType, items[0]?.name);

    const response = await fetch(
      'https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct',
      {
        method: 'POST',
        headers: {
          'Authorization': WIX_API_KEY,
          'wix-site-id': WIX_SITE_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: { items },
          callbackUrls: { postFlowUrl, thankYouPageUrl: thankYouUrl },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Wix API error:', JSON.stringify(data));
      return Response.json({ error: 'Checkout creation failed', details: data }, { status: 500 });
    }

    console.log('Checkout session created:', data.checkoutSession?.id);

    // Record pending transaction if user is logged in
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me().catch(() => null);
      if (user) {
        await base44.asServiceRole.entities.Transaction.create({
          user_id: user.id,
          order_id: data.checkoutSession.id,
          amount: parseFloat(items[0].price),
          type: transactionMeta.type,
          description: items[0].name,
          status: 'pending',
          related_entity_id: transactionMeta.related_entity_id || null,
          related_entity_type: transactionMeta.related_entity_type || null,
          email: user.email,
        });
      }
    } catch (e) {
      console.log('Transaction record skipped:', e.message);
    }

    return Response.json({
      checkoutUrl: data.checkoutSession.redirectUrl,
      sessionId: data.checkoutSession.id,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});