import { describe, expect, it } from 'vitest';
import {
  directoryListingToMapPoint,
  filterDirectoryCatalog,
  mergeDirectoryListings,
  normalizeSubmittedBusiness,
} from './directoryCatalog';

describe('directory catalog', () => {
  it('normalizes a published submitted business into the shared contract', () => {
    expect(normalizeSubmittedBusiness({
      id: 'db-1',
      name: 'Sample Pizza',
      description: 'Kosher pizza and salads',
      category: 'restaurant',
      listing_type: 'physical',
      address: '1 Central Ave',
      city: 'Cedarhurst',
      state: 'NY',
      postal_code: '11516',
      location_lat: '40.62',
      location_lng: '-73.72',
      status: 'published',
      website: 'https://example.com',
    })).toMatchObject({
      id: 'business:db-1',
      sourceRecordId: 'db-1',
      name: 'Sample Pizza',
      groupId: 'food',
      categoryId: 'restaurants',
      address: '1 Central Ave, Cedarhurst, NY 11516',
      town: 'Cedarhurst',
      latitude: 40.62,
      longitude: -73.72,
      sourceKind: 'submitted',
      listingType: 'physical',
      website: 'https://example.com',
    });
  });

  it('maps common submitted categories into the approved directory groups', () => {
    const samples = [
      ['Kosher Food', 'food', 'restaurants'],
      ['Kosher Grocery', 'food', 'groceries'],
      ['Bakery', 'food', 'bakeries'],
      ['Catering', 'food', 'catering'],
      ['Shul', 'jewish-life', 'shuls'],
      ['School', 'family', 'schools'],
      ['Dentist', 'health', 'dentists'],
      ['Judaica', 'shopping', 'judaica'],
      ['Car Service', 'services', 'car-services'],
    ];

    samples.forEach(([category, groupId, categoryId], index) => {
      const listing = normalizeSubmittedBusiness({
        id: `db-${index}`,
        name: category,
        category,
        status: 'published',
      });
      expect(listing).toMatchObject({ groupId, categoryId });
    });
  });

  it('does not treat an unverified kosher string as certification', () => {
    expect(normalizeSubmittedBusiness({
      id: 'db-1',
      name: 'Unverified Restaurant',
      category: 'restaurant',
      kosher_claim: 'Not checked',
    }).kosher).toBe(false);

    expect(normalizeSubmittedBusiness({
      id: 'db-2',
      name: 'Verified Restaurant',
      category: 'restaurant',
      kosher_status: 'certified',
      kosher_certifying_agency: 'Five Towns Vaad',
    }).kosher).toBe(true);
  });

  it('keeps trusted records and excludes unpublished submissions', () => {
    const trusted = [{
      id: 'trusted-1',
      name: 'Trusted Place',
      address: '1 Main St, Cedarhurst',
      sourceKind: 'trusted',
    }];
    const submitted = [{ id: 'draft-1', name: 'Draft Place', status: 'pending' }];

    expect(mergeDirectoryListings(trusted, submitted)).toEqual(trusted);
  });

  it('deduplicates by normalized name and address while preserving trusted facts', () => {
    const trusted = [{
      id: 'trusted-1',
      name: 'Central Pizza Co',
      address: '608 Central Ave, Cedarhurst, NY 11516',
      phone: '',
      website: '',
      imageUrl: '',
      kosher: true,
      kosherCertifier: 'Five Towns Vaad',
      kosherSourceUrl: 'https://vaad.example/central-pizza',
      sourceUrl: 'https://trusted.example/central-pizza',
      sourceLabel: 'Trusted directory',
      sourceKind: 'trusted',
    }];
    const submitted = [{
      id: 'db-1',
      name: ' central pizza co. ',
      address: '608 Central Avenue',
      city: 'Cedarhurst',
      state: 'NY',
      postal_code: '11516',
      phone: '516-555-0100',
      website: 'https://centralpizza.example',
      logo_url: 'https://centralpizza.example/logo.jpg',
      is_claimed: true,
      status: 'published',
      kosher_claim: 'Not checked',
    }];

    const results = mergeDirectoryListings(trusted, submitted);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'trusted-1',
      phone: '516-555-0100',
      website: 'https://centralpizza.example',
      imageUrl: 'https://centralpizza.example/logo.jpg',
      kosher: true,
      kosherCertifier: 'Five Towns Vaad',
      kosherSourceUrl: 'https://vaad.example/central-pizza',
      sourceUrl: 'https://trusted.example/central-pizza',
      isClaimed: true,
      sourceKind: 'trusted',
    });
  });

  it('searches name, address, town, category, group, and tags', () => {
    const listings = [{
      id: 'one',
      name: 'Cork & Slice',
      description: 'Kosher dairy restaurant',
      address: '477 Chestnut St, Cedarhurst',
      town: 'Cedarhurst',
      groupId: 'food',
      categoryId: 'restaurants',
      tags: ['Pizza', 'Date night'],
      listingType: 'physical',
    }];

    ['cork', 'chestnut', 'cedarhurst', 'restaurant', 'food', 'date night'].forEach((query) => {
      expect(filterDirectoryCatalog(listings, { query })).toHaveLength(1);
    });
    expect(filterDirectoryCatalog(listings, { groupId: 'jewish-life' })).toHaveLength(0);
    expect(filterDirectoryCatalog(listings, { categoryId: 'restaurants', listingType: 'physical' })).toHaveLength(1);
  });

  it('converts coordinate-backed listings to the existing map point contract', () => {
    expect(directoryListingToMapPoint({
      id: 'place-1',
      name: 'A Shul',
      description: 'Local minyanim',
      categoryId: 'shuls',
      address: '1 Shul St',
      latitude: 40.6,
      longitude: -73.7,
      sourceUrl: 'https://example.com/shul',
      sourceLabel: 'Official site',
    })).toEqual({
      id: 'directory-place-1',
      listingId: 'place-1',
      title: 'A Shul',
      description: 'Local minyanim',
      type: 'shul',
      location_text: '1 Shul St',
      location_lat: 40.6,
      location_lng: -73.7,
      source_url: 'https://example.com/shul',
      verification: 'Official site',
      isDirectoryPoint: true,
    });
    expect(directoryListingToMapPoint({ id: 'no-coordinates' })).toBeNull();
  });
});
