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
        const tx = transactions[0];
        await base44.asServiceRole.entities.Transaction.update(tx.id, { status });
        console.log(`Transaction ${tx.id} marked ${status}`);

        if (status === 'completed') {
          // Mark ticket as purchased for event ticket transactions
          if (tx.related_entity_type === 'CommunityEvent' && tx.related_entity_id) {
            const rsvps = await base44.asServiceRole.entities.CommunityEventRSVP.filter({
              event_id: tx.related_entity_id,
              user_id: tx.user_id
            });
            if (rsvps.length > 0) {
              await base44.asServiceRole.entities.CommunityEventRSVP.update(rsvps[0].id, {
                ticket_purchased: true,
                order_id: orderId,
                status: 'going',
              });
            } else {
              // Create RSVP if doesn't exist
              await base44.asServiceRole.entities.CommunityEventRSVP.create({
                event_id: tx.related_entity_id,
                user_id: tx.user_id,
                user_name: tx.email || 'Member',
                status: 'going',
                ticket_purchased: true,
                ticket_quantity: 1,
                order_id: orderId,
              });
            }
            // Update tickets_sold count
            const eventRecords = await base44.asServiceRole.entities.CommunityEvent.filter({ id: tx.related_entity_id });
            if (eventRecords.length > 0) {
              const ev = eventRecords[0];
              const qty = rsvps[0]?.ticket_quantity || 1;
              await base44.asServiceRole.entities.CommunityEvent.update(ev.id, {
                tickets_sold: (ev.tickets_sold || 0) + qty
              });
            }
            console.log(`Ticket confirmed for event ${tx.related_entity_id}, user ${tx.user_id}`);
          }

          await base44.asServiceRole.entities.Notification.create({
            user_id: tx.user_id,
            type: 'payment',
            message: `Your ticket purchase was confirmed! ✅`,
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