import { describe, expect, it } from 'vitest';
import { resolvePublishingCommunities } from './publishingCommunities';

describe('resolvePublishingCommunities', () => {
  it('uses the real catalog name for each active membership', () => {
    expect(resolvePublishingCommunities(
      [{ community_id: 'c1', status: 'active' }],
      [{ id: 'c1', name: 'Five Towns News & Updates' }],
    )).toEqual([{ id: 'c1', name: 'Five Towns News & Updates' }]);
  });

  it('keeps a membership name when the catalog has not loaded yet', () => {
    expect(resolvePublishingCommunities(
      [{ community_id: 'c1', community_name: 'Young Israel of Woodmere' }],
      [],
    )).toEqual([{ id: 'c1', name: 'Young Israel of Woodmere' }]);
  });

  it('drops inactive, missing, and duplicate memberships', () => {
    expect(resolvePublishingCommunities([
      { community_id: 'c1', status: 'active' },
      { community_id: 'c1', status: 'active' },
      { community_id: 'c2', status: 'inactive' },
      { status: 'active' },
    ], [
      { id: 'c1', name: 'Five Towns News & Updates' },
      { id: 'c2', name: 'Hidden Community' },
    ])).toEqual([{ id: 'c1', name: 'Five Towns News & Updates' }]);
  });

  it('uses a plain honest fallback instead of Joined community', () => {
    expect(resolvePublishingCommunities([{ community_id: 'c1' }], []))
      .toEqual([{ id: 'c1', name: 'Community' }]);
  });
});
