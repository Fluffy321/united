import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || event.entity_name !== 'Comment') {
      return Response.json({ ok: true });
    }

    const comment = data;
    if (!comment || !comment.post_id || !comment.author_id) {
      return Response.json({ ok: true });
    }

    // Get the post to find the original author
    const post = await base44.asServiceRole.entities.UnifiedPost.get(comment.post_id);
    if (!post || !post.user_id || post.user_id === comment.author_id) {
      return Response.json({ ok: true });
    }

    // Create notification for post author
    const notifMessage = `${comment.author_name} replied to your post`;
    await base44.asServiceRole.entities.Notification.create({
      user_id: post.user_id,
      type: 'post_reply',
      actor_id: comment.author_id,
      actor_name: comment.author_name,
      post_id: comment.post_id,
      comment_id: comment.id,
      message: notifMessage,
      is_read: false,
    });

    // Notify other commenters on this post
    const otherComments = await base44.asServiceRole.entities.Comment.filter({
      post_id: comment.post_id,
    });

    const uniqueCommenters = new Set(
      otherComments
        .filter(c => c.author_id !== comment.author_id && c.author_id !== post.user_id)
        .map(c => c.author_id)
    );

    for (const commenterId of uniqueCommenters) {
      await base44.asServiceRole.entities.Notification.create({
        user_id: commenterId,
        type: 'comment_reply',
        actor_id: comment.author_id,
        actor_name: comment.author_name,
        post_id: comment.post_id,
        comment_id: comment.id,
        message: `${comment.author_name} replied to a post you commented on`,
        is_read: false,
      });
    }

    return Response.json({ ok: true, notified: 1 + uniqueCommenters.size });
  } catch (error) {
    console.error('notifyOnCommentReply error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});