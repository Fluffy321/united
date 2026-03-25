import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Triggered by entity automation on Comment.create
// Notifies post author when someone comments on their help/housing/event post
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const comment = body.data;
    if (!comment?.post_id) {
      return Response.json({ ok: true, skipped: 'no post_id' });
    }

    // Look up the original post
    const posts = await base44.asServiceRole.entities.UnifiedPost.filter({ id: comment.post_id });
    const post = posts[0];
    if (!post) return Response.json({ ok: true, skipped: 'post not found' });

    // Only notify for help, housing, event types
    const notifyTypes = ['help', 'housing', 'event'];
    const notifyBoards = ['help', 'housing', 'events'];
    if (!notifyTypes.includes(post.type) && !notifyBoards.includes(post.board)) {
      return Response.json({ ok: true, skipped: 'post type not tracked' });
    }

    // Don't notify if commenter is the post author
    if (comment.author_id === post.user_id) {
      return Response.json({ ok: true, skipped: 'self-comment' });
    }

    const commenterName = comment.author_name || 'Someone';
    const postTitle = post.title || post.body?.slice(0, 50) || 'your post';
    const typeLabel = post.type === 'housing' ? 'housing listing' : post.type === 'event' ? 'event' : 'help request';

    await base44.asServiceRole.entities.Notification.create({
      user_id: post.user_id,
      type: 'comment',
      message: `${commenterName} replied to your ${typeLabel}: "${postTitle}"`,
      related_id: comment.post_id,
      related_type: 'post',
      read: false,
    });

    console.log(`Notified post owner ${post.user_id} of comment on ${post.type} post ${post.id}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('notifyOnPostInteraction error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});