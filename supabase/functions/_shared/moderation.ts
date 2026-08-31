export class RetryableModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableModerationError';
  }
}

export type DeterministicChecks = {
  duplicateFlood: boolean;
  possiblePrivateInformation: boolean;
  prohibitedTransaction: boolean;
};

export type SafetyResult = {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
};

export type CommunityRisk = {
  spam: boolean;
  scam: boolean;
  doxxing: boolean;
  harassment: boolean;
  localRelevance: boolean;
  categoryMatch: boolean;
  confidence: number;
  reasons: string[];
};

const PHONE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/;
const STREET_ADDRESS = /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|boulevard|blvd)\b/i;
const PROHIBITED_TRANSACTION = /\b(?:buy|sell|selling|price)\b.{0,50}\b(?:weapon|gun|firearm|controlled substance|fake id)\b/i;

export function runDeterministicChecks(input: { text: string; contentHash?: string; recentHashes?: string[] }): DeterministicChecks {
  const matchingHashes = input.contentHash
    ? (input.recentHashes || []).filter((hash) => hash === input.contentHash).length
    : 0;
  return {
    duplicateFlood: matchingHashes >= 2,
    possiblePrivateInformation: PHONE.test(input.text) && STREET_ADDRESS.test(input.text),
    prohibitedTransaction: PROHIBITED_TRANSACTION.test(input.text),
  };
}

async function openAiJson(
  url: string,
  body: Record<string, unknown>,
  fetcher: typeof fetch,
  apiKey: string,
) {
  if (!apiKey) throw new RetryableModerationError('OpenAI key is not configured');
  let response: Response;
  try {
    response = await fetcher(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    throw new RetryableModerationError(error instanceof Error ? error.message : 'OpenAI request failed');
  }
  if ([408, 409, 429].includes(response.status) || response.status >= 500) {
    throw new RetryableModerationError(`OpenAI retryable status ${response.status}`);
  }
  if (!response.ok) throw new Error(`OpenAI rejected moderation request (${response.status})`);
  try {
    return await response.json();
  } catch {
    throw new RetryableModerationError('OpenAI returned invalid JSON');
  }
}

export async function moderateSafety(
  input: { text: string },
  fetcher: typeof fetch = fetch,
  apiKey = Deno.env.get('OPENAI_API_KEY') || '',
): Promise<SafetyResult> {
  const payload = await openAiJson('https://api.openai.com/v1/moderations', {
    model: 'omni-moderation-latest',
    input: input.text.slice(0, 20_000),
  }, fetcher, apiKey) as { results?: Array<{ flagged?: boolean; categories?: Record<string, boolean>; category_scores?: Record<string, number> }> };
  const result = payload.results?.[0];
  if (!result) throw new RetryableModerationError('OpenAI moderation result was empty');
  return {
    flagged: Boolean(result.flagged),
    categories: result.categories || {},
    scores: result.category_scores || {},
  };
}

function responseOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === 'string') return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      const record = part as { type?: string; text?: string };
      if (record.type === 'output_text' && typeof record.text === 'string') return record.text;
    }
  }
  return '';
}

function isCommunityRisk(value: unknown): value is CommunityRisk {
  const item = value as CommunityRisk;
  return Boolean(item)
    && ['spam', 'scam', 'doxxing', 'harassment', 'localRelevance', 'categoryMatch'].every((key) => typeof item[key as keyof CommunityRisk] === 'boolean')
    && typeof item.confidence === 'number'
    && item.confidence >= 0
    && item.confidence <= 1
    && Array.isArray(item.reasons)
    && item.reasons.every((reason) => typeof reason === 'string');
}

export async function classifyCommunityRisk(
  input: { text: string; publishingType: string; network: string },
  fetcher: typeof fetch = fetch,
  apiKey = Deno.env.get('OPENAI_API_KEY') || '',
  model = Deno.env.get('OPENAI_CLASSIFIER_MODEL') || '',
): Promise<CommunityRisk> {
  if (!model) throw new RetryableModerationError('OpenAI classifier model is not configured');
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      spam: { type: 'boolean' },
      scam: { type: 'boolean' },
      doxxing: { type: 'boolean' },
      harassment: { type: 'boolean' },
      localRelevance: { type: 'boolean' },
      categoryMatch: { type: 'boolean' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      reasons: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    },
    required: ['spam', 'scam', 'doxxing', 'harassment', 'localRelevance', 'categoryMatch', 'confidence', 'reasons'],
  };
  const payload = await openAiJson('https://api.openai.com/v1/responses', {
    model,
    instructions: 'Review a local Jewish community app post. Be conservative. Flag only evidence in the supplied post. Do not judge religious viewpoints or mark factual claims verified.',
    input: `Publishing type: ${input.publishingType}\nLocal network: ${input.network}\nPost:\n${input.text.slice(0, 12_000)}`,
    text: { format: { type: 'json_schema', name: 'junited_community_risk', strict: true, schema } },
  }, fetcher, apiKey) as Record<string, unknown>;
  const text = responseOutputText(payload);
  try {
    const result = JSON.parse(text);
    if (!isCommunityRisk(result)) throw new Error('schema mismatch');
    return result;
  } catch {
    throw new RetryableModerationError('OpenAI classifier output did not match the required schema');
  }
}

export function decideModeration(input: {
  deterministic: DeterministicChecks;
  safety: SafetyResult;
  classifier: CommunityRisk;
}) {
  const { deterministic, safety, classifier } = input;
  const highSafetyRisk = (safety.categories['sexual/minors'] && (safety.scores['sexual/minors'] || 0) >= 0.2)
    || (safety.categories['self-harm/instructions'] && (safety.scores['self-harm/instructions'] || 0) >= 0.75)
    || (safety.categories['violence/threatening'] && (safety.scores['violence/threatening'] || 0) >= 0.85)
    || (safety.categories['harassment/threatening'] && (safety.scores['harassment/threatening'] || 0) >= 0.9);
  const highCommunityRisk = classifier.confidence >= 0.9 && (
    classifier.doxxing
    || classifier.scam
    || (classifier.spam && deterministic.duplicateFlood)
  );

  if (highSafetyRisk || highCommunityRisk) {
    return { action: 'temporarily_hidden' as const, reasons: classifier.reasons, confidence: classifier.confidence };
  }
  const needsReview = safety.flagged
    || deterministic.duplicateFlood
    || deterministic.possiblePrivateInformation
    || deterministic.prohibitedTransaction
    || classifier.spam
    || classifier.scam
    || classifier.doxxing
    || classifier.harassment
    || !classifier.categoryMatch;
  if (needsReview) {
    return { action: 'needs_review' as const, reasons: classifier.reasons, confidence: classifier.confidence };
  }
  return { action: 'clear' as const, reasons: [] as string[], confidence: classifier.confidence };
}
