/**
 * Returns the in-app route for any notification, or null if the notification
 * has no actionable destination.  Use this everywhere instead of ad-hoc
 * link_url reads so deep-link behaviour stays consistent.
 */
export function getNotificationRoute(notif) {
  if (!notif) return null;
  if (notif.type === 'new_message' && notif.conversation_id) {
    return `/Messages?conversation=${notif.conversation_id}`;
  }
  if (notif.post_id) {
    return `/PostDetail?id=${notif.post_id}`;
  }
  if (notif.link_url) {
    return notif.link_url;
  }
  return null;
}
