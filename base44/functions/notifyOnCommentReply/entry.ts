import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    const notified = new Set();

    // 1. Notify the post author ("someone replied to your post")
    let postAuthorId = null;
    try {
      const post = await base44.asServiceRole.entities.UnifiedPost.get(comment.post_id);
      if (post?.user_id && post.user_id !== comment.author_id) {
        postAuthorId = post.user_id;
        await base44.asServiceRole.entities.Notification.create({
          user_id: post.user_id,
          type: 'post_reply',
          actor_id: comment.author_id,
          actor_name: comment.author_name || 'Someone',
          post_id: comment.post_id,
          comment_id: comment.id,
          message: `${comment.author_name || 'Someone'} replied to your post`,
          is_read: false,
        });
        notified.add(post.user_id);
      }
    } catch (e) {
      console.error('Could not notify post author:', e.message);
    }

    // 2. If this is a reply to a specific comment, notify that commenter
    if (comment.reply_to_comment_id) {
      try {
        const parentComment = await base44.asServiceRole.entities.Comment.get(comment.reply_to_comment_id);
        if (parentComment?.author_id && parentComment.author_id !== comment.author_id && !notified.has(parentComment.author_id)) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: parentComment.author_id,
            type: 'comment_reply',
            actor_id: comment.author_id,
            actor_name: comment.author_name || 'Someone',
            post_id: comment.post_id,
            comment_id: comment.id,
            message: `${comment.author_name || 'Someone'} replied to your comment`,
            is_read: false,
          });
          notified.add(parentComment.author_id);
        }
      } catch (e) {
        console.error('Could not notify parent commenter:', e.message);
      }
    }

    // 3. Notify other unique commenters on this thread ("someone replied to a post you commented on")
    try {
      const threadComments = await base44.asServiceRole.entities.Comment.filter({ post_id: comment.post_id });
      const threadParticipants = new Set(
        threadComments
          .map(c => c.author_id)
          .filter(id => id && id !== comment.author_id && !notified.has(id))
      );

      for (const participantId of threadParticipants) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: participantId,
          type: 'comment_reply',
          actor_id: comment.author_id,
          actor_name: comment.author_name || 'Someone',
          post_id: comment.post_id,
          comment_id: comment.id,
          message: `${comment.author_name || 'Someone'} replied to a post you commented on`,
          is_read: false,
        });
        notified.add(participantId);
      }
    } catch (e) {
      console.error('Could not notify thread participants:', e.message);
    }

    return Response.json({ ok: true, notified: notified.size });
  } catch (error) {
    console.error('notifyOnCommentReply error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});