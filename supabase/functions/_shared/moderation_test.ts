import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import {
  RetryableModerationError,
  classifyCommunityRisk,
  decideModeration,
  moderateSafety,
  runDeterministicChecks,
} from './moderation.ts';

const harmlessModeration = {
  results: [{
    flagged: false,
    categories: { harassment: false, violence: false },
    category_scores: { harassment: 0.001, violence: 0.002 },
  }],
};

Deno.test('deterministic checks detect repeated flooding and exposed private data', () => {
  const text = 'Call Sarah at 516-555-1212. Her home address is 12 Cedar Lane.';
  const checks = runDeterministicChecks({ text, contentHash: 'same', recentHashes: ['same', 'same'] });

  assertEquals(checks.duplicateFlood, true);
  assertEquals(checks.possiblePrivateInformation, true);
});

Deno.test('OpenAI safety moderation uses omni-moderation-latest and returns structured scores', async () => {
  let requestBody: Record<string, unknown> = {};
  const fetcher: typeof fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(harmlessModeration), { status: 200 });
  };

  const result = await moderateSafety({ text: 'Community barbecue Sunday.' }, fetcher, 'test-key');

  assertEquals(requestBody?.model, 'omni-moderation-latest');
  assertEquals(result.flagged, false);
  assertEquals(result.scores.violence, 0.002);
});

Deno.test('provider throttling is retryable and never treated as a safety decision', async () => {
  const fetcher: typeof fetch = async () => new Response('slow down', { status: 429 });

  await assertRejects(
    () => moderateSafety({ text: 'hello' }, fetcher, 'test-key'),
    RetryableModerationError,
  );
});

Deno.test('community classifier requests strict JSON and parses the response output', async () => {
  const fetcher: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    assertEquals(body.text.format.type, 'json_schema');
    return new Response(JSON.stringify({
      output: [{ content: [{ type: 'output_text', text: JSON.stringify({
        spam: false,
        scam: false,
        doxxing: false,
        harassment: false,
        localRelevance: true,
        categoryMatch: true,
        confidence: 0.92,
        reasons: [],
      }) }] }],
    }), { status: 200 });
  };

  const result = await classifyCommunityRisk(
    { text: 'Road work begins Monday.', publishingType: 'road_traffic', network: 'Five Towns' },
    fetcher,
    'test-key',
    'test-model',
  );

  assertEquals(result.confidence, 0.92);
  assertEquals(result.categoryMatch, true);
});

Deno.test('only explicit high-risk evidence can auto-hide', () => {
  assertEquals(decideModeration({
    deterministic: { duplicateFlood: false, possiblePrivateInformation: false, prohibitedTransaction: false },
    safety: { flagged: true, categories: { 'violence/threatening': true }, scores: { 'violence/threatening': 0.96 } },
    classifier: { spam: false, scam: false, doxxing: false, harassment: false, localRelevance: true, categoryMatch: true, confidence: 0.9, reasons: ['Credible threat'] },
  }).action, 'temporarily_hidden');

  assertEquals(decideModeration({
    deterministic: { duplicateFlood: false, possiblePrivateInformation: false, prohibitedTransaction: false },
    safety: { flagged: false, categories: {}, scores: {} },
    classifier: { spam: false, scam: false, doxxing: false, harassment: true, localRelevance: true, categoryMatch: true, confidence: 0.51, reasons: ['Tone may be insulting'] },
  }).action, 'needs_review');

  assertEquals(decideModeration({
    deterministic: { duplicateFlood: false, possiblePrivateInformation: false, prohibitedTransaction: false },
    safety: { flagged: false, categories: {}, scores: {} },
    classifier: { spam: false, scam: false, doxxing: false, harassment: false, localRelevance: true, categoryMatch: true, confidence: 0.98, reasons: [] },
  }).action, 'clear');
});

Deno.test('high-confidence doxxing is hidden while raw private-info and flooding signals are reviewed', () => {
  const base = { safety: { flagged: false, categories: {}, scores: {} }, classifier: { spam: false, scam: false, doxxing: false, harassment: false, localRelevance: true, categoryMatch: true, confidence: 0.9, reasons: [] } };

  assertEquals(decideModeration({ ...base, classifier: { ...base.classifier, doxxing: true, confidence: 0.96 }, deterministic: { duplicateFlood: false, possiblePrivateInformation: true, prohibitedTransaction: false } }).action, 'temporarily_hidden');
  assertEquals(decideModeration({ ...base, deterministic: { duplicateFlood: false, possiblePrivateInformation: true, prohibitedTransaction: false } }).action, 'needs_review');
  assertEquals(decideModeration({ ...base, deterministic: { duplicateFlood: true, possiblePrivateInformation: false, prohibitedTransaction: false } }).action, 'needs_review');
});
