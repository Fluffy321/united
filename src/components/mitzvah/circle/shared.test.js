import { describe, expect, it } from 'vitest';
import { normalizeRequest, splitPublicHelpPosts } from './shared';

describe('public Help directions', () => {
  it('keeps existing requests as needs and preserves explicit public offers', () => {
    expect(normalizeRequest({ id: 'legacy' }).direction).toBe('need');
    expect(normalizeRequest({ id: 'offer', direction: 'offer' }).direction).toBe('offer');
    expect(normalizeRequest({ id: 'ride-offer', ride_direction: 'offering' }).direction).toBe('offer');
  });

  it('splits only public request rows without consuming private response records', () => {
    const result = splitPublicHelpPosts([
      { id: 'need-1', direction: 'need' },
      { id: 'offer-1', direction: 'offer' },
    ]);

    expect(result.needs.map(({ id }) => id)).toEqual(['need-1']);
    expect(result.offers.map(({ id }) => id)).toEqual(['offer-1']);
    expect(splitPublicHelpPosts(undefined)).toEqual({ needs: [], offers: [] });
  });
});
