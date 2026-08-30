type HandlerModule = typeof import('./handler.ts');

const handlerModule = import('./handler.ts').catch(() => null);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function loadHandler(): Promise<HandlerModule> {
  const module = await handlerModule;
  assert(module, 'directory photo handler should exist');
  return module;
}

async function json(response: Response) {
  return await response.json() as Record<string, unknown>;
}

const catalog = {
  'central-pizza': {
    name: 'Central Pizza Co',
    address: '608 Central Ave, Cedarhurst, NY 11516',
  },
};

function post(listingIds: string[]) {
  return new Request('https://example.com/directory-photos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ listingIds }),
  });
}

Deno.test('directory photo handler reports missing provider configuration honestly', async () => {
  const { createDirectoryPhotoHandler } = await loadHandler();
  let providerCalled = false;
  const handler = createDirectoryPhotoHandler({
    apiKey: '',
    catalog,
    fetchImpl: async () => {
      providerCalled = true;
      return Response.json({});
    },
  });
  const response = await handler(post(['central-pizza']));
  const body = await json(response);
  const photos = body.photos as Array<Record<string, unknown>>;

  assert(response.status === 503, `expected 503, got ${response.status}`);
  assert(photos[0].status === 'unavailable', 'expected unavailable photo');
  assert(providerCalled === false, 'provider should not be called without a key');
});

Deno.test('directory photo handler rejects unknown and oversized listing batches', async () => {
  const { createDirectoryPhotoHandler } = await loadHandler();
  const handler = createDirectoryPhotoHandler({
    apiKey: 'test-key',
    catalog,
    fetchImpl: async () => Response.json({ places: [] }),
  });

  const unknown = await handler(post(['not-in-catalog']));
  const oversized = await handler(post(Array.from({ length: 9 }, () => 'central-pizza')));

  assert(unknown.status === 400, `expected unknown 400, got ${unknown.status}`);
  assert(oversized.status === 400, `expected oversized 400, got ${oversized.status}`);
});

Deno.test('directory photo handler returns a confident attributed Google photo', async () => {
  const { createDirectoryPhotoHandler } = await loadHandler();
  const requests: string[] = [];
  const handler = createDirectoryPhotoHandler({
    apiKey: 'super-secret-key',
    catalog,
    fetchImpl: async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      if (url.includes('places:searchText')) {
        return Response.json({
          places: [{
            id: 'place-1',
            displayName: { text: 'Central Pizza Co' },
            formattedAddress: '608 Central Ave, Cedarhurst, NY 11516, USA',
            googleMapsUri: 'https://maps.google.com/?cid=123',
            photos: [{
              name: 'places/place-1/photos/photo-1',
              authorAttributions: [{
                displayName: 'Central Pizza Co',
                uri: 'https://maps.google.com/contrib/123',
              }],
            }],
          }],
        });
      }
      return Response.json({ photoUri: 'https://lh3.googleusercontent.com/photo=s900' });
    },
  });

  const response = await handler(post(['central-pizza']));
  const body = await json(response);
  const photo = (body.photos as Array<Record<string, unknown>>)[0];
  const serialized = JSON.stringify(body);

  assert(response.status === 200, `expected 200, got ${response.status}`);
  assert(photo.status === 'ready', `expected ready, got ${photo.status}`);
  assert(photo.imageUrl === 'https://lh3.googleusercontent.com/photo=s900', 'wrong image URL');
  assert(photo.sourceUrl === 'https://maps.google.com/?cid=123', 'wrong source URL');
  assert(photo.sourceLabel === 'Google Places', 'wrong source label');
  assert(photo.authorName === 'Central Pizza Co', 'missing author name');
  assert(photo.authorUri === 'https://maps.google.com/contrib/123', 'missing author URI');
  assert(requests.length === 2, `expected two provider requests, got ${requests.length}`);
  assert(!serialized.includes('super-secret-key'), 'provider key leaked in response');
  assert(!serialized.includes('places/place-1/photos/photo-1'), 'photo resource name was persisted in response');
});

Deno.test('directory photo handler rejects a wrong place match', async () => {
  const { createDirectoryPhotoHandler } = await loadHandler();
  const handler = createDirectoryPhotoHandler({
    apiKey: 'test-key',
    catalog,
    fetchImpl: async () => Response.json({
      places: [{
        displayName: { text: 'Central Pizza Co' },
        formattedAddress: '999 Broadway, Manhattan, NY',
        googleMapsUri: 'https://maps.google.com/wrong',
        photos: [{ name: 'places/wrong/photos/photo' }],
      }],
    }),
  });

  const response = await handler(post(['central-pizza']));
  const body = await json(response);
  const photo = (body.photos as Array<Record<string, unknown>>)[0];

  assert(response.status === 200, `expected 200, got ${response.status}`);
  assert(photo.status === 'empty', `expected empty, got ${photo.status}`);
});

Deno.test('directory photo handler distinguishes no photo from provider failure', async () => {
  const { createDirectoryPhotoHandler } = await loadHandler();
  const noPhotoHandler = createDirectoryPhotoHandler({
    apiKey: 'test-key',
    catalog,
    fetchImpl: async () => Response.json({
      places: [{
        displayName: { text: 'Central Pizza Co' },
        formattedAddress: '608 Central Ave, Cedarhurst, NY 11516',
        googleMapsUri: 'https://maps.google.com/central',
        photos: [],
      }],
    }),
  });
  const failureHandler = createDirectoryPhotoHandler({
    apiKey: 'test-key',
    catalog,
    fetchImpl: async () => new Response('down', { status: 500 }),
  });

  const emptyBody = await json(await noPhotoHandler(post(['central-pizza'])));
  const failedBody = await json(await failureHandler(post(['central-pizza'])));

  assert((emptyBody.photos as Array<Record<string, unknown>>)[0].status === 'empty', 'expected empty');
  assert((failedBody.photos as Array<Record<string, unknown>>)[0].status === 'unavailable', 'expected unavailable');
});

Deno.test('directory photo router handles preflight and rejects unsupported methods', async () => {
  const { createDirectoryPhotoHandler } = await loadHandler();
  const handler = createDirectoryPhotoHandler({
    apiKey: 'test-key',
    catalog,
    fetchImpl: async () => Response.json({ places: [] }),
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
