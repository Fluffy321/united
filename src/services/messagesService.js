import dataService from './dataService';
import notificationsService from './notificationsService';

export const messagesService = {
  listConversations(sort = '-updated_date', limit = 100) {
    return dataService.entities.Conversation.list(sort, limit);
  },
  filterConversations(filter = {}, sort = '-updated_date', limit = 100) {
    return dataService.entities.Conversation.filter(filter, sort, limit);
  },
  createConversation(payload) {
    return dataService.entities.Conversation.create(payload);
  },
  updateConversation(id, patch) {
    return dataService.entities.Conversation.update(id, patch);
  },
  subscribeToMessages(callback) {
    return dataService.entities.Message.subscribe(callback);
  },
  listMessages(conversationId, sort = 'created_date') {
    return dataService.entities.Message.filter({ conversation_id: conversationId }, sort);
  },
  async createMessage(payload) {
    const message = await dataService.entities.Message.create({
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
    return dataService.entities.MessageRequest.filter(filter, sort, limit);
  },
  createMessageRequest(payload) {
    return dataService.entities.MessageRequest.create(payload);
  },
  updateMessageRequest(id, patch) {
    return dataService.entities.MessageRequest.update(id, patch);
  },
};

// recipient: { id, name, age_range? }
export function findDirectConversation(currentUserId, recipientId, conversations) {
  return conversations.find(c =>
    c.participant_ids?.includes(currentUserId) &&
    c.participant_ids?.includes(recipientId) &&
    c.participant_ids?.length === 2
  ) ?? null;
}

export async function createDirectConversation(currentUser, recipient, options = {}) {
  return dataService.entities.Conversation.create({
    participant_ids: [currentUser.id, recipient.id],
    participant_names: [
      currentUser.display_name || currentUser.full_name?.split(' ')[0] || 'User',
      recipient.name,
    ],
    participant_avatars: [
      currentUser.avatar_url || '',
      recipient.avatar_url || recipient.avatar || '',
    ],
    participant_ages: [currentUser.age_range || '18+', recipient.age_range || '18+'],
    unread_count: { [recipient.id]: 0 },
    request_id: options.request_id ?? null,
    request_title: options.request_title ?? null,
    request_type: options.request_type ?? 'general',
  });
}

export async function findOrCreateDirectConversation(currentUser, recipient, options = {}) {
  const conversations = await dataService.entities.Conversation.list('-updated_date', 100);
  const existing = findDirectConversation(currentUser.id, recipient.id, conversations);
  if (existing) return existing;
  return createDirectConversation(currentUser, recipient, options);
}

export default messagesService;
