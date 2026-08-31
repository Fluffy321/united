import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AiModerationPanel from './AiModerationPanel';

const item = {
  id: 'job-1',
  contentPreview: 'Community update awaiting review.',
  authorName: 'Sarah Levy',
  audienceLabel: 'Five Towns',
  publishingTypeLabel: 'Community announcement',
  moderationStatus: 'needs_review',
  aiReason: 'The category may not match the post.',
  confidence: 0.71,
  provider: 'OpenAI',
  model: 'community-risk-v1',
  policyVersion: 'JUnited safety 1.0',
};

describe('AiModerationPanel', () => {
  it('shows queue health in plain language above the work', () => {
    const html = renderToStaticMarkup(
      <AiModerationPanel
        title="Needs review"
        items={[item]}
        health={{ pending: 4, oldestMinutes: 18, retrying: 1, failed: 0 }}
        onDecision={() => {}}
      />
    );

    expect(html).toContain('4 waiting');
    expect(html).toContain('Oldest 18m');
    expect(html).toContain('1 retrying');
    expect(html).toContain('0 failed');
    expect(html).toContain('Sarah Levy');
  });

  it('gives a useful empty state instead of a blank screen', () => {
    const html = renderToStaticMarkup(
      <AiModerationPanel title="AI hidden" items={[]} health={{ pending: 0 }} onDecision={() => {}} />
    );

    expect(html).toContain('Nothing here right now');
    expect(html).toContain('New cases will show up here automatically.');
  });

  it('does not pretend a failed queue is empty', () => {
    const html = renderToStaticMarkup(
      <AiModerationPanel title="Needs review" items={[]} error={new Error('offline')} onRetry={() => {}} onDecision={() => {}} />
    );

    expect(html).toContain('Couldn’t load this queue');
    expect(html).toContain('Try again');
    expect(html).not.toContain('Nothing here right now');
  });
});
