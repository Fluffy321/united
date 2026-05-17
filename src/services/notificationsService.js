import dataService from './dataService';
import { shouldUseSupabase, supabase } from '@/api/supabaseClient';

async function sendPush({ userId, title, body, url, notificationType }) {
  if (!shouldUseSupabase || !supabase) return;
  try {
    await supabase.functions.invoke('push-notify', {
      body: { user_id: userId, title, body, url, notification_type: notificationType },
    });
  } catch {
    // Push is best-effort — never let it break the in-app notification flow
  }
}

const nowISO = () => new Date().toISOString();

const normalizeNotification = (notification = {}) => ({
  ...notification,
  message: notification.message || notification.body || notification.title || '',
  body: notification.body || notification.message || '',
  created_date: notification.created_date || notification.created_at || nowISO(),
  is_read: Boolean(notification.is_read || notification.read),
  aggregate_count: notification.aggregate_count || 1,
});

const buildNotification = ({
  userId,
  actorId = null,
  actorDisplayName = null,
  actorAvatarUrl = null,
  type = 'default',
  title,
  body,
  linkUrl = null,
  postId = null,
  conversationId = null,
  data = {},
  aggregateKey = null,
}) => ({
  user_id: userId,
  actor_id: actorId,
  actor_display_name: actorDisplayName,
  actor_avatar_url: actorAvatarUrl,
  type,
  title: title || body || 'Notification',
  body: body || title || '',
  link_url: linkUrl,
  post_id: postId,
  conversation_id: conversationId,
  data,
  aggregate_key: aggregateKey,
  aggregate_count: 1,
  is_read: false,
  created_date: nowISO(),
});

export const notificationsService = {
  async listForUser(userId, limit = 80) {
    if (!userId) return [];
    if (shouldUseSupabase && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map(normalizeNotification);
    }
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

    const payload = buildNotification(input);
    let notification;

    if (shouldUseSupabase && supabase && payload.aggregate_key) {
      // Aggregated path — atomic upsert via RPC (bypasses RLS UPDATE restriction)
      const { data, error } = await supabase.rpc('upsert_aggregated_notification', {
        p_user_id:            payload.user_id,
        p_actor_id:           payload.actor_id,
        p_actor_display_name: payload.actor_display_name,
        p_actor_avatar_url:   payload.actor_avatar_url,
        p_type:               payload.type,
        p_title:              payload.title,
        p_body:               payload.body,
        p_link_url:           payload.link_url,
        p_post_id:            payload.post_id,
        p_conversation_id:    payload.conversation_id,
        p_data:               payload.data,
        p_aggregate_key:      payload.aggregate_key,
      });
      if (error) throw error;
      if (!data) return null; // RPC returned null (self-notification guard in the function)
      notification = data;
    } else {
      notification = await dataService.entities.Notification.create(payload);
    }

    sendPush({
      userId: input.userId,
      title: input.title || input.body || 'JUnited',
      body: input.body || input.title || '',
      url: input.linkUrl ?? '/',
      notificationType: input.type,
    });
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
      type:         'community_activity',
      title:        'Community activity',
      body:         `${actorName || 'Someone'} posted in ${communityName || 'your community'}.`,
      linkUrl:      postId ? `/PostDetail?id=${postId}` : '/Communities',
      postId,
      data:         { community_id: communityId },
      aggregateKey: communityId ? `community_activity:${communityId}` : null,
    });
  },

  notifyCommentReply({ recipientId, actorId, actorName, actorAvatarUrl, postId, commentId, preview }) {
    return this.create({
      userId:           recipientId,
      actorId,
      actorDisplayName: actorName,
      actorAvatarUrl,
      type:             'comment_reply',
      title:            'New reply in your thread',
      body:             `${actorName || 'Someone'} replied${preview ? `: ${preview}` : '.'}`,
      linkUrl:          postId ? `/PostDetail?id=${postId}` : '/Feed',
      postId,
      data:             { comment_id: commentId, preview },
      aggregateKey:     postId ? `comment_reply:${postId}` : null,
    });
  },

  notifyPostLiked({ posterId, likerId, likerName, likerAvatarUrl, postId }) {
    return this.create({
      userId:           posterId,
      actorId:          likerId,
      actorDisplayName: likerName,
      actorAvatarUrl:   likerAvatarUrl,
      type:             'post_liked',
      title:            'Someone liked your post',
      body:             `${likerName || 'Someone'} liked your post.`,
      linkUrl:          postId ? `/PostDetail?id=${postId}` : '/Feed',
      postId,
      aggregateKey:     postId ? `post_liked:${postId}` : null,
    });
  },

  notifyPostCommented({ posterId, commenterId, commenterName, commenterAvatarUrl, postId, preview }) {
    return this.create({
      userId:           posterId,
      actorId:          commenterId,
      actorDisplayName: commenterName,
      actorAvatarUrl:   commenterAvatarUrl,
      type:             'post_commented',
      title:            'New comment on your post',
      body:             `${commenterName || 'Someone'} commented${preview ? `: "${preview}"` : ' on your post.'}`,
      linkUrl:          postId ? `/PostDetail?id=${postId}` : '/Feed',
      postId,
      data:             { preview },
      aggregateKey:     postId ? `post_commented:${postId}` : null,
    });
  },

  notifyUserMentioned({ userId, actorId, actorName, actorAvatarUrl, postId, preview }) {
    return this.create({
      userId,
      actorId,
      actorDisplayName: actorName,
      actorAvatarUrl,
      type:             'user_mentioned',
      title:            'You were mentioned',
      body:             `${actorName || 'Someone'} mentioned you${preview ? `: "${preview}"` : '.'}`,
      linkUrl:          postId ? `/PostDetail?id=${postId}` : '/Feed',
      postId,
      data:             { preview },
    });
  },

  notifyDailyBriefReady({ userId, networkLabel = 'Five Towns' }) {
    return this.create({
      userId,
      type: 'announcement',
      title: 'Your daily brief is ready',
      body: `See what matters today in ${networkLabel}.`,
      linkUrl: '/Feed',
      data: { brief: true, network: networkLabel },
    });
  },

  notifyMemberRemoved({ removedUserId, adminId, communityName, communityId, removalId }) {
    return this.create({
      userId: removedUserId,
      actorId: adminId,
      type: 'community_removal',
      title: 'You were removed from a community',
      body: `You were removed from ${communityName || 'a community'}. You may submit an appeal.`,
      linkUrl: communityId ? `/Communities?community=${communityId}` : '/Communities',
      data: { community_id: communityId, removal_id: removalId, can_appeal: true },
    });
  },

  notifyAppealResolved({ userId, adminId, communityName, communityId, decision }) {
    const approved = decision === 'approved';
    return this.create({
      userId,
      actorId: adminId,
      type: 'appeal_resolved',
      title: approved ? 'Your appeal was approved' : 'Your appeal was denied',
      body: approved
        ? `Your appeal to rejoin ${communityName || 'the community'} was approved. You are now a member again.`
        : `Your appeal to rejoin ${communityName || 'the community'} was reviewed and denied.`,
      linkUrl: communityId ? `/Communities?community=${communityId}` : '/Communities',
      data: { community_id: communityId, decision },
    });
  },

  notifyDeletionVoteStarted({ recipientId, initiatorId, initiatorName, communityId, communityName, requestId }) {
    return this.create({
      userId:   recipientId,
      actorId:  initiatorId,
      type:     'deletion_vote',
      title:    'Community deletion vote started',
      body:     `${initiatorName || 'An admin'} has initiated a vote to delete "${communityName || 'your community'}". Your approval is required.`,
      linkUrl:  communityId ? `/Communities?community=${communityId}` : '/Communities',
      data:     { community_id: communityId, request_id: requestId },
    });
  },

  notifyNearbyMapActivity({ userId, actorId, actorName, communityName, postId, locationLabel }) {
    return this.create({
      userId,
      actorId,
      type: 'community_activity',
      title: 'New map activity nearby',
      body: `${actorName || 'Someone'} posted${communityName ? ` in ${communityName}` : ''}${locationLabel ? ` near ${locationLabel}` : ''}.`,
      linkUrl: '/Map',
      postId,
      data: { location_label: locationLabel, source: 'map' },
    });
  },
};

export default notificationsService;
