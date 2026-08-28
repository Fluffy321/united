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
