import { filterFriendship, filterUser, filterUserCommunity } from '@/services/entityServices';

/**
 * Check whether sender and recipient share any community group.
 */
export async function shareCommunity(senderId, recipientId) {
  const [senderMemberships, recipientMemberships] = await Promise.all([
    filterUserCommunity({ user_id: senderId }),
    filterUserCommunity({ user_id: recipientId }),
  ]);
  const senderCommunityIds = new Set(senderMemberships.map(m => m.community_id));
  return recipientMemberships.some(m => senderCommunityIds.has(m.community_id));
}

/**
 * Check whether sender and recipient are connections (UserConnection).
 */
export async function areConnections(senderId, recipientId) {
  const conns = await filterFriendship({ user_id: senderId, friend_id: recipientId });
  return conns.length > 0;
}

/**
 * Main permission check.
 * Returns { canMessage: boolean }
 */
export async function canMessage(sender, recipientId) {
  const recipientArr = await filterUser({ id: recipientId });
  const recipient = recipientArr[0];
  if (!recipient) return { canMessage: false };

  const settings = recipient.message_settings || {};
  const rule = settings.allowMessagesFrom || settings.allow_messages_from || 'communities';

  if (rule === 'everyone') return { canMessage: true };
  if (rule === 'members') return { canMessage: true };
  if (rule === 'nobody') return { canMessage: false };
  if (rule === 'communities') {
    const shared = await shareCommunity(sender.id, recipientId);
    return { canMessage: shared };
  }
  if (rule === 'connections') {
    const connected = await areConnections(sender.id, recipientId);
    return { canMessage: connected };
  }
  return { canMessage: false };
}
