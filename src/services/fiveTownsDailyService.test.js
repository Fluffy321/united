import { describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  FIVE_TOWNS_DEFAULT_LOCATION,
  fetchFiveTownsJewishTimes,
  fetchFiveTownsTraffic,
  fetchFiveTownsWeather,
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

  it('never reports an all-clear when the protected traffic function is unavailable', async () => {
    await expect(fetchFiveTownsTraffic({ client: null })).resolves.toMatchObject({
      status: 'unavailable',
      incidents: [],
      sourceUrl: 'https://511ny.org/',
    });
  });

  it('loads constrained traffic results through the protected Supabase function', async () => {
    const client = {
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: {
            status: 'ready',
            updatedAt: '2026-08-30T12:00:00Z',
            sourceLabel: '511NY',
            sourceUrl: 'https://511ny.org/',
            incidents: [{ id: '1', description: 'Crash', road: 'Peninsula Boulevard' }],
          },
          error: null,
        }),
      },
    };

    const result = await fetchFiveTownsTraffic({ client });
    expect(result.status).toBe('ready');
    expect(result.incidents.map((item) => item.id)).toEqual(['1']);
    expect(client.functions.invoke).toHaveBeenCalledWith('five-towns-traffic', { body: {} });
    expect(JSON.stringify(client.functions.invoke.mock.calls)).not.toContain('key');
  });

  it('distinguishes a verified empty function result from unavailable data', async () => {
    const client = {
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: {
            status: 'empty',
            updatedAt: '2026-08-30T12:00:00Z',
            sourceLabel: '511NY',
            sourceUrl: 'https://511ny.org/',
            incidents: [],
          },
          error: null,
        }),
      },
    };
    await expect(fetchFiveTownsTraffic({ client })).resolves.toMatchObject({
      status: 'empty',
      incidents: [],
    });
  });

  it('returns unavailable for function errors and malformed responses', async () => {
    const failingClient = {
      functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: new Error('offline') }) },
    };
    const malformedClient = {
      functions: { invoke: vi.fn().mockResolvedValue({ data: { status: 'ready' }, error: null }) },
    };

    await expect(fetchFiveTownsTraffic({ client: failingClient })).resolves.toMatchObject({ status: 'unavailable' });
    await expect(fetchFiveTownsTraffic({ client: malformedClient })).resolves.toMatchObject({ status: 'unavailable' });
  });

  it('never reads a browser-exposed 511NY credential', async () => {
    const hookSource = await readFile(new URL('../hooks/useFiveTownsDaily.js', import.meta.url), 'utf8');
    const envExample = await readFile(new URL('../../.env.example', import.meta.url), 'utf8');

    expect(hookSource).not.toContain('VITE_511NY_API_KEY');
    expect(envExample).not.toContain('VITE_511NY_API_KEY');
    expect(envExample).toContain('NY511_API_KEY');
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
