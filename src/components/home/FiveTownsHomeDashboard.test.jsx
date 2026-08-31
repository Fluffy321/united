import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FiveTownsHomeDashboard from './FiveTownsHomeDashboard';

describe('FiveTownsHomeDashboard', () => {
  afterEach(() => vi.useRealTimers());

  const dailyInfo = {
    weather: { status: 'ready', data: { temperature: 75, condition: 'Partly cloudy' } },
    jewishTimes: { status: 'ready', data: {
      sunrise: '2026-08-29T06:19:00-04:00',
      sunset: '2026-08-29T19:28:00-04:00',
      candleLighting: '2026-09-04T18:59:00-04:00',
      havdalah: '2026-09-05T20:07:00-04:00',
    } },
    traffic: { status: 'unavailable', incidents: [], sourceUrl: 'https://511ny.org/' },
  };

  it('keeps the approved top and ends with real circles followed by tonight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T22:00:00Z'));
    const html = renderToStaticMarkup(
      <FiveTownsHomeDashboard
        currentUser={{ first_name: 'Aryeh' }}
        posts={[{ id: 'p1', community_id: 'c1', body: 'Circle update', created_date: '2026-08-31T20:00:00Z' }]}
        communityGroups={[{ id: 'c1', name: 'Five Towns 20s' }]}
        events={[{ id: 'e1', type: 'event', title: 'Community shiur', event_date: '2026-08-31', event_time: '8:00 PM' }]}
        dailyInfo={dailyInfo}
      />,
    );

    expect(html).toContain('Today at a glance');
    expect(html).toContain('75°');
    expect(html).not.toContain('Everything local, without the noise.');
    expect(html).toContain('Find anything Jewish nearby');
    expect(html).toContain('aria-label="Tune Home"');
    expect(html).toContain('Everything Jewish');
    expect(html).toContain('Find something');
    expect(html).toContain('Worth knowing nearby');
    expect(html).toContain('Useful nearby');
    expect(html.match(/data-home-directory-shortcut=/g)).toHaveLength(4);
    expect(html).toContain('Get the kids out');
    expect(html).toContain('Need a calm hour');
    expect(html).toContain('Make a full afternoon');
    expect(html).toContain('Go out tonight');
    expect(html).toContain('Guests are visiting');
    expect(html).toContain('From your circles');
    expect(html).toContain('Circle update');
    expect(html).toContain('Happening tonight');
    expect(html).toContain('Community shiur');
    expect(html.indexOf('Today at a glance')).toBeLessThan(html.indexOf('Find something'));
    expect(html.indexOf('Find something')).toBeLessThan(html.indexOf('Worth knowing nearby'));
    expect(html.indexOf('Worth knowing nearby')).toBeLessThan(html.indexOf('Useful nearby'));
    expect(html.indexOf('Useful nearby')).toBeLessThan(html.indexOf('From your circles'));
    expect(html.indexOf('From your circles')).toBeLessThan(html.indexOf('Happening tonight'));
    expect(html).not.toContain('Your city today');
    expect(html).not.toContain('People and groups');
    expect(html).not.toContain('Opportunities');
    expect(html).not.toContain('Help nearby');
    expect(html).not.toContain('Complete Jewish directory');
    expect(html).not.toContain('Add something useful');
  });

  it('does not invent activity when there are no real posts or groups', () => {
    const html = renderToStaticMarkup(
      <FiveTownsHomeDashboard posts={[]} communityGroups={[]} dailyInfo={dailyInfo} />,
    );

    expect(html).toContain('No events posted yet');
    expect(html).toContain('Browse communities');
    expect(html).not.toContain('people interested');
    expect(html).not.toContain('Happening tonight');
    expect(html).not.toContain('random ride');
  });
});
