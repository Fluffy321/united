import { dataService } from '@/services';

/**
 * Check whether sender and recipient share any community group.
 */
export async function shareCommunity(senderId, recipientId) {
  const [senderMemberships, recipientMemberships] = await Promise.all([
    dataService.entities.UserCommunity.filter({ user_id: senderId }),
    dataService.entities.UserCommunity.filter({ user_id: recipientId }),
  ]);
  const senderCommunityIds = new Set(senderMemberships.map(m => m.community_id));
  return recipientMemberships.some(m => senderCommunityIds.has(m.community_id));
}

/**
 * Check whether sender and recipient are connections (UserConnection).
 */
export async function areConnections(senderId, recipientId) {
  const conns = await dataService.entities.Friendship.filter({ user_id: senderId, friend_id: recipientId });
  return conns.length > 0;
}

/**
 * Main permission check.
 * Returns { canMessage: boolean }
 */
export async function canMessage(sender, recipientId) {
  const recipientArr = await dataService.entities.User.filter({ id: recipientId });
  const recipient = recipientArr[0];
  if (!recipient) return { canMessage: false };

  const settings = recipient.message_settings || {};
  const rule = settings.allowMessagesFrom || 'communities';

  if (rule === 'everyone') return { canMessage: true };
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
