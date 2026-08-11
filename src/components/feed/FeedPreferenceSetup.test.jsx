import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETUP_DRAFT } from '@/lib/feed/feedPreferenceModel';
import { FeedPreferenceSetupView } from './FeedPreferenceSetup';

const renderView = (props = {}) => renderToStaticMarkup(
  <FeedPreferenceSetupView
    step={0}
    draft={DEFAULT_SETUP_DRAFT}
    status="idle"
    onAction={() => {}}
    {...props}
  />
);

describe('FeedPreferenceSetupView', () => {
  it('renders the approved nine-interest first step with two defaults selected', () => {
    const html = renderView();

    expect(html.match(/data-interest-group=/g)).toHaveLength(9);
    expect(html).toContain('1 of 3');
    expect(html).toContain('data-interest-group="local"');
    expect(html).toContain('data-interest-group="plans"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(2);
    expect(html).toContain('You can still find everything');
  });

  it('renders the saved draft on review', () => {
    const html = renderView({
      step: 3,
      draft: {
        interest_groups: ['food'],
        engagement_level: 'quiet',
        catch_up_windows: ['daytime'],
      },
    });

    expect(html).toContain('Food and openings');
    expect(html).toContain('Essentials only');
    expect(html).toContain('Daytime');
    expect(html).toContain('Save and open Home');
  });

  it('keeps navigation simple across the short flow', () => {
    expect(renderView({ step: 0 })).toContain('Skip');
    expect(renderView({ step: 1 })).toContain('Back');
    expect(renderView({ step: 2 })).toContain('Review');
    expect(renderView({ step: 3 })).not.toContain('Skip setup');
  });

  it('uses accessible timing toggles and straight-up safety copy', () => {
    const html = renderView({ step: 2 });

    expect(html.match(/data-catch-up-window=/g)).toHaveLength(4);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('This does not turn on notifications');
    expect(html).toContain('Real local emergencies can still appear');
  });

  it('keeps the choices visible and offers retry after a save error', () => {
    const html = renderView({
      step: 3,
      status: 'error',
      draft: {
        interest_groups: ['food'],
        engagement_level: 'balanced',
        catch_up_windows: ['morning'],
      },
    });

    expect(html).toContain('Could not save your preferences. Your choices are still here.');
    expect(html).toContain('Retry');
    expect(html).toContain('Food and openings');
  });

  it('disables repeat saving while pending', () => {
    const html = renderView({ step: 3, status: 'pending' });

    expect(html).toContain('Saving…');
    expect(html).toContain('disabled=""');
  });
});
