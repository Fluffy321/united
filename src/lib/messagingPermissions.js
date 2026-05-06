import { dataService } from '@/services';

const MAX_NEW_CHATS_PER_DAY = 10;
const COOLDOWN_BETWEEN_NEW_CHATS_MS = 30 * 1000;

const lastChatTime = {};
const chatCountKey = (userId) => `new_chats_${userId}_${new Date().toDateString()}`;

/**
 * Check spam limits for sender.
 * Returns { allowed: boolean, reason: string }
 */
export function checkSpamLimits(senderId) {
  const now = Date.now();
  const last = lastChatTime[senderId] || 0;
  if (now - last < COOLDOWN_BETWEEN_NEW_CHATS_MS) {
    const remaining = Math.ceil((COOLDOWN_BETWEEN_NEW_CHATS_MS - (now - last)) / 1000);
    return { allowed: false, reason: `Please wait ${remaining}s before starting another conversation.` };
  }

  const key = chatCountKey(senderId);
  const count = parseInt(sessionStorage.getItem(key) || '0', 10);
  if (count >= MAX_NEW_CHATS_PER_DAY) {
    return { allowed: false, reason: "You've reached the daily limit for new conversations." };
  }

  return { allowed: true };
}

export function recordNewChat(senderId) {
  lastChatTime[senderId] = Date.now();
  const key = chatCountKey(senderId);
  const count = parseInt(sessionStorage.getItem(key) || '0', 10);
  sessionStorage.setItem(key, String(count + 1));
}

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