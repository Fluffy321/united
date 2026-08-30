import { getShabbatTimes, getZmanim } from '@/lib/hebrewDate';

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
const FIVE_TOWNS_TRAFFIC_RADIUS_MILES = 12;
const RELEVANT_TRAFFIC_TYPES = new Set([
  'accidentsandincidents',
  'closures',
  'roadwork',
]);

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

function coordinate(event, names) {
  for (const name of names) {
    const value = Number(event?.[name]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function milesBetween(lat1, lng1, lat2, lng2) {
  const radians = (degrees) => degrees * (Math.PI / 180);
  const earthRadiusMiles = 3958.8;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearFiveTowns(event, radiusMiles = FIVE_TOWNS_TRAFFIC_RADIUS_MILES) {
  const latitude = coordinate(event, ['Latitude', 'latitude', 'Lat', 'lat']);
  const longitude = coordinate(event, ['Longitude', 'longitude', 'Lng', 'lng']);
  if (latitude === null || longitude === null) return false;
  return milesBetween(
    FIVE_TOWNS_DEFAULT_LOCATION.latitude,
    FIVE_TOWNS_DEFAULT_LOCATION.longitude,
    latitude,
    longitude,
  ) <= radiusMiles;
}

function trafficType(event) {
  return String(event?.EventType || event?.eventType || event?.Type || '')
    .replace(/[^a-z]/gi, '')
    .toLowerCase();
}

function normalizeTrafficEvent(event) {
  return {
    id: String(event.ID ?? event.Id ?? event.id ?? ''),
    type: event.EventType || event.eventType || event.Type || 'Traffic event',
    description: event.Description || event.description || event.Message || 'Traffic update',
    road: event.RoadwayName || event.roadwayName || event.Road || '',
    startAt: event.StartDate || event.startDate || '',
    latitude: coordinate(event, ['Latitude', 'latitude', 'Lat', 'lat']),
    longitude: coordinate(event, ['Longitude', 'longitude', 'Lng', 'lng']),
  };
}

export async function fetchFiveTownsTraffic({ fetchImpl = fetch, apiKey = '', signal } = {}) {
  const base = {
    updatedAt: '',
    sourceLabel: '511NY',
    sourceUrl: TRAFFIC_SOURCE,
    incidents: [],
    data: { incidents: [] },
  };

  if (!String(apiKey || '').trim()) {
    return { ...base, status: 'unavailable' };
  }

  try {
    const url = new URL('https://511ny.org/api/v2/get/event');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('format', 'json');
    const response = await fetchImpl(url.toString(), { signal: requestSignal(signal) });
    if (!response.ok) throw new Error(`511NY returned ${response.status}`);
    const payload = await response.json();
    const events = Array.isArray(payload)
      ? payload
      : payload?.events || payload?.Events || payload?.data || [];
    const incidents = events
      .filter((event) => RELEVANT_TRAFFIC_TYPES.has(trafficType(event)))
      .filter((event) => nearFiveTowns(event))
      .map(normalizeTrafficEvent);

    return {
      ...base,
      status: incidents.length ? 'ready' : 'empty',
      updatedAt: new Date().toISOString(),
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
