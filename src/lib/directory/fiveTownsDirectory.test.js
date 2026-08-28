import { describe, expect, it } from 'vitest';
import {
  DIRECTORY_GROUPS,
  FIVE_TOWNS_LISTINGS,
  canShowKosherVerification,
  directoryMapLinks,
  filterDirectoryListings,
} from './fiveTownsDirectory';

describe('Five Towns directory', () => {
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
});
