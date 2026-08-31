import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomeTonight from './HomeTonight';

describe('HomeTonight', () => {
  it('renders real tonight details and all event actions', () => {
    const html = renderToStaticMarkup(<HomeTonight window={{
      mode: 'tonight',
      items: [{
        id: 'e1',
        title: 'Community shiur',
        event_date: '2026-08-31',
        event_time: '8:00 PM',
        location_text: 'Cedarhurst',
      }],
    }} />);

    expect(html).toContain('Happening tonight');
    expect(html).toContain('Community shiur');
    expect(html).toContain('8:00 PM');
    expect(html).toContain('Cedarhurst');
    expect(html).toContain('aria-label="Open Community shiur"');
    expect(html).toContain('aria-label="See all events"');
    expect(html).toContain('aria-label="Add an event"');
  });

  it('uses honest upcoming, empty, and error states', () => {
    const upcoming = renderToStaticMarkup(<HomeTonight window={{
      mode: 'upcoming',
      items: [{ id: 'e2', title: 'Pickup game', event_date: '2026-09-02', event_time: '7:30 PM' }],
    }} />);
    expect(upcoming).toContain('Coming up');

    const empty = renderToStaticMarkup(<HomeTonight window={{ mode: 'empty', items: [] }} />);
    expect(empty).toContain('No events posted yet');
    expect(empty).not.toContain('Happening tonight');

    const error = renderToStaticMarkup(<HomeTonight isError window={{ mode: 'empty', items: [] }} />);
    expect(error).toContain('Events could not load');
    expect(error).toContain('aria-label="Retry events"');
  });
});
