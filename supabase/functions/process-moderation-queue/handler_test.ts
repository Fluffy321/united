import { assertEquals } from 'jsr:@std/assert@1';
import { RetryableModerationError } from '../_shared/moderation.ts';
import { handleModerationQueue, type ModerationJob } from './handler.ts';

const job: ModerationJob = {
  id: 'job-1',
  content_type: 'post',
  content_id: 'post-1',
  publishing_type: 'local_news',
  network: 'Five Towns',
  content_snapshot: 'Road work begins Monday.',
  content_hash: 'hash-1',
  recent_hashes: [],
};

function request(token = 'worker-secret') {
  return new Request('http://localhost/functions/v1/process-moderation-queue', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

Deno.test('worker rejects unauthenticated requests', async () => {
  const response = await handleModerationQueue(request(''), {
    allowedTokens: ['worker-secret'],
    claimJobs: async () => [],
    reviewJob: async () => ({ action: 'clear', reasons: [], confidence: 1, provider: {} }),
    recordResult: async () => {},
  });

  assertEquals(response.status, 401);
});

Deno.test('worker records an independent result for every claimed job', async () => {
  const recorded: Array<Record<string, unknown>> = [];
  const response = await handleModerationQueue(request(), {
    allowedTokens: ['worker-secret'],
    claimJobs: async (limit: number) => {
      assertEquals(limit, 20);
      return [job, { ...job, id: 'job-2', content_id: 'post-2' }];
    },
    reviewJob: async () => ({ action: 'clear', reasons: [], confidence: 0.98, provider: { safetyModel: 'omni-moderation-latest' } }),
    recordResult: async (result: Record<string, unknown>) => { recorded.push(result); },
  });

  assertEquals(response.status, 200);
  assertEquals(recorded.map((item) => item.jobId), ['job-1', 'job-2']);
  assertEquals(await response.json(), { claimed: 2, cleared: 2, review: 0, hidden: 0, retried: 0, failed: 0 });
});

Deno.test('provider outages are recorded for retry and do not hide content', async () => {
  const recorded: Array<Record<string, unknown>> = [];
  const response = await handleModerationQueue(request(), {
    allowedTokens: ['worker-secret'],
    claimJobs: async () => [job],
    reviewJob: async () => { throw new RetryableModerationError('OpenAI 429'); },
    recordResult: async (result: Record<string, unknown>) => { recorded.push(result); },
  });

  assertEquals(recorded[0].status, 'failed_retryable');
  assertEquals(recorded[0].action, 'none');
  assertEquals(await response.json(), { claimed: 1, cleared: 0, review: 0, hidden: 0, retried: 1, failed: 0 });
});

Deno.test('one broken job does not stop the rest of the batch', async () => {
  const response = await handleModerationQueue(request(), {
    allowedTokens: ['worker-secret'],
    claimJobs: async () => [job, { ...job, id: 'job-2' }],
    reviewJob: async (item: typeof job) => {
      if (item.id === 'job-1') throw new Error('bad snapshot');
      return { action: 'needs_review', reasons: ['Category mismatch'], confidence: 0.7, provider: {} };
    },
    recordResult: async () => {},
  });

  assertEquals(await response.json(), { claimed: 2, cleared: 0, review: 1, hidden: 0, retried: 0, failed: 1 });
});
