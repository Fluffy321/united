import { createTrafficFunctionHandler, handleTrafficRequest } from './handler.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function responseJson(response: Response) {
  return await response.json() as Record<string, unknown>;
}

Deno.test('traffic handler stays unavailable when the provider key is missing', async () => {
  const response = await handleTrafficRequest(new Request('https://example.com'), {
    apiKey: '',
    fetchImpl: fetch,
    now: () => new Date('2026-08-30T12:00:00Z'),
  });
  const body = await responseJson(response);

  assert(response.status === 503, `expected 503, got ${response.status}`);
  assert(body.status === 'unavailable', `expected unavailable, got ${body.status}`);
});

Deno.test('traffic handler reports provider failure without leaking the key', async () => {
  const response = await handleTrafficRequest(new Request('https://example.com'), {
    apiKey: 'super-secret-key',
    fetchImpl: async () => new Response('provider down', { status: 500 }),
    now: () => new Date('2026-08-30T12:00:00Z'),
  });
  const serialized = await response.text();

  assert(response.status === 502, `expected 502, got ${response.status}`);
  assert(serialized.includes('unavailable'), 'expected unavailable body');
  assert(!serialized.includes('super-secret-key'), 'provider key leaked in response');
});

Deno.test('traffic handler keeps only relevant nearby incidents', async () => {
  const events = [
    { ID: 1, Latitude: 40.63, Longitude: -73.71, EventType: 'accidentsAndIncidents', Description: 'Crash', RoadwayName: 'Peninsula Boulevard' },
    { ID: 2, Latitude: 40.64, Longitude: -73.72, EventType: 'weatherConditions', Description: 'Fog' },
    { ID: 3, Latitude: 42.65, Longitude: -73.75, EventType: 'roadwork', Description: 'Work' },
  ];
  const response = await handleTrafficRequest(new Request('https://example.com'), {
    apiKey: 'test-key',
    fetchImpl: async () => Response.json(events),
    now: () => new Date('2026-08-30T12:00:00Z'),
  });
  const body = await responseJson(response);
  const incidents = body.incidents as Array<Record<string, unknown>>;

  assert(response.status === 200, `expected 200, got ${response.status}`);
  assert(body.status === 'ready', `expected ready, got ${body.status}`);
  assert(incidents.length === 1, `expected one incident, got ${incidents.length}`);
  assert(incidents[0].id === '1', `expected incident 1, got ${incidents[0].id}`);
  assert(response.headers.get('cache-control') === 'public, max-age=60, s-maxage=300', 'missing cache header');
  assert(!JSON.stringify(body).includes('test-key'), 'provider key leaked in body');
});

Deno.test('traffic handler distinguishes a successful empty provider response', async () => {
  const response = await handleTrafficRequest(new Request('https://example.com'), {
    apiKey: 'test-key',
    fetchImpl: async () => Response.json([]),
    now: () => new Date('2026-08-30T12:00:00Z'),
  });
  const body = await responseJson(response);

  assert(response.status === 200, `expected 200, got ${response.status}`);
  assert(body.status === 'empty', `expected empty, got ${body.status}`);
  assert(Array.isArray(body.incidents) && body.incidents.length === 0, 'expected no incidents');
});

Deno.test('traffic function router handles browser preflight and rejects unsupported methods', async () => {
  const handler = createTrafficFunctionHandler({
    apiKey: 'test-key',
    fetchImpl: async () => Response.json([]),
    now: () => new Date('2026-08-30T12:00:00Z'),
    corsHeaders: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, apikey, content-type',
    },
  });
  const preflight = await handler(new Request('https://example.com', { method: 'OPTIONS' }));
  const rejected = await handler(new Request('https://example.com', { method: 'DELETE' }));

  assert(preflight.status === 204, `expected preflight 204, got ${preflight.status}`);
  assert(preflight.headers.get('access-control-allow-origin') === '*', 'missing preflight CORS');
  assert(rejected.status === 405, `expected 405, got ${rejected.status}`);
});
