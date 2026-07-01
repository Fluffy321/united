import notificationsService from './notificationsService';
import { createConversation, createMessage, createMessageRequest, filterBlock, filterConversation, filterMessage, filterMessageRequest, listConversation, subscribeMessage, updateConversation, updateMessageRequest } from '@/services/entityServices';

export const messagesService = {
  listConversations(sort = '-updated_date', limit = 100) {
    return listConversation(sort, limit);
  },
  filterConversations(filter = {}, sort = '-updated_date', limit = 100) {
    return filterConversation(filter, sort, limit);
  },
  createConversation(payload) {
    return createConversation(payload);
  },
  updateConversation(id, patch) {
    return updateConversation(id, patch);
  },
  subscribeToMessages(callback) {
    return subscribeMessage(callback);
  },
  listMessages(conversationId, sort = 'created_date') {
    return filterMessage({ conversation_id: conversationId }, sort);
  },
  async createMessage(payload) {
    // Blocks must also stop sends into conversations that predate the block
    // (community chats have a pseudo recipient id and are exempt).
    const recipientId = payload.recipient_id ? String(payload.recipient_id) : '';
    if (payload.sender_id && recipientId && !recipientId.startsWith('community-')) {
      const [blockedByMe, blockedByThem] = await Promise.all([
        filterBlock({ blocker_id: payload.sender_id, blocked_id: payload.recipient_id }),
        filterBlock({ blocker_id: payload.recipient_id, blocked_id: payload.sender_id }),
      ]);
      if (blockedByMe.length > 0) throw new Error("You've blocked this person. Unblock them in Settings to message them.");
      if (blockedByThem.length > 0) throw new Error("You can't message this person.");
    }
    const message = await createMessage({
      ...payload,
      sender_avatar_url: payload.sender_avatar_url || payload.sender_avatar || null,
    });
    notificationsService.notifyMessageReceived({
      recipientId: payload.recipient_id,
      senderId: payload.sender_id,
      senderName: payload.sender_name,
      conversationId: payload.conversation_id,
      preview: payload.content,
    }).catch(() => {});
    return message;
  },
  listMessageRequests(filter = {}, sort = '-created_date', limit = 50) {
    return filterMessageRequest(filter, sort, limit);
  },
  createMessageRequest(payload) {
    return createMessageRequest(payload);
  },
  updateMessageRequest(id, patch) {
    return updateMessageRequest(id, patch);
  },
};

const displayNameFor = (user = {}) =>
  user.display_name || user.full_name?.split(' ')[0] || user.name || 'User';

const compactPayload = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

// recipient: { id, name, age_range? }
export function findDirectConversation(currentUserId, recipientId, conversations) {
  return conversations.find(c =>
    c.participant_ids?.includes(currentUserId) &&
    c.participant_ids?.includes(recipientId) &&
    c.participant_ids?.length === 2
  ) ?? null;
}

export async function createDirectConversation(currentUser, recipient, options = {}) {
  const payload = compactPayload({
    participant_ids: [currentUser.id, recipient.id],
    participant_names: [
      displayNameFor(currentUser),
      recipient.name || displayNameFor(recipient),
    ],
    participant_avatars: [
      currentUser.avatar_url || '',
      recipient.avatar_url || recipient.avatar || '',
    ],
    participant_ages: [currentUser.age_range || '18+', recipient.age_range || '18+'],
    unread_count: { [recipient.id]: 0 },
    last_message: '',
    last_message_at: new Date().toISOString(),
    request_id: options.request_id || undefined,
    request_title: options.request_title || undefined,
    request_type: options.request_type ?? 'general',
  });
  return createConversation(payload);
}

export async function findOrCreateDirectConversation(currentUser, recipient, options = {}) {
  if (!currentUser?.id) throw new Error('Please log in to message.');
  if (!recipient?.id) throw new Error('This member is missing a profile id.');
  if (currentUser.id === recipient.id) throw new Error("You can't message yourself.");

  const [blockedByMe, blockedByThem] = await Promise.all([
    filterBlock({ blocker_id: currentUser.id, blocked_id: recipient.id }),
    filterBlock({ blocker_id: recipient.id, blocked_id: currentUser.id }),
  ]);
  if (blockedByMe.length > 0) throw new Error("You've blocked this person. Unblock them in Settings to message them.");
  if (blockedByThem.length > 0) throw new Error("You can't message this person.");

  const conversations = await listConversation('-updated_date', 100);
  const existing = findDirectConversation(currentUser.id, recipient.id, conversations);
  if (existing) return existing;
  return createDirectConversation(currentUser, recipient, options);
}

export default messagesService;
