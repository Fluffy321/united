export const MAX_PHOTO_BATCH = 8;

type CatalogEntry = { name: string; address: string };
type PhotoStatus = 'ready' | 'empty' | 'unavailable';

type DirectoryPhoto = {
  listingId: string;
  status: PhotoStatus;
  imageUrl?: string;
  sourceUrl?: string;
  sourceLabel?: 'Google Places';
  authorName?: string;
  authorUri?: string;
};

type GooglePlace = {
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  photos?: Array<{
    name?: string;
    authorAttributions?: Array<{ displayName?: string; uri?: string }>;
  }>;
};

type HandlerDependencies = {
  apiKey: string;
  catalog: Readonly<Record<string, CatalogEntry>>;
  fetchImpl?: typeof fetch;
  corsHeaders?: Record<string, string>;
};

const DEFAULT_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOCALITIES = ['cedarhurst', 'lawrence', 'woodmere', 'hewlett', 'inwood', 'five towns'];
const NAME_STOP_WORDS = new Set(['and', 'at', 'co', 'company', 'inc', 'of', 'the']);

function normalize(value = '') {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function streetNumber(address = '') {
  return address.match(/\b\d+[a-z]?\b/i)?.[0]?.toLowerCase() || '';
}

function nameTokens(value = '') {
  return normalize(value)
    .split(' ')
    .filter((token) => token.length > 1 && !NAME_STOP_WORDS.has(token));
}

export function isConfidentPlaceMatch(entry: CatalogEntry, place: GooglePlace) {
  const expectedAddress = normalize(entry.address);
  const actualAddress = normalize(place.formattedAddress);
  const expectedStreetNumber = streetNumber(entry.address);
  const actualStreetNumber = streetNumber(place.formattedAddress);
  if (!expectedStreetNumber || expectedStreetNumber !== actualStreetNumber) return false;

  const expectedLocality = LOCALITIES.find((locality) => expectedAddress.includes(locality));
  if (expectedLocality && !actualAddress.includes(expectedLocality)) return false;

  const expectedName = normalize(entry.name);
  const actualName = normalize(place.displayName?.text);
  if (!actualName) return false;
  if (expectedName.includes(actualName) || actualName.includes(expectedName)) return true;

  const expectedTokens = nameTokens(entry.name);
  const actualTokens = new Set(nameTokens(place.displayName?.text));
  const sharedTokens = expectedTokens.filter((token) => actualTokens.has(token));
  return sharedTokens.length >= Math.max(1, Math.ceil(expectedTokens.length / 2));
}

function responseJson(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
) {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders,
      'Cache-Control': status === 200 ? 'private, max-age=300' : 'no-store',
    },
  });
}

function statusPhoto(listingId: string, status: PhotoStatus): DirectoryPhoto {
  return { listingId, status };
}

export function createDirectoryPhotoHandler({
  apiKey,
  catalog,
  fetchImpl = fetch,
  corsHeaders = DEFAULT_CORS_HEADERS,
}: HandlerDependencies) {
  async function resolvePhoto(listingId: string): Promise<DirectoryPhoto> {
    const entry = catalog[listingId];
    try {
      const searchResponse = await fetchImpl('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.googleMapsUri,places.photos',
        },
        body: JSON.stringify({
          textQuery: `${entry.name}, ${entry.address}`,
          maxResultCount: 3,
          regionCode: 'US',
        }),
      });
      if (!searchResponse.ok) return statusPhoto(listingId, 'unavailable');

      const searchPayload = await searchResponse.json() as { places?: GooglePlace[] };
      const place = searchPayload.places?.find((candidate) => isConfidentPlaceMatch(entry, candidate));
      const photo = place?.photos?.find((candidate) => Boolean(candidate.name));
      if (!place || !photo?.name) return statusPhoto(listingId, 'empty');

      const mediaUrl = new URL(`https://places.googleapis.com/v1/${photo.name}/media`);
      mediaUrl.searchParams.set('maxWidthPx', '900');
      mediaUrl.searchParams.set('skipHttpRedirect', 'true');
      mediaUrl.searchParams.set('key', apiKey);
      const mediaResponse = await fetchImpl(mediaUrl);
      if (!mediaResponse.ok) return statusPhoto(listingId, 'unavailable');

      const mediaPayload = await mediaResponse.json() as { photoUri?: string };
      if (!mediaPayload.photoUri) return statusPhoto(listingId, 'empty');

      const attribution = photo.authorAttributions?.[0];
      return {
        listingId,
        status: 'ready',
        imageUrl: mediaPayload.photoUri,
        sourceUrl: place.googleMapsUri,
        sourceLabel: 'Google Places',
        authorName: attribution?.displayName,
        authorUri: attribution?.uri,
      };
    } catch {
      return statusPhoto(listingId, 'unavailable');
    }
  }

  return async function directoryPhotoHandler(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return responseJson({ error: 'Method not allowed' }, 405, corsHeaders);

    let listingIds: unknown;
    try {
      ({ listingIds } = await request.json());
    } catch {
      return responseJson({ error: 'Invalid JSON body' }, 400, corsHeaders);
    }

    if (!Array.isArray(listingIds) || listingIds.length === 0 || listingIds.length > MAX_PHOTO_BATCH ||
      listingIds.some((id) => typeof id !== 'string')) {
      return responseJson({ error: `listingIds must contain 1-${MAX_PHOTO_BATCH} IDs` }, 400, corsHeaders);
    }

    const uniqueIds = [...new Set(listingIds as string[])];
    if (uniqueIds.some((id) => !catalog[id])) {
      return responseJson({ error: 'Unknown directory listing' }, 400, corsHeaders);
    }

    if (!apiKey) {
      return responseJson({ photos: uniqueIds.map((id) => statusPhoto(id, 'unavailable')) }, 503, corsHeaders);
    }

    const photos = await Promise.all(uniqueIds.map(resolvePhoto));
    return responseJson({ photos }, 200, corsHeaders);
  };
}
