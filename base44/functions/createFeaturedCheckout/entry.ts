import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FEATURED_PRICING = {
  '1': { price: 2900, label: '1 month' },
  '3': { price: 7900, label: '3 months' },
  '6': { price: 14900, label: '6 months' },
  '12': { price: 27900, label: '12 months' },
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { community_id, duration_months, slot_type } = body;

    if (!community_id || !duration_months || !slot_type) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['hero', 'secondary'].includes(slot_type)) {
      return Response.json({ error: 'Invalid slot_type' }, { status: 400 });
    }

    if (!FEATURED_PRICING[String(duration_months)]) {
      return Response.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const origin = req.headers.get('Origin') || 'http://localhost:5173';
    const price = FEATURED_PRICING[String(duration_months)].price;

    // Validate community exists and is eligible
    const communities = await base44.entities.Community.filter({ id: community_id });
    if (!communities?.length) {
      return Response.json({ error: 'Community not found' }, { status: 404 });
    }

    const community = communities[0];
    if (!community.is_eligible_for_featured) {
      return Response.json({ error: 'Community not eligible for featured status' }, { status: 403 });
    }

    // Check featured slot availability
    const activeSlots = await base44.entities.FeaturedCommunitySlot.filter({ status: 'active' });
    const heroSlots = activeSlots.filter(s => s.slot_type === 'hero');
    const secondarySlots = activeSlots.filter(s => s.slot_type === 'secondary');

    if (slot_type === 'hero' && heroSlots.length >= 1) {
      return Response.json({ error: 'Hero slot is full. Choose secondary.' }, { status: 409 });
    }
    if (slot_type === 'secondary' && secondarySlots.length >= 2) {
      return Response.json({ error: 'All secondary slots are full' }, { status: 409 });
    }

    // Create checkout session via Base44 Payments
    const checkoutResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a payment checkout for a featured community listing. Community: ${community.name}. Duration: ${duration_months} months. Price: $${(price / 100).toFixed(2)}. This is a request to process a payment.`,
    });

    // For now, return a placeholder checkout URL
    // In production, integrate with actual Base44 Payments API
    const checkoutUrl = `${origin}/checkout?type=featured&community_id=${community_id}&duration=${duration_months}&price=${price}`;

    return Response.json({
      checkout_url: checkoutUrl,
      community_id,
      duration_months: parseInt(duration_months),
      slot_type,
      price_cents: price,
      price_display: `$${(price / 100).toFixed(2)}`,
    });
  } catch (error) {
    console.error('Featured checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});