// Admin-only tool: search Google Places for real Five Towns businesses and,
// once an admin picks specific results, import them into business_listings.
//
// This deliberately does NOT auto-publish anything from a bulk scrape. An
// admin must run a search, see the real candidates, and explicitly choose
// which ones to import — consistent with the review-first design of the
// business directory (see 20260516011532_business_directory_mvp.sql).
//
// Imported rows are marked status='published' (the admin's selection IS the
// review) but verification_status/jewish_owned_status/kosher_status stay at
// their defaults — Google Places has no way to know those, and they must be
// confirmed by the actual business owner via the existing claim flow.

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY   = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_PLACES_KEY   = Deno.env.get('GOOGLE_PLACES_API_KEY');

// Five Towns area centers, shared with src/pages/Map.jsx's COMMUNITY_LOCATION_FALLBACKS.
const TOWN_CENTERS: Record<string, { lat: number; lng: number; label: string }> = {
  cedarhurst:   { lat: 40.6224, lng: -73.7268, label: 'Cedarhurst, NY' },
  lawrence:     { lat: 40.6134, lng: -73.7302, label: 'Lawrence, NY' },
  woodmere:     { lat: 40.6326, lng: -73.7162, label: 'Woodmere, NY' },
  hewlett:      { lat: 40.6412, lng: -73.7012, label: 'Hewlett, NY' },
  inwood:       { lat: 40.6223, lng: -73.7462, label: 'Inwood, NY' },
  'five towns': { lat: 40.6249, lng: -73.7178, label: 'Five Towns, NY' },
};

// Maps the app's business_listings category keys (see BUSINESS_CATEGORIES in
// src/pages/Map.jsx) to a Google Places text-search keyword. Admins can
// override with a free-text query for anything not well covered here.
const CATEGORY_QUERIES: Record<string, string> = {
  attractions:        'tourist attraction OR park OR museum',
  childcare:           'babysitting OR childcare OR daycare',
  beauty_services:     'hair salon OR nail salon OR beauty salon OR barber',
  car_services:        'auto repair OR car service OR gas station',
  chessed:              'gemach OR chesed organization OR tomchei shabbos',
  food_dining:          'kosher restaurant OR kosher bakery OR pizza',
  health:               'doctor OR dentist OR medical clinic OR pharmacy',
  home_improvement:     'plumber OR electrician OR contractor OR handyman',
  hostess_gifts:        'gift shop OR judaica store',
  local_businesses:     'store OR shop',
  mikvahs:              'mikvah',
  vacation_rentals:     'vacation rental OR short term rental',
};

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function normalizeForDedupe(name: string, address: string): string {
  return `${name}|${address}`.toLowerCase().replace(/[^a-z0-9|]+/g, '');
}

async function searchPlaces(category: string, town: string, query?: string) {
  if (!GOOGLE_PLACES_KEY) throw new Error('GOOGLE_PLACES_API_KEY is not configured');

  const center = TOWN_CENTERS[town.toLowerCase()] || TOWN_CENTERS['five towns'];
  const searchText = query?.trim() || CATEGORY_QUERIES[category] || category;
  const fullQuery = `${searchText} in ${center.label}`;

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', fullQuery);
  url.searchParams.set('location', `${center.lat},${center.lng}`);
  url.searchParams.set('radius', '8000');
  url.searchParams.set('key', GOOGLE_PLACES_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places error: ${data.status} ${data.error_message || ''}`.trim());
  }

  return (data.results || []).map((place: any) => ({
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address,
    lat: place.geometry?.location?.lat ?? null,
    lng: place.geometry?.location?.lng ?? null,
    rating: place.rating ?? null,
    businessStatus: place.business_status ?? null,
    types: place.types || [],
  }));
}

async function fetchPlaceDetails(placeId: string) {
  if (!GOOGLE_PLACES_KEY) throw new Error('GOOGLE_PLACES_API_KEY is not configured');

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,geometry,business_status');
  url.searchParams.set('key', GOOGLE_PLACES_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.status !== 'OK') return null;
  return data.result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return errorResponse(401, 'Authentication required');

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return errorResponse(401, 'Invalid or expired session');

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return errorResponse(403, 'Admin access required');
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const action = body.action as string;

  if (action === 'search') {
    const { category, town, query } = body as { category?: string; town?: string; query?: string };
    if (!category && !query) return errorResponse(400, 'category or query is required');
    if (!town) return errorResponse(400, 'town is required');

    try {
      const results = await searchPlaces(category || '', town, query);

      // Flag candidates that already exist so the admin doesn't double-import.
      const { data: existing } = await adminClient
        .from('business_listings')
        .select('name, address');
      const existingKeys = new Set(
        (existing || []).map((b: any) => normalizeForDedupe(b.name || '', b.address || ''))
      );

      const annotated = results.map((r: any) => ({
        ...r,
        alreadyListed: existingKeys.has(normalizeForDedupe(r.name, r.address || '')),
      }));

      return new Response(JSON.stringify({ results: annotated }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Places search failed:', err);
      return errorResponse(500, err instanceof Error ? err.message : 'Search failed');
    }
  }

  if (action === 'import') {
    const { category, places } = body as {
      category?: string;
      places?: Array<{ placeId: string; name: string; address: string; lat: number; lng: number }>;
    };
    if (!category) return errorResponse(400, 'category is required');
    if (!Array.isArray(places) || places.length === 0) return errorResponse(400, 'places is required');

    const { data: existing } = await adminClient
      .from('business_listings')
      .select('name, address');
    const existingKeys = new Set(
      (existing || []).map((b: any) => normalizeForDedupe(b.name || '', b.address || ''))
    );

    const imported: string[] = [];
    const skipped: string[] = [];

    for (const place of places) {
      const key = normalizeForDedupe(place.name, place.address || '');
      if (existingKeys.has(key)) {
        skipped.push(place.name);
        continue;
      }

      const details = await fetchPlaceDetails(place.placeId).catch(() => null);

      const { error: insertError } = await adminClient.from('business_listings').insert({
        name: place.name,
        category,
        listing_type: 'physical',
        status: 'published',
        submitted_by: user.id,
        submitted_by_name: profile.full_name || 'Admin import',
        address: details?.formatted_address || place.address,
        city: null,
        location_lat: place.lat,
        location_lng: place.lng,
        phone: details?.formatted_phone_number || null,
        website: details?.website || null,
        source_label: 'Google Places',
        source_url: `https://www.google.com/maps/place/?q=place_id:${place.placeId}`,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: 'Imported from Google Places by admin.',
      });

      if (insertError) {
        console.error(`Failed to import ${place.name}:`, insertError);
        skipped.push(place.name);
      } else {
        imported.push(place.name);
        existingKeys.add(key);
      }
    }

    return new Response(JSON.stringify({ imported, skipped }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  return errorResponse(400, 'Unknown action');
});
