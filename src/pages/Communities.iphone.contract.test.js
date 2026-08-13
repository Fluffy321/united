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

  it('only calls filtered Discover empty when a filter is actually active', () => {
    expect(source).toContain('const noResults = hasFilter && sortedCommunities.length === 0 && groups.length === 0');
  });

  it('does not promise three recommendations when fewer than three exist', () => {
    expect(source).toContain("recommendedRooms.length === 3 ? 'Three useful places to start.' : 'Useful places to start.'");
  });

  it('clears Discover-only category filters when returning to joined rooms', () => {
    expect(source).toContain("if (tabId === 'mine') setActiveCategory('all')");
    expect(source).toContain('onClick={() => changeCommunityMode(tab.id)}');
  });
});
