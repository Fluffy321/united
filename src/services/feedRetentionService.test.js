import { beforeEach, describe, it, expect, vi } from 'vitest';

vi.mock('@/services/entityServices', () => ({
  createFeedEngagementEvent: vi.fn(),
  createFeedUserPreference: vi.fn(),
  filterDailyFeedPrompt: vi.fn(),
  filterFeedEngagementEvent: vi.fn(),
  filterFeedUserPreference: vi.fn(),
  filterFiveTownsBrief: vi.fn(),
  updateFeedUserPreference: vi.fn(),
}));

const { feedRetentionService } = await import('./feedRetentionService');
const {
  createFeedEngagementEvent,
  createFeedUserPreference,
  filterFeedEngagementEvent,
  filterFeedUserPreference,
} = await import('@/services/entityServices');

const freshPost = (extra = {}) => ({
  id: 'p1',
  type: 'feed',
  likes_count: 0,
  comments_count: 0,
  created_date: new Date().toISOString(),
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('feedRetentionService preferences', () => {
  it('normalizes a missing preference row to balanced canonical defaults', async () => {
    filterFeedUserPreference.mockResolvedValue([]);

    await expect(feedRetentionService.getPreferences('user-1')).resolves.toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        engagement_level: 'balanced',
        interests: ['local', 'helping', 'events', 'jewish_times'],
      })
    );
  });

  it('sanitizes category interests and engagement level before saving', async () => {
    filterFeedUserPreference.mockResolvedValue([]);
    createFeedUserPreference.mockImplementation(async (payload) => payload);

    await feedRetentionService.savePreferences('user-1', {
      interests: ['minyanim', 'unknown', 'helping'],
      engagement_level: 'maximum',
    });

    expect(createFeedUserPreference).toHaveBeenCalledWith({
      user_id: 'user-1',
      interests: ['minyanim', 'helping'],
      engagement_level: 'balanced',
    });
  });

  it('reads only recent allowed category-learning events for the signed-in user', async () => {
    filterFeedEngagementEvent.mockResolvedValue([
      { event_type: 'save', metadata: { category_id: 'local' } },
      { event_type: 'reply', metadata: { category_id: 'helping' } },
      { event_type: 'like', metadata: { category_id: 'events' } },
    ]);

    await expect(feedRetentionService.getCategorySignals('user-1')).resolves.toEqual([
      { event_type: 'save', metadata: { category_id: 'local' } },
      { event_type: 'reply', metadata: { category_id: 'helping' } },
    ]);
    expect(filterFeedEngagementEvent).toHaveBeenCalledWith(
      { user_id: 'user-1' },
      '-created_at',
      100
    );
  });

  it('stores only canonical category IDs in engagement metadata', async () => {
    createFeedEngagementEvent.mockImplementation(async (payload) => payload);

    await feedRetentionService.recordEvent({
      userId: 'user-1',
      post: freshPost(),
      eventType: 'category_open',
      metadata: { category_id: 'unknown', source: 'feed' },
    });

    expect(createFeedEngagementEvent).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { source: 'feed' } })
    );
  });
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
