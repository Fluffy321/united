import { RetryableModerationError } from '../_shared/moderation.ts';

export type ModerationJob = {
  id: string;
  content_type: string;
  content_id: string;
  publishing_type: string;
  network: string;
  content_snapshot: string;
  content_hash: string;
  recent_hashes: string[];
};

export type ReviewResult = {
  action: 'clear' | 'needs_review' | 'temporarily_hidden';
  reasons: string[];
  confidence: number;
  provider: Record<string, unknown>;
};

export type WorkerDependencies = {
  allowedTokens: string[];
  claimJobs: (limit: number) => Promise<ModerationJob[]>;
  reviewJob: (job: ModerationJob) => Promise<ReviewResult>;
  recordResult: (result: Record<string, unknown>) => Promise<void>;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function requestToken(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  return request.headers.get('x-cron-secret')?.trim()
    || request.headers.get('apikey')?.trim()
    || authorization.replace(/^Bearer\s+/i, '').trim();
}

export async function handleModerationQueue(request: Request, deps: WorkerDependencies) {
  const token = requestToken(request);
  if (!token || !deps.allowedTokens.includes(token)) {
    return json({ code: 'UNAUTHORIZED', message: 'Worker authorization required.' }, 401);
  }

  const summary = { claimed: 0, cleared: 0, review: 0, hidden: 0, retried: 0, failed: 0 };
  const jobs = (await deps.claimJobs(20)).slice(0, 20);
  summary.claimed = jobs.length;

  for (const job of jobs) {
    try {
      const decision = await deps.reviewJob(job);
      const status = decision.action === 'clear'
        ? 'cleared'
        : decision.action === 'needs_review'
          ? 'review'
          : 'auto_hidden';
      await deps.recordResult({
        jobId: job.id,
        status,
        action: decision.action,
        reasons: decision.reasons,
        confidence: decision.confidence,
        provider: decision.provider,
      });
      if (decision.action === 'clear') summary.cleared += 1;
      else if (decision.action === 'needs_review') summary.review += 1;
      else summary.hidden += 1;
    } catch (error) {
      const retryable = error instanceof RetryableModerationError;
      try {
        await deps.recordResult({
          jobId: job.id,
          status: retryable ? 'failed_retryable' : 'failed',
          action: 'none',
          reasons: [retryable ? 'AI provider unavailable; queued for retry.' : 'Moderation job could not be processed.'],
          confidence: 0,
          provider: {},
        });
      } catch {
        // The claim lease in Postgres makes an unrecorded job eligible again.
      }
      if (retryable) summary.retried += 1;
      else summary.failed += 1;
    }
  }

  return json(summary);
}
