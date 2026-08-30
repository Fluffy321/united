import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FiveTownsHomeDashboard from './FiveTownsHomeDashboard';

describe('FiveTownsHomeDashboard', () => {
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

  it('renders the approved complete dashboard hierarchy', () => {
    const html = renderToStaticMarkup(
      <FiveTownsHomeDashboard
        currentUser={{ first_name: 'Aryeh' }}
        posts={[]}
        communityGroups={[]}
        dailyInfo={dailyInfo}
      />,
    );

    expect(html).toContain('Five Towns today');
    expect(html).toContain('75°');
    expect(html).not.toContain('Everything local, without the noise.');
    expect(html).toContain('Find food, shuls, schools, shops, anything');
    expect(html).toContain('Jewish directory');
    expect(html).toContain('Nearby worth knowing');
    expect(html).toContain('Useful nearby');
    expect(html).toContain('Get the kids out');
    expect(html).toContain('Need a calm hour');
    expect(html).toContain('Make a full afternoon');
    expect(html).toContain('Go out tonight');
    expect(html).toContain('Guests are visiting');
    expect(html).toContain('Your city today');
    expect(html).toContain('People and groups');
    expect(html).toContain('Jewish life');
    expect(html).toContain('Opportunities');
    expect(html).toContain('Help nearby');
    expect(html).toContain('Complete Jewish directory');
  });

  it('does not invent activity when there are no real posts or groups', () => {
    const html = renderToStaticMarkup(
      <FiveTownsHomeDashboard posts={[]} communityGroups={[]} dailyInfo={dailyInfo} />,
    );

    expect(html).toContain('No new local updates right now');
    expect(html).toContain('Browse communities');
    expect(html).not.toContain('people interested');
    expect(html).not.toContain('HAPPENING TONIGHT');
    expect(html).not.toContain('random ride');
  });
});
