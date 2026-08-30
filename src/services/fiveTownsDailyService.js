import { getShabbatTimes, getZmanim } from '@/lib/hebrewDate';
import { supabase } from '@/api/supabaseClient';

export const FIVE_TOWNS_DEFAULT_LOCATION = Object.freeze({
  name: 'Five Towns',
  latitude: 40.632,
  longitude: -73.716,
  lat: 40.632,
  lng: -73.716,
  timeZone: 'America/New_York',
  tzid: 'America/New_York',
});

const OPEN_METEO_SOURCE = 'https://open-meteo.com/';
const TRAFFIC_SOURCE = 'https://511ny.org/';

const WEATHER_LABELS = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  95: 'Thunderstorms',
  96: 'Thunderstorms',
  99: 'Thunderstorms',
};

function requestSignal(signal) {
  if (signal) return signal;
  return typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(8000)
    : undefined;
}

function unavailableResult(sourceLabel, sourceUrl) {
  return {
    status: 'unavailable',
    updatedAt: '',
    sourceLabel,
    sourceUrl,
    data: null,
  };
}

export async function fetchFiveTownsWeather({ fetchImpl = fetch, signal } = {}) {
  const params = new URLSearchParams({
    latitude: String(FIVE_TOWNS_DEFAULT_LOCATION.latitude),
    longitude: String(FIVE_TOWNS_DEFAULT_LOCATION.longitude),
    current: 'temperature_2m,apparent_temperature,weather_code,is_day',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: FIVE_TOWNS_DEFAULT_LOCATION.timeZone,
  });

  try {
    const response = await fetchImpl(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: requestSignal(signal),
    });
    if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
    const payload = await response.json();
    const current = payload?.current;
    if (!current || !Number.isFinite(current.temperature_2m)) {
      return unavailableResult('Open-Meteo', OPEN_METEO_SOURCE);
    }

    return {
      status: 'ready',
      updatedAt: current.time || new Date().toISOString(),
      sourceLabel: 'Open-Meteo',
      sourceUrl: OPEN_METEO_SOURCE,
      data: {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Number.isFinite(current.apparent_temperature)
          ? Math.round(current.apparent_temperature)
          : null,
        condition: WEATHER_LABELS[current.weather_code] || 'Current conditions',
        weatherCode: current.weather_code,
        isDay: Boolean(current.is_day),
        unit: payload?.current_units?.temperature_2m || '°F',
      },
    };
  } catch {
    return unavailableResult('Open-Meteo', OPEN_METEO_SOURCE);
  }
}

export async function fetchFiveTownsTraffic({ client = supabase } = {}) {
  const base = {
    updatedAt: '',
    sourceLabel: '511NY',
    sourceUrl: TRAFFIC_SOURCE,
    incidents: [],
    data: { incidents: [] },
  };

  if (!client?.functions?.invoke) {
    return { ...base, status: 'unavailable' };
  }

  try {
    const { data, error } = await client.functions.invoke('five-towns-traffic', { body: {} });
    if (error || !data || !['ready', 'empty'].includes(data.status) || !Array.isArray(data.incidents)) {
      return { ...base, status: 'unavailable' };
    }
    if (data.status === 'ready' && data.incidents.length === 0) {
      return { ...base, status: 'unavailable' };
    }

    const incidents = data.incidents.slice(0, 20).map((incident) => ({
      id: String(incident?.id || ''),
      type: String(incident?.type || 'Traffic event'),
      description: String(incident?.description || 'Traffic update'),
      road: String(incident?.road || ''),
      startAt: String(incident?.startAt || ''),
      latitude: Number.isFinite(Number(incident?.latitude)) ? Number(incident.latitude) : null,
      longitude: Number.isFinite(Number(incident?.longitude)) ? Number(incident.longitude) : null,
    }));

    return {
      ...base,
      status: data.status,
      updatedAt: String(data.updatedAt || ''),
      incidents,
      data: { incidents },
    };
  } catch {
    return { ...base, status: 'unavailable' };
  }
}

export async function fetchFiveTownsJewishTimes({
  date = new Date(),
  location = FIVE_TOWNS_DEFAULT_LOCATION,
  getZmanimImpl = getZmanim,
  getShabbatTimesImpl = getShabbatTimes,
} = {}) {
  const lat = location.latitude ?? location.lat;
  const lng = location.longitude ?? location.lng;
  const tzid = location.timeZone || location.tzid || 'America/New_York';
  const [zmanimResult, shabbatResult] = await Promise.allSettled([
    getZmanimImpl(lat, lng, date, tzid),
    getShabbatTimesImpl(lat, lng, tzid, date),
  ]);
  const zmanim = zmanimResult.status === 'fulfilled' ? zmanimResult.value : null;
  const shabbat = shabbatResult.status === 'fulfilled' ? shabbatResult.value : null;

  if (!zmanim && !shabbat) {
    return unavailableResult('Hebcal', 'https://www.hebcal.com/');
  }

  return {
    status: 'ready',
    updatedAt: new Date().toISOString(),
    sourceLabel: 'Hebcal',
    sourceUrl: 'https://www.hebcal.com/',
    data: {
      sunrise: zmanim?.sunrise || null,
      sunset: zmanim?.sunset || null,
      candleLighting: shabbat?.candleLighting || null,
      havdalah: shabbat?.havdalah || null,
      parsha: shabbat?.parsha || null,
    },
  };
}
