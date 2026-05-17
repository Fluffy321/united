import { supabase } from '@/api/supabaseClient';

export const paymentsService = {
  /**
   * Creates a Stripe Checkout session via the create-checkout-session Edge Function
   * and returns { data: { checkoutUrl } } on success.
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
};

export default paymentsService;
