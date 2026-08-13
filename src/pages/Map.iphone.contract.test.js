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
});
