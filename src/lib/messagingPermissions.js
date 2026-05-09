import { dataService } from '@/services';

/**
 * Check whether sender and recipient share any community group.
 */
export async function shareCommunity(senderId, recipientId) {
  const [senderMemberships, recipientMemberships] = await Promise.all([
    dataService.entities.GroupMember.filter({ user_id: senderId }),
    dataService.entities.GroupMember.filter({ user_id: recipientId }),
  ]);
  const senderGroupIds = new Set(senderMemberships.map(m => m.group_id));
  return recipientMemberships.some(m => senderGroupIds.has(m.group_id));
}

/**
 * Check whether sender and recipient are connections (UserConnection).
 */
export async function areConnections(senderId, recipientId) {
  const conns = await dataService.entities.UserConnection.filter({ user_id: senderId, connected_user_id: recipientId });
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