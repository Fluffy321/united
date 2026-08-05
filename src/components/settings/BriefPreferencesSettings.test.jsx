import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BriefPreferencesForm } from './BriefPreferencesSettings';
import { BRIEF_CATEGORIES, DEFAULT_BRIEF_CATEGORY_IDS } from '@/lib/feed/briefCategories';

describe('Brief preference controls', () => {
  it('renders every category and all four permanently adjustable engagement choices', () => {
    const html = renderToStaticMarkup(
      <BriefPreferencesForm
        interests={DEFAULT_BRIEF_CATEGORY_IDS}
        engagementLevel="balanced"
        onToggleInterest={() => {}}
        onEngagementChange={() => {}}
        onSave={() => {}}
        isSaving={false}
      />
    );

    expect(html.match(/data-brief-interest=/g)).toHaveLength(12);
    for (const category of BRIEF_CATEGORIES) {
      expect(html).toContain(`data-brief-interest="${category.id}"`);
    }
    expect(html).toContain('Quiet');
    expect(html).toContain('Essential updates and emergency alerts.');
    expect(html).toContain('Balanced');
    expect(html).toContain('The default daily rhythm.');
    expect(html).toContain('Active');
    expect(html).toContain('More prompts and community activity.');
    expect(html).toContain('All-in');
    expect(html).toContain('The fullest non-emergency update volume.');
    expect(html).toContain('Change this anytime.');
    expect(html).toContain('Emergency alerts are unaffected.');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('Save Brief preferences');
  });
});
