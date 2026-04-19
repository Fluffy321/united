import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called from frontend when a user is @mentioned in a comment or post body.
// Payload: { mentioned_user_id, actor_id, actor_name, post_id, context_text }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { mentioned_user_id, actor_id, actor_name, post_id, context_text } = await req.json();

    if (!mentioned_user_id || !actor_id || mentioned_user_id === actor_id) {
      return Response.json({ ok: true, skipped: 'invalid or self-mention' });
    }

    const preview = context_text?.slice(0, 60) || '';
    const ellipsis = (context_text?.length || 0) > 60 ? '…' : '';

    await base44.asServiceRole.entities.Notification.create({
      user_id: mentioned_user_id,
      type: 'mention',
      actor_id,
      actor_name: actor_name || 'Someone',
      post_id: post_id || null,
      message: `${actor_name || 'Someone'} mentioned you: "${preview}${ellipsis}"`,
      is_read: false,
    });

    console.log(`Notified ${mentioned_user_id} of mention by ${actor_id}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('notifyOnMention error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});