import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve('src/components/mitzvah/MitzvahMap.jsx'), 'utf8');

describe('MitzvahMap unified directory contract', () => {
  it('accepts the trusted directory alongside help and community points', () => {
    expect(source).toContain('directoryPoints = []');
    expect(source).toContain("activeLayers.has('help') ? requestPoints");
    expect(source).toContain("activeLayers.has('community') ? personalizedPoints");
    expect(source).toContain("activeLayers.has('places') ? trustedPlaces");
  });

  it('uses old static points only as a safe fallback', () => {
    expect(source).toContain('includeStaticPoints && directoryPoints.length === 0');
  });

  it('names every interactive marker for keyboard and screen-reader users', () => {
    expect(source).toContain("title={point.title || 'Map location'}");
    expect(source).toContain("alt={point.title || 'Map location'}");
    expect(source).toContain('keyboard={true}');
  });

  it('skips coordinate-less points without throwing', () => {
    expect(source).toContain('if (!point.location_lat || !point.location_lng) return null');
  });
});
