export const COMMUNITY_PLAN_KEYS = {
  FREE: 'free',
  PREMIUM: 'community_premium',
};

export const COMMUNITY_PREMIUM_STATUSES = new Set(['active', 'trialing', 'past_due']);

export const FREE_COMMUNITY_LIMITS = {
  upcomingPublishedEvents: 3,
  totalResources: 10,
};

export const PREMIUM_COMMUNITY_MODULES = new Set([
  'listings',
]);

export function isCommunityPremium(community = {}) {
  return community?.plan_key === COMMUNITY_PLAN_KEYS.PREMIUM
    && COMMUNITY_PREMIUM_STATUSES.has(String(community?.plan_status || '').toLowerCase());
}

export function canUseCommunityEvents() {
  return true;
}

export function canUseCommunityResources() {
  return true;
}

export function canUseCommunityMarketplace(community = {}) {
  return isCommunityPremium(community);
}

export function canUseCommunityChat(community = {}) {
  return Boolean(community?.allow_group_chat);
}

export function getCommunityEventStartTime(event = {}) {
  const raw = event.starts_at
    || (event.start_date ? `${event.start_date}T${event.start_time || '00:00:00'}` : null)
    || (event.event_date ? `${event.event_date}T${event.event_time || '00:00:00'}` : null);
  if (!raw) return null;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : null;
}

export function isUpcomingPublishedCommunityEvent(event = {}, now = Date.now()) {
  const status = String(event.status || 'published').toLowerCase();
  if (status !== 'published') return false;
  const startTime = getCommunityEventStartTime(event);
  return startTime !== null && startTime >= now;
}

export function countUpcomingPublishedCommunityEvents(events = [], now = Date.now()) {
  return events.filter((event) => isUpcomingPublishedCommunityEvent(event, now)).length;
}

export function canCreateCommunityEvent(community = {}, upcomingPublishedEventCount = 0) {
  return isCommunityPremium(community)
    || Number(upcomingPublishedEventCount || 0) < FREE_COMMUNITY_LIMITS.upcomingPublishedEvents;
}

export function canCreateCommunityResource(community = {}, resourceCount = 0) {
  return isCommunityPremium(community)
    || Number(resourceCount || 0) < FREE_COMMUNITY_LIMITS.totalResources;
}

export function getCommunityPlanStatusLabel(status) {
  const normalized = String(status || 'free').toLowerCase();
  if (normalized === 'active') return 'Premium active';
  if (normalized === 'trialing') return 'Premium trial';
  if (normalized === 'past_due') return 'Payment issue';
  if (normalized === 'incomplete') return 'Checkout incomplete';
  if (normalized === 'canceled') return 'Canceled';
  return 'Free';
}

export function formatPlanDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}
