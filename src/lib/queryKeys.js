// Centralized React Query key factory for post data.
//
// Every post-related query key in the app starts with ['posts'] so a single
// `queryClient.invalidateQueries({ queryKey: postKeys.all })` refreshes every
// view of post data. Related keys share prefixes:
//
//   ['posts']                                → everything
//   ['posts', 'feed']                        → the unified home feed
//   ['posts', 'community', id]               → every view of one community's posts
//   ['posts', 'community', id, '<view>']     → a specific community-scoped view
//
// Invalidating postKeys.community(id) therefore refreshes the community post
// list AND the pinned/content/analytics/shul views of the same data in one call.
//
// Legacy keys replaced by this factory:
//   ['unified-posts']                → postKeys.feed()
//   ['community-posts', id]          → postKeys.community(id)
//   ['community-pinned-post', id]    → postKeys.communityPinned(id)
//   ['community-content-posts', id]  → postKeys.communityContent(id)
//   ['community-hub-posts', id]      → postKeys.community(id) (prefix invalidation)
//   ['admin-analytics-posts', id]    → postKeys.communityAnalytics(id)
//   ['admin-ov-posts', id]           → postKeys.communityWeeklyCount(id)
//   ['shul-posts', id]               → postKeys.communityShul(id)
//   ['map-community-posts']          → postKeys.map()
//   ['user-posts', userId]           → postKeys.user(userId)
//   ['saved-posts', idsKey]          → postKeys.saved(idsKey) / postKeys.savedAll()

export const postKeys = {
  /** Root of every post query — invalidate to refresh all post data. */
  all: ['posts'],

  /** Unified home feed (infinite query). */
  feed: () => ['posts', 'feed'],

  /** Posts shown on the Map page. */
  map: () => ['posts', 'map'],

  /** Posts authored by one user (profile page). */
  user: (userId) => ['posts', 'user', userId],

  /** Prefix for all saved/bookmarked post lists — use for invalidation. */
  savedAll: () => ['posts', 'saved'],

  /** Saved/bookmarked posts for a specific set of post ids. */
  saved: (idsKey) => ['posts', 'saved', idsKey],

  /**
   * Prefix for every view of one community's posts. Invalidating this key
   * also refreshes the pinned/content/analytics/shul/weekly-count views below.
   */
  community: (communityId) => ['posts', 'community', communityId],

  /** The community's pinned/featured post. */
  communityPinned: (communityId) => ['posts', 'community', communityId, 'pinned'],

  /** Recent unpinned posts listed in the admin Content tab picker. */
  communityContent: (communityId) => ['posts', 'community', communityId, 'content'],

  /** Post rows used by the admin Analytics tab charts. */
  communityAnalytics: (communityId) => ['posts', 'community', communityId, 'analytics'],

  /** Posts-this-week count on the admin Overview tab. */
  communityWeeklyCount: (communityId) => ['posts', 'community', communityId, 'weekly-count'],

  /** Community posts rendered by the shul community page. */
  communityShul: (communityId) => ['posts', 'community', communityId, 'shul'],
};

export const feedPreferenceKeys = {
  all: ['feed-preferences'],
  user: (userId) => ['feed-preferences', userId],
  signals: (userId) => ['feed-preferences', userId, 'signals'],
};
