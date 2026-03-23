import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, type, description, relatedEntityId, relatedEntityType } = body;

    if (!amount || !type || !description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://united.community';
    const backUrl = `${origin}/Feed`;
    const thankYouUrl = `${origin}/ThankYou`;

    const checkoutPayload = {
      lineItems: [
        {
          quantity: '1',
          priceData: {
            price: Math.round(amount * 100),
            currency: 'USD'
          },
          name: description,
          description: description
        }
      ],
      successUrl: thankYouUrl,
      cancelUrl: backUrl,
      metadata: {
        userId: user.id,
        type: type,
        relatedEntityId: relatedEntityId || '',
        relatedEntityType: relatedEntityType || ''
      }
    };

    const response = await fetch('https://www.wixapis.com/v1/payments/checkout-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('WIX_PAYMENTS_API_KEY')}`,
        'wix-site-id': Deno.env.get('WIX_PAYMENTS_SITE_ID'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Wix Payments API error:', error);
      return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    const checkoutSession = await response.json();

    await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      order_id: checkoutSession.id,
      amount: amount,
      type: type,
      description: description,
      status: 'pending',
      related_entity_id: relatedEntityId || null,
      related_entity_type: relatedEntityType || null,
      email: user.email
    });

    return Response.json({
      checkoutUrl: checkoutSession.redirectSession.redirectUrl
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});