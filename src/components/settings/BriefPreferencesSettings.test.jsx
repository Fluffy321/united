import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BriefPreferencesForm } from './BriefPreferencesSettings';
import { BRIEF_CATEGORIES } from '@/lib/feed/briefCategories';
import { normalizePreferenceProfile } from '@/lib/feed/feedPreferenceModel';

const renderForm = (preferences = {}) => renderToStaticMarkup(
  <BriefPreferencesForm
    preferences={normalizePreferenceProfile(preferences)}
    onChange={() => {}}
    onSave={() => {}}
    isSaving={false}
  />
);

describe('Brief preference controls', () => {
  it('renders all four explicit states for every category', () => {
    const html = renderForm({ category_preferences: { local: 'hide' } });

    expect(html.match(/data-category-preference=/g)).toHaveLength(12);
    for (const category of BRIEF_CATEGORIES) {
      expect(html).toContain(`data-category-preference="${category.id}"`);
      expect(html).toContain(`aria-label="${category.label.replaceAll('&', '&amp;')} preference"`);
    }
    expect(html).toContain('data-category-value="more"');
    expect(html).toContain('data-category-value="normal"');
    expect(html).toContain('data-category-value="less"');
    expect(html).toContain('data-category-id="local" data-category-value="hide" aria-checked="true"');
  });

  it('keeps the setup controls permanently available', () => {
    const html = renderForm({
      interest_groups: ['local', 'food'],
      engagement_level: 'quiet',
      catch_up_windows: ['daytime'],
    });

    expect(html.match(/data-interest-group=/g)).toHaveLength(9);
    expect(html).toContain('Essentials only');
    expect(html).toContain('A balanced feed');
    expect(html).toContain('Show me everything');
    expect(html).toContain('Morning');
    expect(html).toContain('Daytime');
    expect(html).toContain('Evening');
    expect(html).toContain('Important only');
    expect(html).toContain('Real local emergencies can still appear');
    expect(html).toContain('Save Home preferences');
  });

  it('shows legacy interests as More and preserves Active as the fullest amount', () => {
    const html = renderForm({
      interests: ['events'],
      engagement_level: 'active',
    });

    expect(html).toContain('data-category-id="events" data-category-value="more" aria-checked="true"');
    expect(html).toContain('data-engagement-level="all_in" aria-checked="true"');
  });
});
