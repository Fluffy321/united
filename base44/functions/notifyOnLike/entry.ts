import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation on Like.create
// Notifies post author when someone likes their post
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const like = body.data;
    if (!like?.post_id) return Response.json({ ok: true, skipped: 'no post_id' });

    const posts = await base44.asServiceRole.entities.UnifiedPost.filter({ id: like.post_id });
    const post = posts[0];
    if (!post) return Response.json({ ok: true, skipped: 'post not found' });

    // Don't notify self-likes
    if (like.user_id === post.user_id) {
      return Response.json({ ok: true, skipped: 'self-like' });
    }

    // Get liker's name
    let likerName = 'Someone';
    try {
      const users = await base44.asServiceRole.entities.User.filter({ id: like.user_id });
      if (users[0]) likerName = users[0].display_name || users[0].full_name?.split(' ')[0] || 'Someone';
    } catch (e) {
      console.warn('Could not fetch liker name:', e.message);
    }

    const postSnippet = post.title || post.body?.slice(0, 50) || 'your post';

    await base44.asServiceRole.entities.Notification.create({
      user_id: post.user_id,
      type: 'like',
      actor_id: like.user_id,
      actor_name: likerName,
      post_id: like.post_id,
      message: `${likerName} liked your post: "${postSnippet}"`,
      is_read: false,
    });

    console.log(`Notified ${post.user_id} of like on post ${post.id}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('notifyOnLike error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});