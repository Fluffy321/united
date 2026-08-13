import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('src/pages/Map.jsx'), 'utf8');
const businessStart = source.indexOf('function BusinessDirectoryExperience');
const businessEnd = source.indexOf('function CommunityMapExperience');
const businessSource = source.slice(businessStart, businessEnd);

describe('Map iPhone Directory contract', () => {
  it('opens the Directory to Businesses while preserving both views', () => {
    expect(source).toContain("useState('businesses')");
    expect(source).toContain("switchView('businesses')");
    expect(source).toContain("switchView('community')");
    expect(source).toContain('<BusinessDirectoryExperience');
    expect(source).toContain('<CommunityMapExperience');
  });

  it('puts search before compact categories and results', () => {
    const searchIndex = businessSource.indexOf('data-testid="directory-search"');
    const categoriesIndex = businessSource.indexOf('data-testid="directory-categories"');
    const resultsIndex = businessSource.indexOf('data-testid="directory-results"');
    expect(searchIndex).toBeGreaterThan(-1);
    expect(categoriesIndex).toBeGreaterThan(searchIndex);
    expect(resultsIndex).toBeGreaterThan(categoriesIndex);
    expect(businessSource).not.toContain('Support Jewish<br />Business');
    expect(businessSource).not.toContain('>Listed<');
    expect(businessSource).toContain('aria-pressed={isActive}');
    expect(businessSource).toContain('min-h-11');
  });

  it('keeps an empty directory distinct from filtered no matches', () => {
    expect(businessSource).toContain('businesses.length === 0');
    expect(businessSource).toContain('The directory is getting started');
    expect(businessSource).toContain('No matches for these filters');
    expect(businessSource).toContain("setCategory('all')");
    expect(businessSource).toContain("setSearch('')");
    expect(businessSource).toContain("setType('all')");
  });

  it('does not put the activity map before business search', () => {
    expect(source).toContain("activeView === 'community' && (");
  });

  it('keeps location help after search and gives view controls their own row', () => {
    const searchIndex = businessSource.indexOf('data-testid="directory-search"');
    const locationIndex = businessSource.indexOf("locationStatus === 'denied'");
    expect(locationIndex).toBeGreaterThan(searchIndex);
    expect(businessSource).toContain('data-testid="directory-listing-types"');
    expect(businessSource).toContain('data-testid="directory-view-mode"');
    expect(source).toContain('title="Directory"');
  });

  it('uses the shared JUnited filter and empty-state styles', () => {
    expect(businessSource).toContain("`app-chip motion-press min-h-11 shrink-0 ${isActive ? 'app-chip-active' : ''}`");
    expect(businessSource).toContain('className="app-empty-state"');
    expect(businessSource).toContain('className="app-empty-state-icon"');
    expect(businessSource).not.toContain('cat.chipActive');
  });
});
