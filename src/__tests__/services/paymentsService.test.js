import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/supabaseClient', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    from: vi.fn(),
  },
}));

import { supabase } from '@/api/supabaseClient';
import { paymentsService } from '@/services/paymentsService';

// Supabase query-builder fluent chain helper
function makeChain(finalResult) {
  const chain = {
    select: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(finalResult),
  };
  chain.select.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
}

Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost:3000' },
  writable: true,
});

beforeEach(() => vi.clearAllMocks());

// ── createCheckout ─────────────────────────────────────────────────────────────

describe('paymentsService.createCheckout', () => {
  it('invokes the correct edge function', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { checkoutUrl: 'https://stripe.com/c' }, error: null });
    await paymentsService.createCheckout({ amount: 1000 });
    expect(supabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', expect.anything());
  });
  it('merges payload with window.location.origin', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { checkoutUrl: 'https://stripe.com/c' }, error: null });
    await paymentsService.createCheckout({ amount: 500 });
    const [, opts] = supabase.functions.invoke.mock.calls[0];
    expect(opts.body).toMatchObject({ amount: 500, origin: 'http://localhost:3000' });
  });
  it('returns the data object on success', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { checkoutUrl: 'https://stripe.com/c' }, error: null });
    const result = await paymentsService.createCheckout({});
    expect(result.data.checkoutUrl).toBe('https://stripe.com/c');
  });
  it('throws when the edge function returns an error', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: new Error('Edge fn error') });
    await expect(paymentsService.createCheckout({})).rejects.toThrow('Edge fn error');
  });
});

// ── createSubscriptionCheckout ─────────────────────────────────────────────────

describe('paymentsService.createSubscriptionCheckout', () => {
  it('passes tier, interval, and origin to the edge function', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { checkoutUrl: 'https://stripe.com/s' }, error: null });
    await paymentsService.createSubscriptionCheckout({ tier: 'supporter', interval: 'monthly' });
    const [fn, opts] = supabase.functions.invoke.mock.calls[0];
    expect(fn).toBe('create-subscription-session');
    expect(opts.body).toEqual({ tier: 'supporter', interval: 'monthly', origin: 'http://localhost:3000' });
  });
  it('throws on error', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: new Error('Auth required') });
    await expect(
      paymentsService.createSubscriptionCheckout({ tier: 'supporter', interval: 'monthly' })
    ).rejects.toThrow('Auth required');
  });
});

// ── createPortalSession ────────────────────────────────────────────────────────

describe('paymentsService.createPortalSession', () => {
  it('calls create-portal-session with origin', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { portalUrl: 'https://billing.stripe.com' }, error: null });
    await paymentsService.createPortalSession();
    const [fn, opts] = supabase.functions.invoke.mock.calls[0];
    expect(fn).toBe('create-portal-session');
    expect(opts.body).toEqual({ origin: 'http://localhost:3000' });
  });
  it('throws on error', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: new Error('Portal error') });
    await expect(paymentsService.createPortalSession()).rejects.toThrow('Portal error');
  });
});

// ── createCommunityPlanCheckout ────────────────────────────────────────────────

describe('paymentsService.createCommunityPlanCheckout', () => {
  it('passes communityId and interval to the edge function', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { checkoutUrl: 'https://stripe.com/cp' }, error: null });
    await paymentsService.createCommunityPlanCheckout({ communityId: 'abc-123', interval: 'annual' });
    const [fn, opts] = supabase.functions.invoke.mock.calls[0];
    expect(fn).toBe('create-community-plan-checkout');
    expect(opts.body).toMatchObject({ communityId: 'abc-123', interval: 'annual' });
  });
  it('throws on error', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: new Error('Community error') });
    await expect(
      paymentsService.createCommunityPlanCheckout({ communityId: 'x', interval: 'monthly' })
    ).rejects.toThrow('Community error');
  });
});

// ── createCommunityPlanPortalSession ──────────────────────────────────────────

describe('paymentsService.createCommunityPlanPortalSession', () => {
  it('passes communityId and origin', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { portalUrl: 'https://...' }, error: null });
    await paymentsService.createCommunityPlanPortalSession({ communityId: 'abc-123' });
    const [fn, opts] = supabase.functions.invoke.mock.calls[0];
    expect(fn).toBe('create-community-plan-portal-session');
    expect(opts.body).toMatchObject({ communityId: 'abc-123', origin: 'http://localhost:3000' });
  });
});

// ── getActiveSubscription ─────────────────────────────────────────────────────

describe('paymentsService.getActiveSubscription', () => {
  it('queries the subscriptions table', async () => {
    const chain = makeChain({ data: null, error: null });
    supabase.from.mockReturnValue(chain);
    await paymentsService.getActiveSubscription();
    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
  });
  it('filters by active statuses', async () => {
    const chain = makeChain({ data: null, error: null });
    supabase.from.mockReturnValue(chain);
    await paymentsService.getActiveSubscription();
    expect(chain.in).toHaveBeenCalledWith('status', ['active', 'trialing', 'past_due']);
  });
  it('returns the subscription row on success', async () => {
    const sub = { id: 'sub_123', tier: 'supporter', status: 'active' };
    const chain = makeChain({ data: sub, error: null });
    supabase.from.mockReturnValue(chain);
    expect(await paymentsService.getActiveSubscription()).toEqual(sub);
  });
  it('returns null when no subscription exists', async () => {
    const chain = makeChain({ data: null, error: null });
    supabase.from.mockReturnValue(chain);
    expect(await paymentsService.getActiveSubscription()).toBeNull();
  });
  it('throws on a database error', async () => {
    const chain = makeChain({ data: null, error: new Error('DB error') });
    supabase.from.mockReturnValue(chain);
    await expect(paymentsService.getActiveSubscription()).rejects.toThrow('DB error');
  });
});
