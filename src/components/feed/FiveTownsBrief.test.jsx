import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FiveTownsBrief, { buildBriefingItems } from './FiveTownsBrief';

const rankedItems = [
  {
    id: 'local-1',
    title: 'Road work begins on Central Avenue',
    category_id: 'local',
    community_name: 'Cedarhurst',
  },
  {
    id: 'help-1',
    title: 'A family needs a ride this afternoon',
    category_id: 'helping',
    location_text: 'Woodmere',
  },
  {
    id: 'event-1',
    title: 'Community blood drive tonight',
    category_id: 'events',
    source_label: 'Community desk',
  },
  {
    id: 'fourth',
    title: 'This item must stay out of the preview',
    category_id: 'sports_social',
  },
];

describe('Daily Brief preview data', () => {
  it('keeps no more than three distinct truthful items', () => {
    expect(buildBriefingItems([...rankedItems, rankedItems[0]])).toEqual([
      expect.objectContaining({ id: 'local-1', categoryLabel: 'Local Updates', context: 'Cedarhurst' }),
      expect.objectContaining({ id: 'help-1', categoryLabel: 'Helping', context: 'Woodmere' }),
      expect.objectContaining({ id: 'event-1', categoryLabel: 'Events', context: 'Community desk' }),
    ]);
  });

  it('drops rows that do not have a real ID or readable title', () => {
    expect(buildBriefingItems([
      { id: null, title: 'No source identity' },
      { id: 'blank', title: '   ' },
      { id: 'real', body: 'A useful body-only update', category_id: 'local' },
    ])).toEqual([
      expect.objectContaining({ id: 'real', title: 'A useful body-only update' }),
    ]);
  });
});

describe('Daily Brief mobile card', () => {
  it('renders the approved three-row preview with accessible actions', () => {
    const html = renderToStaticMarkup(
      <FiveTownsBrief
        items={rankedItems}
        networkLabel="Five Towns"
        onOpenBrief={() => {}}
        onOpenItem={() => {}}
      />
    );

    expect(html).toContain('Your Daily Brief');
    expect(html).toContain('Five Towns');
    expect(html.match(/data-brief-item=/g)).toHaveLength(3);
    expect(html).toContain('Local Updates');
    expect(html).toContain('Cedarhurst');
    expect(html).toContain('Open Brief');
    expect(html).toContain('aria-label="Open brief item: Road work begins on Central Avenue"');
    expect(html).toContain('aria-label="Open your complete Daily Brief"');
  });

  it('renders a truthful empty state without legacy or fabricated modules', () => {
    const html = renderToStaticMarkup(
      <FiveTownsBrief items={[]} networkLabel="Your community" onOpenBrief={() => {}} />
    );

    expect(html).toContain('No trusted updates are ready yet');
    expect(html).toContain('Check back soon or share what your community should know.');
    expect(html).not.toContain('Why these three?');
    expect(html).not.toContain('Today’s mitzvah');
    expect(html).not.toContain('Explore today');
    expect(html).not.toContain('Community progress');
    expect(html).not.toContain('engagement slider');
    expect(html).not.toContain('Previous slide');
  });
});
