const TRAFFIC_SOURCE = 'https://511ny.org/';
const TRAFFIC_ENDPOINT = 'https://511ny.org/api/v2/get/event';
const CACHE_CONTROL = 'public, max-age=60, s-maxage=300';
const FIVE_TOWNS = { latitude: 40.632, longitude: -73.716, radiusMiles: 12 };
const RELEVANT_TYPES = new Set(['accidentsandincidents', 'closures', 'roadwork']);

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type TrafficHandlerDependencies = {
  apiKey: string;
  fetchImpl: FetchLike;
  now: () => Date;
  corsHeaders?: Record<string, string>;
};

type TrafficEvent = Record<string, unknown>;

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  cacheControl = 'no-store',
) {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders,
      'cache-control': cacheControl,
    },
  });
}

function coordinate(event: TrafficEvent, names: string[]) {
  for (const name of names) {
    const value = Number(event[name]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (degrees: number) => degrees * (Math.PI / 180);
  const earthRadiusMiles = 3958.8;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isNearFiveTowns(event: TrafficEvent) {
  const latitude = coordinate(event, ['Latitude', 'latitude', 'Lat', 'lat']);
  const longitude = coordinate(event, ['Longitude', 'longitude', 'Lng', 'lng']);
  if (latitude === null || longitude === null) return false;
  return milesBetween(
    FIVE_TOWNS.latitude,
    FIVE_TOWNS.longitude,
    latitude,
    longitude,
  ) <= FIVE_TOWNS.radiusMiles;
}

function eventType(event: TrafficEvent) {
  return String(event.EventType || event.eventType || event.Type || '')
    .replace(/[^a-z]/gi, '')
    .toLowerCase();
}

function normalizedIncident(event: TrafficEvent) {
  return {
    id: String(event.ID ?? event.Id ?? event.id ?? ''),
    type: String(event.EventType || event.eventType || event.Type || 'Traffic event'),
    description: String(event.Description || event.description || event.Message || 'Traffic update'),
    road: String(event.RoadwayName || event.roadwayName || event.Road || ''),
    startAt: String(event.StartDate || event.startDate || ''),
    latitude: coordinate(event, ['Latitude', 'latitude', 'Lat', 'lat']),
    longitude: coordinate(event, ['Longitude', 'longitude', 'Lng', 'lng']),
  };
}

function baseResult(updatedAt = '') {
  return {
    updatedAt,
    sourceLabel: '511NY',
    sourceUrl: TRAFFIC_SOURCE,
    incidents: [] as ReturnType<typeof normalizedIncident>[],
  };
}

function eventList(payload: unknown): TrafficEvent[] {
  if (Array.isArray(payload)) return payload as TrafficEvent[];
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  const possibleEvents = record.events || record.Events || record.data;
  return Array.isArray(possibleEvents) ? possibleEvents as TrafficEvent[] : [];
}

export async function handleTrafficRequest(
  request: Request,
  { apiKey, fetchImpl, now, corsHeaders = { 'access-control-allow-origin': '*' } }: TrafficHandlerDependencies,
) {
  if (!apiKey.trim()) {
    return jsonResponse(503, { ...baseResult(), status: 'unavailable' }, corsHeaders);
  }

  try {
    const url = new URL(TRAFFIC_ENDPOINT);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('format', 'json');
    const providerResponse = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      signal: request.signal,
    });
    if (!providerResponse.ok) {
      return jsonResponse(502, { ...baseResult(), status: 'unavailable' }, corsHeaders);
    }

    const payload = await providerResponse.json();
    const incidents = eventList(payload)
      .filter((event) => RELEVANT_TYPES.has(eventType(event)))
      .filter(isNearFiveTowns)
      .map(normalizedIncident)
      .slice(0, 20);
    const result = {
      ...baseResult(now().toISOString()),
      status: incidents.length ? 'ready' : 'empty',
      incidents,
    };
    return jsonResponse(200, result, corsHeaders, CACHE_CONTROL);
  } catch {
    return jsonResponse(502, { ...baseResult(), status: 'unavailable' }, corsHeaders);
  }
}

export function createTrafficFunctionHandler(dependencies: TrafficHandlerDependencies) {
  return async (request: Request) => {
    const corsHeaders = dependencies.corsHeaders || { 'access-control-allow-origin': '*' };
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'GET' && request.method !== 'POST') {
      return jsonResponse(405, { status: 'unavailable', error: 'Method not allowed' }, corsHeaders);
    }
    return handleTrafficRequest(request, dependencies);
  };
}
