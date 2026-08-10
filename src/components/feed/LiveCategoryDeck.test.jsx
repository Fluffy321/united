import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LiveCategoryDeck from './LiveCategoryDeck';
import { getBriefCategory } from '@/lib/feed/briefCategories';

describe('LiveCategoryDeck', () => {
  it('shows real leads and honest empty actions in a two-row deck', () => {
    const html = renderToStaticMarkup(
      <LiveCategoryDeck
        leads={[
          {
            category: getBriefCategory('helping'),
            item: { id: 'help-2', title: 'A neighbor needs a ride before 4 PM' },
            count: 3,
            stateLabel: '3 current',
          },
          {
            category: getBriefCategory('minyanim'),
            item: null,
            count: 0,
          },
        ]}
      />
    );

    expect(html).toContain('Across your community');
    expect(html).toContain('grid-rows-2');
    expect(html).toContain('A neighbor needs a ride before 4 PM');
    expect(html).toContain('3 current');
    expect(html).toContain('Find a minyan nearby');
    expect(html).toContain('aria-label="Open Helping: A neighbor needs a ride before 4 PM"');
    expect(html).not.toContain('0 posts');
    expect(html).not.toContain('0 new');
    expect(html).not.toContain('Nothing here');
  });

  it('renders one card for every supplied category in the supplied order', () => {
    const leads = ['local', 'events', 'kosher_food'].map((id) => ({
      category: getBriefCategory(id),
      item: null,
      count: 0,
    }));
    const html = renderToStaticMarkup(<LiveCategoryDeck leads={leads} />);

    expect(html.indexOf('Local')).toBeLessThan(html.indexOf('Events'));
    expect(html.indexOf('Events')).toBeLessThan(html.indexOf('Kosher Food'));
    expect((html.match(/data-live-category=/g) || [])).toHaveLength(3);
  });
});
