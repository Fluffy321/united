import { dataService, storageService } from '@/services';

export const AI_AGENT = {
  id: 'united-ai-assistant',
  full_name: 'United AI Assistant',
  display_name: 'United AI',
  avatar_url: null,
  is_ai: true,
  age_range: '18+',
  message_settings: { searchable: true, allowMessagesFrom: 'everyone' },
};

export const AI_CONV_ID_PREFIX = 'ai-conv-';

export function getAIConversationId(userId) {
  return `${AI_CONV_ID_PREFIX}${userId}`;
}

export function isAIConversation(conversation) {
  return conversation?.participant_ids?.includes(AI_AGENT.id);
}

export function buildAIConversation(currentUser) {
  if (!currentUser?.id) return null;
  return {
    id: getAIConversationId(currentUser.id),
    participant_ids: [currentUser.id, AI_AGENT.id],
    participant_names: [currentUser.display_name || currentUser.full_name, AI_AGENT.full_name],
    participant_ages: [currentUser.age_range || '18+', '18+'],
    participant_avatars: [currentUser.avatar_url || null, null],
    last_message: 'Ask a Jewish question — Torah, calendar, davening, or general knowledge.',
    last_message_at: new Date().toISOString(),
    unread_count: {},
    request_type: 'general',
    is_ai_chat: true,
    _pinned: true,
  };
}

const AI_MESSAGES_KEY = (userId) => `ai_messages_${userId}`;

export function loadAIMessages(userId) {
  return storageService.getJson(AI_MESSAGES_KEY(userId), []);
}

export function saveAIMessages(userId, messages) {
  storageService.setJson(AI_MESSAGES_KEY(userId), messages.slice(-100));
}

let lastAIRequestTime = 0;
const AI_REQUEST_COOLDOWN_MS = 2000; // 2 second minimum between requests

export async function getAIReply(userMessage, currentUser, messageHistory = []) {
  const historyContext = messageHistory.slice(-6).map(m =>
    `${m.sender_id === AI_AGENT.id ? 'Assistant' : 'User'}: ${m.content}`
  ).join('\n');

  // Enforce rate limiting with cooldown
  const now = Date.now();
  const timeSinceLastRequest = now - lastAIRequestTime;
  if (timeSinceLastRequest < AI_REQUEST_COOLDOWN_MS) {
    await new Promise(resolve => 
      setTimeout(resolve, AI_REQUEST_COOLDOWN_MS - timeSinceLastRequest)
    );
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      lastAIRequestTime = Date.now();
      const reply = await dataService.integrations.Core.InvokeLLM({
        prompt: `You are the United AI Assistant — a small Jewish-knowledge helper embedded in the "United" app.

Scope:
- Answer general Jewish-knowledge questions about Torah, Tanach, tefillah/davening, the Jewish calendar, holidays, Shabbos, minhagim, Hebrew terms, and broad Jewish practice.
- Do not assert facts about specific local people, shuls, schools, businesses, events, minyanim, or current community activity unless the user provided that information in the conversation.
- If asked about specific local facts you cannot verify, say that you cannot verify it from here and suggest checking the relevant shul, organizer, or community page.
- For practical halacha, do not pasken. Give general background when useful, then clearly tell the user to ask their rav for a ruling.

Be warm, concise, and helpful. Keep responses conversational (1-3 short paragraphs max).
${historyContext ? `\nRecent conversation:\n${historyContext}\n` : ''}
User: ${userMessage}`,
      });
      return reply;
    } catch (error) {
      lastError = error;
      // Rate limit (429) — exponential backoff
      if (error?.status === 429 && attempt < maxRetries - 1) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      // Other errors — don't retry
      throw error;
    }
  }

  throw lastError;
}
