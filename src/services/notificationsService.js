import dataService from './dataService';
import { shouldUseSupabase, supabase } from '@/api/supabaseClient';

const nowISO = () => new Date().toISOString();

const normalizeNotification = (notification = {}) => ({
  ...notification,
  message: notification.message || notification.body || notification.title || '',
  body: notification.body || notification.message || '',
  created_date: notification.created_date || notification.created_at || nowISO(),
  is_read: Boolean(notification.is_read || notification.read),
});

const buildNotification = ({
  userId,
  actorId = null,
  type = 'default',
  title,
  body,
  linkUrl = null,
  postId = null,
  conversationId = null,
  data = {},
}) => ({
  user_id: userId,
  actor_id: actorId,
  type,
  title: title || body || 'Notification',
  body: body || title || '',
  link_url: linkUrl,
  post_id: postId,
  conversation_id: conversationId,
  data,
  is_read: false,
  created_date: nowISO(),
});

export const notificationsService = {
  async listForUser(userId, limit = 80) {
    if (!userId) return [];
    const notifications = await dataService.entities.Notification.filter({ user_id: userId }, '-created_date', limit);
    return notifications.map(normalizeNotification);
  },

  async unreadCount(userId) {
    if (!userId) return 0;
    if (shouldUseSupabase && supabase) {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    }
    const notifications = await dataService.entities.Notification.filter(
      { user_id: userId, is_read: false },
      '-created_date',
      200
    );
    return notifications.length;
  },

  async create(input) {
    if (!input?.userId || input.userId === input.actorId) return null;
    const notification = await dataService.entities.Notification.create(buildNotification(input));
    return normalizeNotification(notification);
  },

  async markRead(notificationId) {
    if (!notificationId) return null;
    const updated = await dataService.entities.Notification.update(notificationId, {
      is_read: true,
      read_at: nowISO(),
    });
    return normalizeNotification(updated);
  },

  async markAllRead(notifications = []) {
    const unread = notifications.filter((notification) => !notification.is_read);
    await Promise.all(unread.map((notification) => this.markRead(notification.id)));
  },

  notifyMessageReceived({ recipientId, senderId, senderName, conversationId, preview }) {
    return this.create({
      userId: recipientId,
      actorId: senderId,
      type: 'new_message',
      title: 'New message',
      body: `${senderName || 'Someone'} sent you a message${preview ? `: ${preview}` : '.'}`,
      linkUrl: conversationId ? `/Messages?conversation=${conversationId}` : '/Messages',
      conversationId,
      data: { preview },
    });
  },

  notifyMitzvahOffer({ posterId, volunteerId, volunteerName, requestId, requestTitle }) {
    return this.create({
      userId: posterId,
      actorId: volunteerId,
      type: 'mitzvah_offer',
      title: 'New Mitzvah offer',
      body: `${volunteerName || 'Someone'} offered to help with "${requestTitle}".`,
      linkUrl: '/MitzvahCircle',
      data: { request_id: requestId },
    });
  },

  notifyMitzvahAccepted({ volunteerId, posterId, posterName, requestId, requestTitle }) {
    return this.create({
      userId: volunteerId,
      actorId: posterId,
      type: 'mitzvah_accepted',
      title: 'Mitzvah offer accepted',
      body: `${posterName || 'The poster'} accepted your offer for "${requestTitle}".`,
      linkUrl: '/MitzvahCircle',
      data: { request_id: requestId },
    });
  },

  notifyVerificationRequest({ posterId, volunteerId, volunteerName, requestId, requestTitle, verificationRequestId }) {
    return this.create({
      userId: posterId,
      actorId: volunteerId,
      type: 'verification_request',
      title: 'Verification needed',
      body: `${volunteerName || 'The volunteer'} marked "${requestTitle}" complete. Please verify it.`,
      linkUrl: '/MitzvahCircle',
      data: { request_id: requestId, verification_request_id: verificationRequestId },
    });
  },

  notifyCommunityActivity({ userId, actorId, actorName, communityId, communityName, postId }) {
    return this.create({
      userId,
      actorId,
      type: 'community_activity',
      title: 'Community activity',
      body: `${actorName || 'Someone'} posted in ${communityName || 'your community'}.`,
      linkUrl: postId ? `/PostDetail?id=${postId}` : '/Communities',
      postId,
      data: { community_id: communityId },
    });
  },
};

export default notificationsService;
