import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  classifyCommunityRisk,
  decideModeration,
  moderateSafety,
  runDeterministicChecks,
} from '../_shared/moderation.ts';
import { handleModerationQueue, type ModerationJob } from './handler.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';
const cronSecret = Deno.env.get('MODERATION_CRON_SECRET') || '';
const openAiKey = Deno.env.get('OPENAI_API_KEY') || '';
const classifierModel = Deno.env.get('OPENAI_CLASSIFIER_MODEL') || '';
const allowedTokens = [...new Set([serviceKey, cronSecret].filter(Boolean))];
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function reviewJob(job: ModerationJob) {
  const deterministic = runDeterministicChecks({
    text: job.content_snapshot,
    contentHash: job.content_hash,
    recentHashes: job.recent_hashes,
  });
  const [safety, classifier] = await Promise.all([
    moderateSafety({ text: job.content_snapshot }, fetch, openAiKey),
    classifyCommunityRisk({
      text: job.content_snapshot,
      publishingType: job.publishing_type,
      network: job.network,
    }, fetch, openAiKey, classifierModel),
  ]);
  const decision = decideModeration({ deterministic, safety, classifier });
  return {
    ...decision,
    provider: {
      safetyModel: 'omni-moderation-latest',
      classifierModel,
      policyVersion: 'junited-2026-08-18-v1',
      safetyCategories: safety.categories,
      safetyScores: safety.scores,
      classifier,
      deterministic,
    },
  };
}

Deno.serve((request) => handleModerationQueue(request, {
  allowedTokens,
  claimJobs: async (limit) => {
    const { data, error } = await supabase.rpc('claim_moderation_jobs', { p_limit: limit });
    if (error) throw error;
    return (data || []) as ModerationJob[];
  },
  reviewJob,
  recordResult: async (result) => {
    const { error } = await supabase.rpc('record_moderation_result', { p_result: result });
    if (error) throw error;
  },
}));
