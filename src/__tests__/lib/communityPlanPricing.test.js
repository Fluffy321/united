import { describe, it, expect } from 'vitest';
import {
  getCommunityPremiumInterval,
  formatPlanPrice,
  COMMUNITY_PREMIUM_INTERVALS,
} from '@/lib/communityPlanPricing';

describe('getCommunityPremiumInterval', () => {
  it('returns the monthly config for "monthly"', () => {
    const result = getCommunityPremiumInterval('monthly');
    expect(result).not.toBeNull();
    expect(result.key).toBe('monthly');
    expect(result.label).toBe('Monthly');
  });
  it('returns the annual config for "annual"', () => {
    const result = getCommunityPremiumInterval('annual');
    expect(result).not.toBeNull();
    expect(result.key).toBe('annual');
    expect(result.label).toBe('Annual');
  });
  it('returns null for an unknown key', () => {
    expect(getCommunityPremiumInterval('quarterly')).toBeNull();
  });
  it('returns null for undefined', () => {
    expect(getCommunityPremiumInterval(undefined)).toBeNull();
  });
  it('round-trips every key in COMMUNITY_PREMIUM_INTERVALS', () => {
    for (const interval of COMMUNITY_PREMIUM_INTERVALS) {
      expect(getCommunityPremiumInterval(interval.key)).toBe(interval);
    }
  });
  it('each interval has label and sublabel strings', () => {
    for (const interval of COMMUNITY_PREMIUM_INTERVALS) {
      expect(typeof interval.label).toBe('string');
      expect(typeof interval.sublabel).toBe('string');
    }
  });
});

describe('formatPlanPrice', () => {
  it('formats whole-dollar amounts without trailing cents', () => {
    expect(formatPlanPrice(1200, 'usd')).toBe('$12');
    expect(formatPlanPrice(9900, 'usd')).toBe('$99');
    expect(formatPlanPrice(100, 'usd')).toBe('$1');
  });
  it('includes cents for non-round amounts', () => {
    const result = formatPlanPrice(1250, 'usd');
    // minimumFractionDigits is 0, so the formatter may output "$12.5" or "$12.50"
    expect(result).toMatch(/12\.5/);
  });
  it('returns null for null amount', () => {
    expect(formatPlanPrice(null)).toBeNull();
  });
  it('returns null for undefined amount', () => {
    expect(formatPlanPrice(undefined)).toBeNull();
  });
  it('defaults to USD currency symbol when no currency provided', () => {
    expect(formatPlanPrice(1000)).toMatch(/\$/);
  });
  it('handles zero cents', () => {
    expect(formatPlanPrice(0, 'usd')).toBe('$0');
  });
  it('falls back to simple formatting when currency is invalid', () => {
    // Invalid currency triggers the catch block — should still return a string
    const result = formatPlanPrice(1000, 'INVALID_CURRENCY');
    expect(typeof result).toBe('string');
    expect(result).toContain('10');
  });
});
