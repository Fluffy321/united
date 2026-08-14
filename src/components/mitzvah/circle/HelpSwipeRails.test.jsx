import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HelpSwipeRails from './HelpSwipeRails';

const posts = [
  { id: 'need-1', direction: 'need', title: 'Ride to an appointment', category: 'Transportation', urgency: 'Today', neighborhood: 'Woodmere' },
  { id: 'offer-1', direction: 'offer', title: 'Available for grocery runs', category: 'Errands', urgency: 'Flexible', neighborhood: 'Cedarhurst' },
];

describe('HelpSwipeRails', () => {
  it('renders separate swipeable public need and offer rows', () => {
    const html = renderToStaticMarkup(<HelpSwipeRails requests={posts} />);

    expect(html).toContain('Help needed');
    expect(html).toContain('Help offered');
    expect(html).toContain('Post a need');
    expect(html).toContain('Offer help');
    expect(html).toContain('snap-x');
    expect(html).toContain('Ride to an appointment');
    expect(html).toContain('Available for grocery runs');
    expect(html.match(/data-help-direction=/g)).toHaveLength(2);
  });

  it('uses compact honest cards when either public row is empty', () => {
    const html = renderToStaticMarkup(<HelpSwipeRails requests={[]} />);

    expect(html).toContain('No public needs right now');
    expect(html).toContain('No public offers yet');
    expect(html).not.toContain('Ready for the first chesed request');
  });
});
