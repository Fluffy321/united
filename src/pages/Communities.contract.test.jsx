import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./Communities.jsx', import.meta.url), 'utf8');

describe('Communities production contract', () => {
  it('does not expose reseeding in the member experience', () => {
    expect(source).not.toContain('⟳ Reseed');
    expect(source).not.toContain('Reseed featured communities (admin only)');
    expect(source).not.toContain('reseedFeaturedCommunities');
  });

  it('uses one owned join action component across community cards', () => {
    expect(source).toContain('function CommunityJoinAction');
    expect((source.match(/<CommunityJoinAction/g) || []).length).toBeGreaterThanOrEqual(3);
  });
});
