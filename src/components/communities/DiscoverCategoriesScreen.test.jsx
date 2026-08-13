import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import DiscoverCategoryCards, { DISCOVER_CATEGORIES } from './DiscoverCategoriesScreen';

describe('DiscoverCategoryCards', () => {
  it('renders a compact accessible category filter rail', () => {
    const html = renderToStaticMarkup(
      <DiscoverCategoryCards activeCategory="all" onSelectCategory={() => {}} />
    );

    expect(html).toContain('Explore by category');
    expect(html).toContain('>All<');
    DISCOVER_CATEGORIES.forEach(({ label }) => expect(html).toContain(label.replaceAll('&', '&amp;')));
    expect(html).toContain('aria-pressed');
    expect(html).toContain('min-h-11');
    expect(html).not.toContain('Join a room with a reason');
    expect(html).not.toContain('min-w-[178px]');
  });
});
