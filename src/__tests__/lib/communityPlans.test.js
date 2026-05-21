import { describe, it, expect } from 'vitest';
import {
  isCommunityPremium,
  canUseCommunityMarketplace,
  canUseCommunityChat,
  canCreateCommunityEvent,
  canCreateCommunityResource,
  countUpcomingPublishedCommunityEvents,
  isUpcomingPublishedCommunityEvent,
  getCommunityEventStartTime,
  getCommunityPlanStatusLabel,
  formatPlanDate,
  FREE_COMMUNITY_LIMITS,
  COMMUNITY_PLAN_KEYS,
} from '@/lib/communityPlans';

const premium = { plan_key: COMMUNITY_PLAN_KEYS.PREMIUM, plan_status: 'active' };

describe('isCommunityPremium', () => {
  it('returns true for active premium plan', () => {
    expect(isCommunityPremium({ plan_key: COMMUNITY_PLAN_KEYS.PREMIUM, plan_status: 'active' })).toBe(true);
  });
  it('returns true for trialing premium plan', () => {
    expect(isCommunityPremium({ plan_key: COMMUNITY_PLAN_KEYS.PREMIUM, plan_status: 'trialing' })).toBe(true);
  });
  it('returns true for past_due premium plan', () => {
    expect(isCommunityPremium({ plan_key: COMMUNITY_PLAN_KEYS.PREMIUM, plan_status: 'past_due' })).toBe(true);
  });
  it('returns false for canceled premium plan', () => {
    expect(isCommunityPremium({ plan_key: COMMUNITY_PLAN_KEYS.PREMIUM, plan_status: 'canceled' })).toBe(false);
  });
  it('returns false for free plan', () => {
    expect(isCommunityPremium({ plan_key: COMMUNITY_PLAN_KEYS.FREE, plan_status: 'active' })).toBe(false);
  });
  it('returns false for empty community object', () => {
    expect(isCommunityPremium({})).toBe(false);
  });
  it('is case-insensitive for plan_status', () => {
    expect(isCommunityPremium({ plan_key: COMMUNITY_PLAN_KEYS.PREMIUM, plan_status: 'ACTIVE' })).toBe(true);
    expect(isCommunityPremium({ plan_key: COMMUNITY_PLAN_KEYS.PREMIUM, plan_status: 'Past_Due' })).toBe(true);
  });
});

describe('canUseCommunityMarketplace', () => {
  it('returns true for premium community', () => {
    expect(canUseCommunityMarketplace(premium)).toBe(true);
  });
  it('returns false for free community', () => {
    expect(canUseCommunityMarketplace({})).toBe(false);
  });
});

describe('canUseCommunityChat', () => {
  it('returns true for premium community', () => {
    expect(canUseCommunityChat(premium)).toBe(true);
  });
  it('returns false for free community', () => {
    expect(canUseCommunityChat({})).toBe(false);
  });
});

describe('canCreateCommunityEvent', () => {
  it('allows premium communities to create events regardless of count', () => {
    expect(canCreateCommunityEvent(premium, 100)).toBe(true);
  });
  it('allows free communities below the limit', () => {
    expect(canCreateCommunityEvent({}, FREE_COMMUNITY_LIMITS.upcomingPublishedEvents - 1)).toBe(true);
  });
  it('blocks free communities at the limit', () => {
    expect(canCreateCommunityEvent({}, FREE_COMMUNITY_LIMITS.upcomingPublishedEvents)).toBe(false);
  });
  it('blocks free communities over the limit', () => {
    expect(canCreateCommunityEvent({}, FREE_COMMUNITY_LIMITS.upcomingPublishedEvents + 1)).toBe(false);
  });
  it('treats missing count as 0', () => {
    expect(canCreateCommunityEvent({})).toBe(true);
  });
});

describe('canCreateCommunityResource', () => {
  it('allows premium communities regardless of count', () => {
    expect(canCreateCommunityResource(premium, 999)).toBe(true);
  });
  it('allows free communities below the limit', () => {
    expect(canCreateCommunityResource({}, FREE_COMMUNITY_LIMITS.totalResources - 1)).toBe(true);
  });
  it('blocks free communities at the limit', () => {
    expect(canCreateCommunityResource({}, FREE_COMMUNITY_LIMITS.totalResources)).toBe(false);
  });
  it('treats missing count as 0', () => {
    expect(canCreateCommunityResource({})).toBe(true);
  });
});

describe('getCommunityEventStartTime', () => {
  it('reads starts_at first', () => {
    const iso = '2025-06-01T10:00:00Z';
    expect(getCommunityEventStartTime({ starts_at: iso })).toBe(new Date(iso).getTime());
  });
  it('falls back to start_date + start_time', () => {
    const t = getCommunityEventStartTime({ start_date: '2025-06-01', start_time: '10:00:00' });
    expect(typeof t).toBe('number');
    expect(t).toBeGreaterThan(0);
  });
  it('falls back to event_date + event_time', () => {
    const t = getCommunityEventStartTime({ event_date: '2025-06-01', event_time: '10:00:00' });
    expect(typeof t).toBe('number');
    expect(t).toBeGreaterThan(0);
  });
  it('returns null for empty event', () => {
    expect(getCommunityEventStartTime({})).toBeNull();
  });
  it('returns null for invalid date string', () => {
    expect(getCommunityEventStartTime({ starts_at: 'not-a-date' })).toBeNull();
  });
});

describe('isUpcomingPublishedCommunityEvent', () => {
  const future = Date.now() + 1_000_000;
  const past = Date.now() - 1_000_000;

  it('returns true for a published event in the future', () => {
    expect(isUpcomingPublishedCommunityEvent({
      starts_at: new Date(future).toISOString(),
      status: 'published',
    })).toBe(true);
  });
  it('returns false for a published event in the past', () => {
    expect(isUpcomingPublishedCommunityEvent({
      starts_at: new Date(past).toISOString(),
      status: 'published',
    })).toBe(false);
  });
  it('returns false for a draft event in the future', () => {
    expect(isUpcomingPublishedCommunityEvent({
      starts_at: new Date(future).toISOString(),
      status: 'draft',
    })).toBe(false);
  });
  it('defaults status to published when absent', () => {
    expect(isUpcomingPublishedCommunityEvent({ starts_at: new Date(future).toISOString() })).toBe(true);
  });
});

describe('countUpcomingPublishedCommunityEvents', () => {
  const future = Date.now() + 1_000_000;
  const past = Date.now() - 1_000_000;

  it('counts only upcoming published events', () => {
    const events = [
      { starts_at: new Date(future).toISOString(), status: 'published' },
      { starts_at: new Date(future + 1000).toISOString(), status: 'published' },
      { starts_at: new Date(past).toISOString(), status: 'published' },
      { starts_at: new Date(future).toISOString(), status: 'draft' },
    ];
    expect(countUpcomingPublishedCommunityEvents(events)).toBe(2);
  });
  it('returns 0 for empty list', () => {
    expect(countUpcomingPublishedCommunityEvents([])).toBe(0);
  });
  it('returns 0 when all events are past', () => {
    const events = [
      { starts_at: new Date(past).toISOString(), status: 'published' },
      { starts_at: new Date(past - 1000).toISOString(), status: 'published' },
    ];
    expect(countUpcomingPublishedCommunityEvents(events)).toBe(0);
  });
});

describe('getCommunityPlanStatusLabel', () => {
  it.each([
    ['active', 'Premium active'],
    ['trialing', 'Premium trial'],
    ['past_due', 'Payment issue'],
    ['incomplete', 'Checkout incomplete'],
    ['canceled', 'Canceled'],
    ['free', 'Free'],
  ])('status "%s" → "%s"', (status, expected) => {
    expect(getCommunityPlanStatusLabel(status)).toBe(expected);
  });
  it('returns Free for null', () => {
    expect(getCommunityPlanStatusLabel(null)).toBe('Free');
  });
  it('returns Free for undefined', () => {
    expect(getCommunityPlanStatusLabel(undefined)).toBe('Free');
  });
});

describe('formatPlanDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatPlanDate('2025-06-15T00:00:00Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2025/);
  });
  it('returns null for null', () => {
    expect(formatPlanDate(null)).toBeNull();
  });
  it('returns null for undefined', () => {
    expect(formatPlanDate(undefined)).toBeNull();
  });
});
