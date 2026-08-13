import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import BriefCategorySection from './BriefCategorySection';
import { getBriefCategory } from '@/lib/feed/briefCategories';

vi.mock('./UnifiedPostCard', () => ({
  default: () => null,
}));

describe('Focused Brief category section', () => {
  it('shows one category, all tabs, and only the selected panel', () => {
    const category = getBriefCategory('minyanim');
    const html = renderToStaticMarkup(
      <BriefCategorySection
        category={category}
        posts={[]}
        activeTab="discuss"
        onTabChange={() => {}}
        onBack={() => {}}
        onOpenPost={() => {}}
        onAction={() => {}}
      />
    );

    expect(html).toContain('Minyanim');
    expect(html).toContain('Updates');
    expect(html).toContain('Discuss');
    expect(html).toContain('Directory');
    expect(html).toContain('data-category-panel="discuss"');
    expect(html).not.toContain('data-category-panel="updates"');
    expect(html).not.toContain('data-category-panel="directory"');
    expect(html).toContain('Find a minyan');
    expect(html).toContain('Share a minyan');
    expect(html).not.toContain('Kosher Food');
  });

  it('gives the directory an honest next action when structured data is unavailable', () => {
    const html = renderToStaticMarkup(
      <BriefCategorySection
        category={getBriefCategory('local')}
        posts={[]}
        activeTab="directory"
        onTabChange={() => {}}
        onBack={() => {}}
        onOpenDirectory={() => {}}
        onAction={() => {}}
      />
    );

    expect(html).toContain('data-category-panel="directory"');
    expect(html).toContain('A structured Local Updates directory is not available yet.');
    expect(html).toContain('Open the community map');
  });

  it('renders Helping as private coordination with truthful open activity', () => {
    const html = renderToStaticMarkup(
      <BriefCategorySection
        category={getBriefCategory('helping')}
        posts={[
          { id: 'need-1', type: 'help', title: 'Driver needed', status: 'open' },
          { id: 'need-2', type: 'help', title: 'Meal route filled', status: 'filled' },
        ]}
        activeTab="updates"
        onBack={() => {}}
        onAction={() => {}}
        onOpenPost={() => {}}
      />
    );

    expect(html).toContain('Private coordination');
    expect(html).toContain('1 open');
    expect(html).not.toContain('2 open');
    expect(html).toContain('Ask for help');
    expect(html).toContain('Offer help');
  });

  it('does not invent activity counts for an empty category', () => {
    const html = renderToStaticMarkup(
      <BriefCategorySection
        category={getBriefCategory('events')}
        posts={[]}
        activeTab="updates"
        onBack={() => {}}
        onAction={() => {}}
        onOpenPost={() => {}}
      />
    );

    expect(html).toContain('No current activity');
    expect(html).not.toContain('0 open');
    expect(html).not.toContain('0 updates');
  });
});
