import { supabase } from '@/api/supabaseClient';

const ERROR_MESSAGES = {
  UNAUTHENTICATED: 'Please sign in again.',
  NOT_A_MEMBER: 'Join that community before posting there.',
  RATE_LIMITED: 'You’re posting too quickly—try again shortly.',
  INVALID_COMMAND: 'Check the highlighted details and try again.',
};

async function errorCode(error) {
  try {
    const body = await error?.context?.json?.();
    return body?.code;
  } catch {
    return null;
  }
}

export function createPublishingService(client) {
  const invoke = async (operation, payload = {}) => {
    if (!client?.functions) throw new Error('Publishing is not connected right now. Your draft is still here.');
    const { data, error } = await client.functions.invoke('publish-content', {
      body: { operation, payload },
    });
    if (error) {
      const code = await errorCode(error);
      throw new Error(ERROR_MESSAGES[code] || 'We couldn’t publish that. Your draft is still here.');
    }
    return data;
  };

  return {
    publish: (command) => invoke('publish', command),
    update: (contentId, command) => invoke('update', { contentId, command }),
    end: (contentId) => invoke('end', { contentId }),
    listMine: (cursor = null) => invoke('listMine', { cursor }),
    appeal: (contentId, reason) => invoke('appeal', { contentId, reason }),
  };
}

export const publishingService = createPublishingService(supabase);
