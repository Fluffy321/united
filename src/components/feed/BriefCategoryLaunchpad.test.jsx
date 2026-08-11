import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import BriefCategoryLaunchpad from './BriefCategoryLaunchpad';
import { BRIEF_CATEGORIES } from '@/lib/feed/briefCategories';

describe('Brief category launchpad', () => {
  it('shows every category once without stacking category feeds', () => {
    const html = renderToStaticMarkup(
      <BriefCategoryLaunchpad onSelectCategory={() => {}} onClose={() => {}} />
    );

    expect(html).toContain('Choose what you need');
    expect(html.match(/data-category-tile=/g)).toHaveLength(12);
    for (const category of BRIEF_CATEGORIES) {
      expect(html).toContain(`data-category-id="${category.id}"`);
      expect(html).toContain(category.label.replaceAll('&', '&amp;'));
    }
    expect(html).toContain('href="/Settings?section=notifications"');
    expect(html).toContain('Tune your Brief');
    expect(html).not.toContain('category-update-stream');
  });
});
