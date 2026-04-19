import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Entity automation: fires on Message create
// Creates an in-app notification for the recipient
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const msg = body.data;
    if (!msg?.conversation_id || !msg?.sender_id || !msg?.recipient_id) {
      return Response.json({ ok: true, skipped: 'missing fields' });
    }

    // Don't notify self-sends
    if (msg.sender_id === msg.recipient_id) {
      return Response.json({ ok: true, skipped: 'self-message' });
    }

    const senderName = msg.sender_name || 'Someone';
    const preview = msg.content?.slice(0, 60) || 'Sent you a message';
    const ellipsis = (msg.content?.length || 0) > 60 ? '…' : '';

    await base44.asServiceRole.entities.Notification.create({
      user_id: msg.recipient_id,
      type: 'new_message',
      actor_id: msg.sender_id,
      actor_name: senderName,
      conversation_id: msg.conversation_id,
      message: `${senderName}: "${preview}${ellipsis}"`,
      is_read: false,
    });

    console.log(`Notified ${msg.recipient_id} of new message from ${msg.sender_id}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('notifyOnNewMessage error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});