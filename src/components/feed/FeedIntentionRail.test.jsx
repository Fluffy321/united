import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FeedIntentionRail from './FeedIntentionRail';

describe('Feed intention rail', () => {
  it('renders five reachable mobile actions in the approved order', () => {
    const html = renderToStaticMarkup(<FeedIntentionRail onSelect={() => {}} />);

    expect(html.match(/data-feed-intention=/g)).toHaveLength(5);
    expect(html).toMatch(/Ask[\s\S]*Share[\s\S]*Need[\s\S]*Offer[\s\S]*Plan/);
    expect(html.match(/min-h-11/g)).toHaveLength(5);
    expect(html).toContain('aria-label="Ask your community"');
    expect(html).toContain('aria-label="Share with your community"');
    expect(html).toContain('overflow-x-auto');
  });
});
