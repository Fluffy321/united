import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  DIRECTORY_INTENTS,
  DIRECTORY_GROUPS,
  FIVE_TOWNS_LISTINGS,
  canShowKosherVerification,
  directoryMapLinks,
  featuredDirectoryListings,
  filterDirectoryListings,
  filterListingsByIntent,
  normalizeDirectoryListing,
} from './fiveTownsDirectory';

describe('Five Towns directory', () => {
  it('keeps the protected photo catalog synchronized with every listing', () => {
    const catalogUrl = new URL('../../../supabase/functions/_shared/fiveTownsDirectoryPhotoCatalog.json', import.meta.url);
    const catalogPath = fileURLToPath(catalogUrl);

    expect(existsSync(catalogPath)).toBe(true);

    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    expect(Object.keys(catalog).sort()).toEqual(FIVE_TOWNS_LISTINGS.map((listing) => listing.id).sort());
    expect(Object.values(catalog).every((listing) => listing.name && listing.address)).toBe(true);
  });

  it('gives every listing a safe official, runtime, and category-fallback photo path', () => {
    const catalogUrl = new URL('../../../supabase/functions/_shared/fiveTownsDirectoryPhotoCatalog.json', import.meta.url);
    const catalog = JSON.parse(readFileSync(fileURLToPath(catalogUrl), 'utf8'));

    expect(FIVE_TOWNS_LISTINGS.every((listing) => Boolean(catalog[listing.id]))).toBe(true);
    expect(
      FIVE_TOWNS_LISTINGS
        .filter((listing) => listing.imageUrl)
        .every((listing) => (
          listing.imageUrl.startsWith('https://') &&
          listing.imageSourceUrl.startsWith('https://') &&
          Boolean(listing.imageSourceLabel)
        )),
    ).toBe(true);
  });

  it('exposes the eight approved groups with populated subcategories', () => {
    expect(DIRECTORY_GROUPS).toHaveLength(8);
    expect(DIRECTORY_GROUPS.map((group) => group.id)).toEqual([
      'jewish-life',
      'food',
      'family',
      'shopping',
      'health',
      'services',
      'community',
      'things-to-do',
    ]);
    expect(DIRECTORY_GROUPS.every((group) => group.categories.length > 0)).toBe(true);
  });

  it('keeps every imported listing sourced and categorized', () => {
    expect(FIVE_TOWNS_LISTINGS.length).toBeGreaterThanOrEqual(121);
    expect(
      FIVE_TOWNS_LISTINGS.every(
        (item) => item.sourceUrl && item.groupId && item.categoryId,
      ),
    ).toBe(true);
  });

  it('provides real options across all approved groups', () => {
    const counts = Object.fromEntries(
      DIRECTORY_GROUPS.map((group) => [
        group.id,
        FIVE_TOWNS_LISTINGS.filter((item) => item.groupId === group.id).length,
      ]),
    );
    expect(counts['jewish-life']).toBeGreaterThan(0);
    expect(counts.food).toBeGreaterThan(0);
    expect(counts.family).toBeGreaterThan(0);
    expect(counts.shopping).toBeGreaterThan(0);
    expect(counts.health).toBeGreaterThan(0);
    expect(counts.services).toBeGreaterThan(0);
    expect(counts.community).toBeGreaterThan(0);
    expect(counts['things-to-do']).toBeGreaterThan(0);
  });

  it('shows kosher verification only with a certification source', () => {
    expect(canShowKosherVerification({ kosher: true, kosherSourceUrl: '' })).toBe(false);
    expect(
      canShowKosherVerification({
        kosher: true,
        kosherSourceUrl: 'https://certifier.example/place',
      }),
    ).toBe(true);
  });

  it('gives every restaurant a named, clickable kosher source', () => {
    const restaurants = FIVE_TOWNS_LISTINGS.filter((listing) => listing.categoryId === 'restaurants');

    expect(restaurants).toHaveLength(34);
    expect(restaurants.every((listing) => canShowKosherVerification(listing))).toBe(true);
    expect(restaurants.every((listing) => Boolean(listing.kosherCertifier))).toBe(true);
  });

  it('builds all three map links for a public physical address', () => {
    const links = directoryMapLinks({
      name: 'Test',
      address: '1 Central Ave, Cedarhurst, NY',
    });
    expect(links.google).toContain('google.com/maps');
    expect(links.apple).toContain('maps.apple.com');
    expect(links.waze).toContain('waze.com');
  });

  it('filters by group, category, town, and search text', () => {
    const sample = [
      {
        id: 'pizza',
        name: 'Central Pizza',
        description: 'Pizza restaurant',
        address: 'Central Ave, Cedarhurst',
        town: 'Cedarhurst',
        groupId: 'food',
        categoryId: 'restaurants',
      },
      {
        id: 'bakery',
        name: 'Woodmere Bakery',
        description: 'Bakery',
        address: 'Broadway, Woodmere',
        town: 'Woodmere',
        groupId: 'food',
        categoryId: 'bakeries',
      },
    ];
    const results = filterDirectoryListings(sample, {
      groupId: 'food',
      categoryId: 'restaurants',
      town: 'Cedarhurst',
      query: 'pizza',
    });
    expect(results.map((item) => item.id)).toEqual(['pizza']);
  });

  it('normalizes trusted photo and editorial metadata', () => {
    const listing = normalizeDirectoryListing({
      id: 'grant-park',
      title: 'Grant Park',
      type: 'services',
      group_id: 'things-to-do',
      category_id: 'recreation',
      source_url: 'https://www.nassaucountyny.gov/2799/Grant-Park',
      image_url: 'https://www.nassaucountyny.gov/ImageRepository/Document?documentId=5199',
      image_source_url: 'https://www.nassaucountyny.gov/2799/Grant-Park',
      image_source_label: 'Nassau County Parks',
      why_go: 'Playgrounds, courts, walking paths, fishing, and a seasonal spray area.',
      tags: ['Kids', 'Free', 'Kids', ''],
      featured: true,
      last_checked: '2026-08-28',
    });

    expect(listing).toMatchObject({
      imageUrl: 'https://www.nassaucountyny.gov/ImageRepository/Document?documentId=5199',
      imageSourceUrl: 'https://www.nassaucountyny.gov/2799/Grant-Park',
      imageSourceLabel: 'Nassau County Parks',
      whyGo: 'Playgrounds, courts, walking paths, fishing, and a seasonal spray area.',
      tags: ['Kids', 'Free'],
      featured: true,
      lastChecked: '2026-08-28',
    });
  });

  it('does not expose an image without a traceable image source', () => {
    const listing = normalizeDirectoryListing({
      id: 'unsafe-photo',
      title: 'Unsafe',
      type: 'services',
      source_url: 'https://example.com/place',
      image_url: 'https://example.com/photo.jpg',
    });

    expect(listing.imageUrl).toBe('');
    expect(listing.imageSourceUrl).toBe('');
  });

  it('selects only sourced records marked for featured discovery', () => {
    const listings = [
      { id: 'featured', featured: true, sourceUrl: 'https://example.com/featured' },
      { id: 'ordinary', featured: false, sourceUrl: 'https://example.com/ordinary' },
      { id: 'unsourced', featured: true, sourceUrl: '' },
    ];

    expect(featuredDirectoryListings(listings).map((listing) => listing.id)).toEqual(['featured']);
  });

  it('ships a useful first pass of traceable featured places', () => {
    const featured = featuredDirectoryListings(FIVE_TOWNS_LISTINGS, { limit: 100 });
    const groups = new Set(featured.map((listing) => listing.groupId));

    expect(featured.length).toBeGreaterThanOrEqual(35);
    expect(featured.every((listing) => listing.whyGo && listing.tags.length > 0)).toBe(true);
    expect(
      featured
        .filter((listing) => listing.imageUrl)
        .every((listing) => listing.imageSourceUrl),
    ).toBe(true);
    expect(
      ['food', 'jewish-life', 'shopping', 'family', 'things-to-do']
        .every((groupId) => groups.has(groupId)),
    ).toBe(true);
  });

  it('keeps North Woodmere distinct from Woodmere', () => {
    const listing = normalizeDirectoryListing({
      id: 'north-woodmere-park',
      title: 'North Woodmere Park',
      type: 'activity',
      group_id: 'things-to-do',
      category_id: 'recreation',
      location_text: '750 Hungry Harbor Rd, North Woodmere, NY 11581',
      source_url: 'https://example.gov/park',
    });
    expect(listing.town).toBe('North Woodmere');
  });

  it('offers the four approved directory shortcuts', () => {
    expect(DIRECTORY_INTENTS.map((intent) => intent.label)).toEqual([
      'Dinner tonight',
      'Kids',
      'Coffee',
      'Shabbat shopping',
    ]);
  });

  it('filters intents using only real listing metadata', () => {
    const sample = [
      {
        id: 'dinner',
        name: 'Central Avenue Grill',
        description: 'Sit-down dinner',
        whyGo: 'Good for dinner',
        groupId: 'food',
        categoryId: 'restaurants',
        tags: ['Dinner', 'Sit-down'],
      },
      {
        id: 'park',
        name: 'Grant Park',
        description: 'Playground and pool',
        whyGo: 'Get the kids outside',
        groupId: 'things-to-do',
        categoryId: 'recreation',
        tags: ['Kids', 'Outside'],
      },
      {
        id: 'lawyer',
        name: 'Local Law Office',
        description: 'Legal services',
        whyGo: '',
        groupId: 'services',
        categoryId: 'lawyers',
        tags: [],
      },
    ];

    expect(filterListingsByIntent(sample, 'dinner-tonight').map((item) => item.id)).toEqual(['dinner']);
    expect(filterListingsByIntent(sample, 'kids').map((item) => item.id)).toEqual(['park']);
    expect(filterListingsByIntent(sample, 'missing')).toBe(sample);
  });
});
