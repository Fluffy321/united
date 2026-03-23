import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const signature = req.headers.get('x-wix-signature');

    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 401 });
    }

    const publicKey = Deno.env.get('WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY');
    if (!publicKey) {
      console.error('WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY not set');
      return Response.json({ error: 'Configuration error' }, { status: 500 });
    }

    // Verify JWT signature using Web Crypto API
    const keyData = new TextEncoder().encode(publicKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = new Uint8Array(
      atob(signature).split('').map(c => c.charCodeAt(0))
    );

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signatureBytes,
      new TextEncoder().encode(body)
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.eventType === 'payments.order.payment_received') {
      const orderId = event.data.order.id;
      const status = event.data.order.paymentStatus === 'PAID' ? 'completed' : 'failed';

      const transactions = await base44.asServiceRole.entities.Transaction.filter({ order_id: orderId });
      if (transactions.length > 0) {
        await base44.asServiceRole.entities.Transaction.update(transactions[0].id, {
          status: status
        });

        if (status === 'completed') {
          await base44.asServiceRole.entities.Notification.create({
            user_id: transactions[0].user_id,
            type: 'payment',
            message: `Payment of $${(transactions[0].amount / 100).toFixed(2)} received`,
            read: false
          }).catch(() => {});
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: 'Processing error' }, { status: 500 });
  }
});