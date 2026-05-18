import { supabase } from '@/api/supabaseClient';

export const paymentsService = {
  /**
   * Creates a one-time Stripe Checkout session via the create-checkout-session Edge Function.
   * Returns { data: { checkoutUrl } } on success.
   *
   * The Edge Function validates amounts server-side — never pass a raw
   * client-supplied price for named tiers.
   */
  async createCheckout(payload = {}) {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        ...payload,
        origin: window.location.origin,
      },
    });
    if (error) throw error;
    return { data };
  },

  /**
   * Creates a recurring Stripe Subscription Checkout session.
   * Requires the user to be authenticated.
   * Returns { data: { checkoutUrl } } on success.
   */
  async createSubscriptionCheckout({ tier, interval }) {
    const { data, error } = await supabase.functions.invoke('create-subscription-session', {
      body: { tier, interval, origin: window.location.origin },
    });
    if (error) throw error;
    return { data };
  },

  /**
   * Opens the Stripe Customer Portal for managing an existing subscription.
   * Returns { data: { portalUrl } } on success.
   */
  async createPortalSession() {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { origin: window.location.origin },
    });
    if (error) throw error;
    return { data };
  },

  /**
   * Creates a Stripe Checkout session for a community-scoped Premium plan.
   * This is separate from user-level supporter subscriptions.
   */
  async createCommunityPlanCheckout({ communityId, interval }) {
    const { data, error } = await supabase.functions.invoke('create-community-plan-checkout', {
      body: { communityId, interval, origin: window.location.origin },
    });
    if (error) throw error;
    return { data };
  },

  /**
   * Opens Stripe Customer Portal for a community's Premium plan.
   */
  async createCommunityPlanPortalSession({ communityId }) {
    const { data, error } = await supabase.functions.invoke('create-community-plan-portal-session', {
      body: { communityId, origin: window.location.origin },
    });
    if (error) throw error;
    return { data };
  },

  /**
   * Returns the user's most recent active/trialing/past_due subscription row,
   * or null if no active subscription exists.
   */
  async getActiveSubscription() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, tier, interval, status, current_period_end, cancel_at_period_end')
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

export default paymentsService;
