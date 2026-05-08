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
    const message = await dataService.entities.Message.create(payload);
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

export default messagesService;
