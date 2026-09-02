import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('src/pages/Map.jsx'), 'utf8');
const directoryStart = source.indexOf('function BusinessDirectoryExperience');
const directoryEnd = source.indexOf('function CommunityMapExperience');
const directorySource = source.slice(directoryStart, directoryEnd);
const pageSource = source.slice(source.indexOf('export default function MapPage'));

describe('canonical Directory page contract', () => {
  it('merges trusted Five Towns listings with approved submitted businesses', () => {
    expect(source).toContain("import { FIVE_TOWNS_LISTINGS } from '@/lib/directory/fiveTownsDirectory'");
    expect(source).toContain('mergeDirectoryListings(FIVE_TOWNS_LISTINGS, submittedBusinesses)');
    expect(directorySource).toContain('directoryListings.length === 0');
  });

  it('uses one List and Map control without a competing top-level map product', () => {
    expect(directorySource).toContain("setMode('list')");
    expect(directorySource).toContain("setMode('map')");
    expect(pageSource).not.toContain("useState('businesses')");
    expect(pageSource).not.toContain("switchView('community')");
    expect(pageSource).not.toContain('<LiveNowRail');
  });

  it('uses category and place deep links inside the same directory', () => {
    expect(source).toContain("searchParams.get('category')");
    expect(source).toContain("searchParams.get('place')");
    expect(directorySource).toContain("const [mode, setMode] = useState('list')");
    expect(directorySource).toContain('setSelectedBusiness(matchedBusiness)');
    expect(pageSource).toContain('<BusinessDirectoryExperience');
    expect(pageSource).not.toContain('<CommunityMapExperience');
  });

  it('offers the eight clear directory groups instead of old business-only chips', () => {
    for (const label of ['Jewish life', 'Food', 'Family', 'Shopping', 'Health', 'Services', 'Community', 'Things to do']) {
      expect(source).toContain(`label: '${label}'`);
    }
    expect(directorySource).toContain("setCatalogScope(cat.groupId ? { groupId: cat.groupId } : {})");
  });

  it('distinguishes sourced kosher facts from submitted claims', () => {
    expect(source).toContain("business.source_kind === 'submitted'");
    expect(source).toContain('Kosher status comes from the linked source');
  });

  it('keeps submission and owner tools', () => {
    expect(directorySource).toContain('Add business');
    expect(directorySource).toContain('Owner Tools');
    expect(directorySource).toContain('<SubmitBusinessModal');
    expect(directorySource).toContain('<BusinessOwnerDashboard');
  });
});
