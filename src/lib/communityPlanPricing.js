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

/**
 * Format a Stripe unit_amount (cents) + currency into a compact display string.
 * Examples: (1200, 'usd') → '$12', (9900, 'usd') → '$99'
 */
export function formatPlanPrice(amountCents, currency = 'usd') {
  if (amountCents == null) return null;
  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
    // Strip unnecessary ".00" that some locales produce for round amounts
    return formatted.replace(/\.00$/, '');
  } catch {
    return `$${(amountCents / 100).toFixed(0)}`;
  }
}
