import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { post_id, commenter_id, commenter_name, comment_body, post_author_id, group_name } = body;

    if (!post_author_id || post_author_id === commenter_id) {
      return Response.json({ success: true });
    }

    // Check user's notification preferences
    const prefs = await base44.entities.NotificationPreference.filter({ user_id: post_author_id });
    const preference = prefs[0];

    // If no preference exists, create default (replies enabled)
    if (!preference) {
      await base44.entities.NotificationPreference.create({
        user_id: post_author_id,
        replies_enabled: true,
        group_activity_enabled: false,
        mentions_enabled: true,
      });
    }

    // Check if replies notifications are enabled
    if (preference && !preference.replies_enabled) {
      return Response.json({ success: true, skipped: true });
    }

    // Create notification
    const notification = await base44.entities.Notification.create({
      user_id: post_author_id,
      type: 'reply',
      message: `${commenter_name} replied to your post${group_name ? ` in ${group_name}` : ''}`,
      link: `/post/${post_id}`,
      read: false,
    });

    return Response.json({ success: true, notification_id: notification.id });
  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});