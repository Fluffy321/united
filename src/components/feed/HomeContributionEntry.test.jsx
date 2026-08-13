import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomeContributionEntry, { ContributionOptions } from './HomeContributionEntry';
import { FEED_INTENTIONS, getFeedIntention } from '@/lib/feed/feedIntentions';

describe('HomeContributionEntry', () => {
  it('shows one contribution entry instead of five competing prompts', () => {
    const html = renderToStaticMarkup(<HomeContributionEntry onSelect={() => {}} />);

    expect(html.match(/Share with your community/g)).toHaveLength(1);
    expect(html).toContain('Ask, offer help, post an update, or make a plan');
    expect(html).not.toContain('data-feed-intention');
  });

  it('keeps all five existing intentions in the chooser', () => {
    const html = renderToStaticMarkup(
      <ContributionOptions intentions={FEED_INTENTIONS} onSelect={() => {}} />
    );

    for (const intention of FEED_INTENTIONS) {
      expect(html).toContain(`data-feed-intention="${intention.id}"`);
      expect(html).toContain(intention.label);
      expect(html).toContain(`aria-label="${intention.ariaLabel}"`);
    }
  });

  it('preserves the real Need composer contract', () => {
    expect(getFeedIntention('need').composer).toEqual({
      type: 'help',
      subtype: 'need_help',
      initialBody: '',
    });
  });
});
