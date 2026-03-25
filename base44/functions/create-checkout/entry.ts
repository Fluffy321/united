import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { amount, type, description, relatedEntityId, relatedEntityType, quantity = 1 } = body;

    if (!amount || !type || !description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://united.community';
    const backUrl = `${origin}/`;
    const thankYouUrl = `${origin}/ThankYou`;

    const checkoutPayload = {
      cart: {
        items: [
          {
            name: description,
            quantity: quantity,
            price: parseFloat(amount).toFixed(2)
          }
        ]
      },
      callbackUrls: {
        postFlowUrl: backUrl,
        thankYouPageUrl: thankYouUrl
      }
    };

    console.log('Creating checkout session:', { amount, type, description });

    const response = await fetch('https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct', {
      method: 'POST',
      headers: {
        'Authorization': Deno.env.get('WIX_PAYMENTS_API_KEY'),
        'wix-site-id': Deno.env.get('WIX_PAYMENTS_SITE_ID'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutPayload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Wix Payments API error:', JSON.stringify(responseData));
      return Response.json({ error: 'Failed to create checkout session', details: responseData }, { status: 500 });
    }

    console.log('Checkout session created:', responseData.checkoutSession?.id);

    // Optionally record the pending transaction (user may not be logged in)
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me().catch(() => null);
      if (user) {
        await base44.asServiceRole.entities.Transaction.create({
          user_id: user.id,
          order_id: responseData.checkoutSession.id,
          amount: parseFloat(amount),
          type: type,
          description: description,
          status: 'pending',
          related_entity_id: relatedEntityId || null,
          related_entity_type: relatedEntityType || null,
          email: user.email
        });
      }
    } catch (e) {
      console.log('Could not record transaction (user not logged in):', e.message);
    }

    return Response.json({
      checkoutUrl: responseData.checkoutSession.redirectUrl,
      sessionId: responseData.checkoutSession.id
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});