import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Only handle new event posts
    const { data, event } = body;
    if (event?.type !== 'create') return Response.json({ ok: true });
    if (data?.type !== 'event') return Response.json({ ok: true });

    const post = data;
    if (!post.community_id) return Response.json({ ok: true, reason: 'no community' });

    // Find all members of this community
    const memberships = await base44.asServiceRole.entities.UserCommunity.filter({
      community_id: post.community_id,
    });

    if (!memberships.length) return Response.json({ ok: true, reason: 'no members' });

    // Create a notification for each member (excluding the post author)
    const notifications = memberships
      .filter(m => m.user_id !== post.user_id)
      .map(m => ({
        user_id: m.user_id,
        type: 'post_reply',
        actor_id: post.user_id,
        actor_name: post.user_name || 'Someone',
        post_id: post.id,
        message: `📅 New event in ${post.community_name || 'your community'}: "${post.title || post.body?.substring(0, 60)}"`,
        is_read: false,
      }));

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
      console.log(`Notified ${notifications.length} members of new event in community ${post.community_id}`);
    }

    return Response.json({ ok: true, notified: notifications.length });
  } catch (error) {
    console.error('notifyOnNewCommunityEvent error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});