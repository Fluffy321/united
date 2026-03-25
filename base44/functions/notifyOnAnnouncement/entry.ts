import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Triggered by entity automation when a CommunityPost is created with type=announcement
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const post = body.data;
    if (!post || post.type !== 'announcement') {
      return Response.json({ ok: true, skipped: 'not an announcement' });
    }

    const communityId = post.community_id;
    const authorName = post.author_name || 'Someone';
    const title = post.title || post.body?.slice(0, 60) || 'New announcement';

    // Get all members of this community
    const members = await base44.asServiceRole.entities.UserCommunity.filter({ community_id: communityId });

    // Get community name
    let communityName = 'your community';
    try {
      const comms = await base44.asServiceRole.entities.Community.filter({ id: communityId });
      if (comms[0]) communityName = comms[0].name;
    } catch (e) {
      console.warn('Could not fetch community name:', e.message);
    }

    // Notify each member except the author
    const notifications = members
      .filter(m => m.user_id !== post.author_user_id)
      .map(m =>
        base44.asServiceRole.entities.Notification.create({
          user_id: m.user_id,
          type: 'announcement',
          message: `${authorName} posted an announcement in ${communityName}: "${title}"`,
          related_id: post.id,
          related_type: 'community_post',
          read: false,
        })
      );

    await Promise.allSettled(notifications);
    console.log(`Notified ${notifications.length} members of announcement in community ${communityId}`);
    return Response.json({ ok: true, notified: notifications.length });
  } catch (error) {
    console.error('notifyOnAnnouncement error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});