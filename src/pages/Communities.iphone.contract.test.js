import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./Communities.jsx', import.meta.url), 'utf8');

describe('Communities iPhone hierarchy contract', () => {
  it('puts the mode choice and real communities before secondary tools', () => {
    const modeIndex = source.indexOf('data-testid="community-mode-switch"');
    const searchIndex = source.indexOf('data-testid="community-search"');
    const resultsIndex = source.indexOf('data-testid="community-results"');
    const toolsIndex = source.indexOf('data-testid="community-jewish-tools"');

    expect(modeIndex).toBeGreaterThan(-1);
    expect(searchIndex).toBeGreaterThan(modeIndex);
    expect(resultsIndex).toBeGreaterThan(searchIndex);
    expect(toolsIndex).toBeGreaterThan(resultsIndex);
  });

  it('shows three recommendations before the category rail and remaining catalog', () => {
    expect(source).toContain('const recommendedRooms = rooms.slice(0, 3)');
    expect(source).toContain('const remainingRooms = rooms.slice(3)');
    expect(source).toContain('Recommended for you');
    expect(source).toContain('More communities');
    expect(source).toContain('categoryRail');
  });

  it('does not keep the old competing featured hero above the main result', () => {
    expect(source).not.toContain("import FeaturedHeroCard from '@/components/communities/FeaturedHeroCard.jsx'");
    expect(source).not.toContain("import FeaturedSecondaryCard from '@/components/communities/FeaturedSecondaryCard.jsx'");
    expect(source).not.toContain('mainFeatured');
    expect(source).not.toContain('secondaryFeatured');
  });
});
