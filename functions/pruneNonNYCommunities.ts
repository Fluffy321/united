import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const NY_CITIES = new Set([
  'new york', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island',
  'upper west side', 'washington heights', 'flatbush', 'borough park',
  'crown heights', 'riverdale', 'kew gardens hills', 'forest hills',
  'great neck', 'lawrence', 'cedarhurst', 'woodmere', 'inwood', 'hewlett',
  'five towns', 'long island', 'flushing', 'jamaica', 'astoria', 'bayside',
  'forest hills', 'jamaica estates', 'fresh meadows', 'whitestone', 'douglaston',
  'little neck', 'howard beach', 'richmond hill', 'ozone park', 'woodhaven',
  'pelham', 'yonkers', 'new rochelle', 'mount vernon', 'white plains',
  'scarsdale', 'tuckahoe', 'eastchester', 'bronxville', 'larchmont',
  'mamaroneck', 'port chester', 'rye', 'harrison', 'tarrytown',
  'monsey', 'spring valley', 'new city', 'suffern', 'airmont',
]);

function isNY(community) {
  const addr = (community.address || '').toLowerCase();
  const neighborhood = (community.neighborhood || '').toLowerCase();
  const name = (community.name || '').toLowerCase();

  // Check address contains NY indicators
  if (addr.includes(', ny') || addr.includes('new york') || addr.includes('ny ')) return true;

  // Check neighborhood is a known NY city/area
  if (NY_CITIES.has(neighborhood)) return true;

  // Check if address contains any NY city name
  for (const city of NY_CITIES) {
    if (addr.includes(city)) return true;
  }

  // Check "Five Towns" neighborhoods explicitly
  const fiveTowns = ['lawrence', 'cedarhurst', 'woodmere', 'inwood', 'hewlett'];
  if (fiveTowns.some(t => neighborhood.includes(t))) return true;

  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Fetch all communities in batches
    let allCommunities = [];
    let skip = 0;
    const BATCH = 500;
    while (true) {
      const batch = await base44.asServiceRole.entities.Community.list('-created_date', BATCH);
      if (!batch || batch.length === 0) break;
      allCommunities = allCommunities.concat(batch);
      if (batch.length < BATCH) break;
      skip += BATCH;
    }

    console.log(`[pruneNonNY] Total communities fetched: ${allCommunities.length}`);

    // Filter: seeded + unclaimed + NOT in NY
    const toDelete = allCommunities.filter(c =>
      c.is_seeded === true &&
      c.is_claimed === false &&
      !isNY(c)
    );

    console.log(`[pruneNonNY] Communities to delete: ${toDelete.length}`);

    // Delete in parallel batches of 20
    const CHUNK = 20;
    for (let i = 0; i < toDelete.length; i += CHUNK) {
      await Promise.all(toDelete.slice(i, i + CHUNK).map(c =>
        base44.asServiceRole.entities.Community.delete(c.id)
      ));
    }

    console.log(`[pruneNonNY] Done. Deleted ${toDelete.length}`);
    return Response.json({ ok: true, deletedCount: toDelete.length });
  } catch (err) {
    console.error('[pruneNonNY] ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});