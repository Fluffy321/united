import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FiveTownsDailyPanel from './FiveTownsDailyPanel';

const readyWeather = {
  status: 'ready',
  sourceLabel: 'Open-Meteo',
  sourceUrl: 'https://open-meteo.com/',
  data: { temperature: 75, condition: 'Partly cloudy', isDay: true },
};

const readyTimes = {
  status: 'ready',
  sourceLabel: 'Hebcal',
  sourceUrl: 'https://hebcal.com/',
  data: {
    sunrise: '2026-08-29T06:19:00-04:00',
    sunset: '2026-08-29T19:28:00-04:00',
    candleLighting: '2026-09-04T18:59:00-04:00',
    havdalah: '2026-09-05T20:07:00-04:00',
  },
};

describe('FiveTownsDailyPanel', () => {
  it('shows the compact daily utility information', () => {
    const html = renderToStaticMarkup(
      <FiveTownsDailyPanel
        weather={readyWeather}
        jewishTimes={readyTimes}
        traffic={{ status: 'empty', incidents: [], sourceUrl: 'https://511ny.org/' }}
      />,
    );

    expect(html).toContain('Five Towns today');
    expect(html).toContain('75°');
    expect(html).toContain('Partly cloudy');
    expect(html).toContain('Candle lighting');
    expect(html).toContain('Shabbat ends');
    expect(html).toContain('Sunrise');
    expect(html).toContain('Sunset');
    expect(html).toContain('No nearby 511NY incidents');
  });

  it('is honest when traffic is not connected', () => {
    const html = renderToStaticMarkup(
      <FiveTownsDailyPanel
        weather={readyWeather}
        jewishTimes={readyTimes}
        traffic={{ status: 'unavailable', incidents: [], sourceUrl: 'https://511ny.org/' }}
      />,
    );

    expect(html).toContain('Live traffic unavailable');
    expect(html).not.toContain('No nearby 511NY incidents');
  });

  it('keeps successful providers visible when another is unavailable', () => {
    const html = renderToStaticMarkup(
      <FiveTownsDailyPanel
        weather={{ status: 'unavailable', data: null }}
        jewishTimes={readyTimes}
        traffic={{ status: 'unavailable', incidents: [], sourceUrl: 'https://511ny.org/' }}
      />,
    );

    expect(html).toContain('Weather unavailable');
    expect(html).toContain('Sunrise');
    expect(html).toContain('Candle lighting');
  });
});
