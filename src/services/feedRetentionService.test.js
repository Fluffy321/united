import { describe, it, expect, vi } from 'vitest';

vi.mock('@/services/entityServices', () => ({
  createFeedEngagementEvent: vi.fn(),
  createFeedUserPreference: vi.fn(),
  filterDailyFeedPrompt: vi.fn(),
  filterFeedUserPreference: vi.fn(),
  filterFiveTownsBrief: vi.fn(),
  updateFeedUserPreference: vi.fn(),
}));

const { feedRetentionService } = await import('./feedRetentionService');

const freshPost = (extra = {}) => ({
  id: 'p1',
  type: 'feed',
  likes_count: 0,
  comments_count: 0,
  created_date: new Date().toISOString(),
  ...extra,
});

describe('feedRetentionService.scorePost', () => {
  it('boosts posts from joined communities', () => {
    const joined = feedRetentionService.scorePost(
      freshPost({ community_id: 'c1' }),
      { joinedCommunityIds: new Set(['c1']) }
    );
    const notJoined = feedRetentionService.scorePost(
      freshPost({ community_id: 'c2' }),
      { joinedCommunityIds: new Set(['c1']) }
    );
    expect(joined).toBeGreaterThan(notJoined);
  });

  it('boosts posts matching user interests', () => {
    const matching = feedRetentionService.scorePost(
      freshPost({ body: 'Pickup basketball game tonight' }),
      { userInterests: ['basketball'] }
    );
    const notMatching = feedRetentionService.scorePost(
      freshPost({ body: 'Pickup basketball game tonight' }),
      { userInterests: ['chess'] }
    );
    expect(matching).toBeGreaterThan(notMatching);
  });

  it('decays older posts below fresh ones with equal engagement', () => {
    const fresh = feedRetentionService.scorePost(freshPost({ likes_count: 5 }), {});
    const stale = feedRetentionService.scorePost(
      freshPost({ likes_count: 5, created_date: new Date(Date.now() - 96 * 3600000).toISOString() }),
      {}
    );
    expect(fresh).toBeGreaterThan(stale);
  });

  it('boosts posts located in the primary network city', () => {
    const local = feedRetentionService.scorePost(
      freshPost({ city: 'Woodmere' }),
      { primaryNetwork: { cityPreset: 'Woodmere' } }
    );
    const elsewhere = feedRetentionService.scorePost(
      freshPost({ city: 'Brooklyn' }),
      { primaryNetwork: { cityPreset: 'Woodmere' } }
    );
    expect(local).toBeGreaterThan(elsewhere);
  });

  it('never returns NaN for malformed posts', () => {
    expect(Number.isNaN(feedRetentionService.scorePost({}, {}))).toBe(false);
    expect(Number.isNaN(feedRetentionService.scorePost({ created_date: 'garbage' }, {}))).toBe(false);
  });
});
