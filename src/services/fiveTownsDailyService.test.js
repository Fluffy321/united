import { describe, expect, it, vi } from 'vitest';
import {
  FIVE_TOWNS_DEFAULT_LOCATION,
  fetchFiveTownsJewishTimes,
  fetchFiveTownsTraffic,
  fetchFiveTownsWeather,
  nearFiveTowns,
} from './fiveTownsDailyService';

describe('Five Towns daily information providers', () => {
  it('normalizes current Open-Meteo weather', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 72.4,
          apparent_temperature: 74.1,
          weather_code: 2,
          is_day: 1,
          time: '2026-08-29T12:00',
        },
        current_units: { temperature_2m: '°F' },
      }),
    });

    await expect(fetchFiveTownsWeather({ fetchImpl })).resolves.toMatchObject({
      status: 'ready',
      sourceLabel: 'Open-Meteo',
      data: {
        temperature: 72,
        feelsLike: 74,
        condition: 'Partly cloudy',
        isDay: true,
      },
    });
  });

  it('returns an unavailable weather result when the provider fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(fetchFiveTownsWeather({ fetchImpl })).resolves.toMatchObject({
      status: 'unavailable',
      data: null,
    });
  });

  it('never reports an all-clear when 511NY is not configured', async () => {
    await expect(fetchFiveTownsTraffic({ apiKey: '' })).resolves.toMatchObject({
      status: 'unavailable',
      incidents: [],
      sourceUrl: 'https://511ny.org/',
    });
  });

  it('keeps only relevant active events near the Five Towns', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { ID: 1, County: 'Nassau', Latitude: 40.63, Longitude: -73.71, EventType: 'accidentsAndIncidents', Description: 'Crash' },
        { ID: 2, County: 'Nassau', Latitude: 40.64, Longitude: -73.72, EventType: 'weatherConditions', Description: 'Fog' },
        { ID: 3, County: 'Albany', Latitude: 42.65, Longitude: -73.75, EventType: 'roadwork', Description: 'Work' },
      ],
    });

    const result = await fetchFiveTownsTraffic({ fetchImpl, apiKey: 'test' });
    expect(result.status).toBe('ready');
    expect(result.incidents.map((item) => item.id)).toEqual(['1']);
  });

  it('distinguishes a verified empty 511NY result from unavailable data', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    await expect(fetchFiveTownsTraffic({ fetchImpl, apiKey: 'test' })).resolves.toMatchObject({
      status: 'empty',
      incidents: [],
    });
  });

  it('measures whether a coordinate is near the Five Towns', () => {
    expect(nearFiveTowns({ Latitude: 40.63, Longitude: -73.71 }, 12)).toBe(true);
    expect(nearFiveTowns({ Latitude: 42.65, Longitude: -73.75 }, 12)).toBe(false);
  });

  it('keeps available Jewish and solar times when one Hebcal response is missing', async () => {
    const getZmanimImpl = vi.fn().mockResolvedValue({
      sunrise: '2026-08-29T06:19:00-04:00',
      sunset: '2026-08-29T19:28:00-04:00',
    });
    const getShabbatTimesImpl = vi.fn().mockResolvedValue(null);

    await expect(fetchFiveTownsJewishTimes({
      date: new Date('2026-08-29T12:00:00-04:00'),
      location: FIVE_TOWNS_DEFAULT_LOCATION,
      getZmanimImpl,
      getShabbatTimesImpl,
    })).resolves.toMatchObject({
      status: 'ready',
      data: {
        sunrise: '2026-08-29T06:19:00-04:00',
        sunset: '2026-08-29T19:28:00-04:00',
        candleLighting: null,
      },
    });
  });
});
