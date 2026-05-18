export const COMMUNITY_PLAN_KEYS = {
  FREE: 'free',
  PREMIUM: 'community_premium',
};

export const COMMUNITY_PREMIUM_STATUSES = new Set(['active', 'trialing', 'past_due']);

export const PREMIUM_COMMUNITY_MODULES = new Set([
  'events',
  'resources',
  'listings',
  'chat',
]);

export function isCommunityPremium(community = {}) {
  return community?.plan_key === COMMUNITY_PLAN_KEYS.PREMIUM
    && COMMUNITY_PREMIUM_STATUSES.has(String(community?.plan_status || '').toLowerCase());
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
