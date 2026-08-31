import { describe, expect, it, vi } from 'vitest';
import { createPublishingService } from './publishingService';

const createClient = (response = { data: { contentId: 'post-1' }, error: null }) => ({
  functions: { invoke: vi.fn().mockResolvedValue(response) },
});

describe('publishingService', () => {
  it('publishes through the one server function without adding identity fields', async () => {
    const client = createClient();
    const service = createPublishingService(client);
    const command = { submissionKey: 'key-1', publishingType: 'local_news' };

    await expect(service.publish(command)).resolves.toEqual({ contentId: 'post-1' });
    expect(client.functions.invoke).toHaveBeenCalledWith('publish-content', {
      body: { operation: 'publish', payload: command },
    });
    expect(client.functions.invoke.mock.calls[0][1].body.payload).not.toHaveProperty('authorId');
  });

  it('keeps the same submission key when a retry is made', async () => {
    const client = createClient();
    const service = createPublishingService(client);
    const command = { submissionKey: 'stable-key', publishingType: 'help_need' };

    await service.publish(command);
    await service.publish(command);

    expect(client.functions.invoke.mock.calls.map((call) => call[1].body.payload.submissionKey)).toEqual([
      'stable-key',
      'stable-key',
    ]);
  });

  it('uses the authenticated publishing boundary for admin moderation work', async () => {
    const client = createClient({ data: { items: [], health: { pending: 0 } }, error: null });
    const service = createPublishingService(client);

    await service.listModerationQueue({ status: 'needs_review' });
    await service.getModerationHealth();
    await service.decideModeration('job-1', 'restore', 'Reviewed by Aryeh');

    expect(client.functions.invoke.mock.calls.map((call) => call[1].body)).toEqual([
      { operation: 'adminQueue', payload: { status: 'needs_review' } },
      { operation: 'adminHealth', payload: {} },
      {
        operation: 'adminDecide',
        payload: { jobId: 'job-1', decision: 'restore', reason: 'Reviewed by Aryeh' },
      },
    ]);
  });

  it.each([
    ['UNAUTHENTICATED', 'Please sign in again.'],
    ['NOT_A_MEMBER', 'Join that community before posting there.'],
    ['RATE_LIMITED', 'You’re posting too quickly—try again shortly.'],
  ])('turns %s into a clear user message', async (code, message) => {
    const client = createClient({ data: null, error: { context: { json: () => Promise.resolve({ code }) } } });
    const service = createPublishingService(client);

    await expect(service.publish({ submissionKey: 'key' })).rejects.toThrow(message);
  });
});
