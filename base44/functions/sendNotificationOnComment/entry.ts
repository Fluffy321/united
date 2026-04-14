// Legacy function kept for backwards compatibility — logic now lives in notifyOnCommentReply automation.
// This is still called directly from CommentsSheet for immediate post-author notification.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { post_id, commenter_id, commenter_name, post_author_id } = body;

    if (!post_author_id || post_author_id === commenter_id) {
      return Response.json({ success: true });
    }

    // Create notification using the correct Notification entity schema
    await base44.asServiceRole.entities.Notification.create({
      user_id: post_author_id,
      type: 'post_reply',
      actor_id: commenter_id,
      actor_name: commenter_name || 'Someone',
      post_id: post_id,
      message: `${commenter_name || 'Someone'} replied to your post`,
      is_read: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendNotificationOnComment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});