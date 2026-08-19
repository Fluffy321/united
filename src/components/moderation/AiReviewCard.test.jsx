import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AiReviewCard, { createAdminDecision } from './AiReviewCard';

const review = {
  id: 'job-1',
  contentPreview: 'Road closed near Central Avenue until noon.',
  authorName: 'David Cohen',
  audienceLabel: 'Five Towns',
  publishingTypeLabel: 'Road or traffic update',
  moderationStatus: 'temporarily_hidden',
  aiReason: 'The post may include private location details.',
  confidence: 0.93,
  provider: 'OpenAI',
  model: 'community-risk-v1',
  policyVersion: 'JUnited safety 1.0',
  sourceUrl: 'https://example.com/road-closure',
};

describe('AiReviewCard', () => {
  it('shows the evidence and makes clear that AI did not make the final decision', () => {
    const html = renderToStaticMarkup(<AiReviewCard review={review} onDecision={() => {}} />);

    expect(html).toContain('AI flagged this because');
    expect(html).toContain('The post may include private location details.');
    expect(html).toContain('David Cohen');
    expect(html).toContain('Five Towns');
    expect(html).toContain('93%');
    expect(html).toContain('community-risk-v1');
    expect(html).toContain('JUnited safety 1.0');
    expect(html).toContain('Final decision: Aryeh or Jonny');
    expect(html).toContain('href="https://example.com/road-closure"');
  });

  it('offers the three human decisions with iPhone-sized controls', () => {
    const html = renderToStaticMarkup(<AiReviewCard review={review} onDecision={() => {}} />);

    expect(html).toContain('Restore');
    expect(html).toContain('Keep hidden');
    expect(html).toContain('Remove');
    expect(html.match(/min-h-11/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it('requires a real reason for permanent removal but supplies a clear restore audit reason', () => {
    expect(createAdminDecision('remove', '')).toEqual({
      valid: false,
      error: 'Add a reason before permanently removing this post.',
    });
    expect(createAdminDecision('restore', '')).toEqual({
      valid: true,
      decision: 'restore',
      reason: 'Reviewed by a platform admin and restored.',
    });
  });

  it('puts the member’s appeal above the AI explanation', () => {
    const html = renderToStaticMarkup(<AiReviewCard review={{ ...review, appealReason: 'The town website confirms this closure.' }} onDecision={() => {}} />);

    expect(html).toContain('Member appeal');
    expect(html).toContain('The town website confirms this closure.');
    expect(html.indexOf('Member appeal')).toBeLessThan(html.indexOf('AI flagged this because'));
  });
});
