/**
 * Community Premium plan interval config — shared UI source of truth.
 *
 * Dollar amounts are intentionally NOT stored here. Authoritative pricing lives
 * in Stripe and is enforced server-side by the create-community-plan-checkout
 * Edge Function via STRIPE_PRICE_COMMUNITY_PREMIUM_MONTHLY and
 * STRIPE_PRICE_COMMUNITY_PREMIUM_ANNUAL environment variables.
 *
 * When prices change: update the Stripe price IDs in Supabase function secrets.
 * Do not hardcode amounts client-side — they will drift and mislead users.
 */

export const COMMUNITY_PREMIUM_INTERVALS = [
  {
    key: 'monthly',
    label: 'Monthly',
    sublabel: 'Billed monthly',
  },
  {
    key: 'annual',
    label: 'Annual',
    sublabel: 'Billed annually · best value',
  },
];

/** Look up a single interval config by key ('monthly' | 'annual'). */
export function getCommunityPremiumInterval(key) {
  return COMMUNITY_PREMIUM_INTERVALS.find((i) => i.key === key) ?? null;
}
