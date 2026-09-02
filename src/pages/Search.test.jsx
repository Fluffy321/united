import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIVE_TOWNS_LISTINGS } from '@/lib/directory/fiveTownsDirectory';
import { filterDirectoryCatalog } from '@/lib/directory/directoryCatalog';

const source = fs.readFileSync(path.resolve('src/pages/Search.jsx'), 'utf8');

describe('Search local directory connection', () => {
  it('finds known local places without the remote search function', () => {
    expect(filterDirectoryCatalog(FIVE_TOWNS_LISTINGS, { query: 'Cork & Slice' }).length).toBeGreaterThan(0);
    expect(filterDirectoryCatalog(FIVE_TOWNS_LISTINGS, { query: 'shul' }).length).toBeGreaterThan(0);
    expect(filterDirectoryCatalog(FIVE_TOWNS_LISTINGS, { query: 'Cedarhurst' }).length).toBeGreaterThan(0);
  });

  it('builds local results directly from the trusted catalog', () => {
    expect(source).toContain('filterDirectoryCatalog(FIVE_TOWNS_LISTINGS');
    expect(source).toContain('localDirectoryResults');
    expect(source).toContain('Places & directory');
  });

  it('opens local results in the canonical Directory', () => {
    expect(source).toContain('`/Map?place=${encodeURIComponent(listing.name)}`');
  });

  it('deduplicates remote businesses against the trusted local result names', () => {
    expect(source).toContain('remoteDirectoryResults');
    expect(source).toContain('localDirectoryNames.has');
  });
});
