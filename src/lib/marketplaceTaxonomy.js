// Canonical marketplace vocabulary shared by the /Marketplace page and the
// Feed composer (UnifiedPostModal). Both write posts.marketplace_category /
// posts.pickup_option; keeping one list means listings always match the
// Marketplace category filter chips.

export const MARKETPLACE_CATEGORIES = [
  'Furniture',
  'Baby / Kids gear',
  'Clothing',
  'Judaica',
  'Books / school supplies',
  'Apartments / sublets',
  'Food / Shabbos extras',
  'Services',
  'Electronics',
  'Miscellaneous',
];

// Values written by older composer versions (and lowercase pickup options)
// normalized to the canonical vocabulary on read.
const CATEGORY_ALIASES = {
  'Baby / kids': 'Baby / Kids gear',
  Books: 'Books / school supplies',
  Food: 'Food / Shabbos extras',
  Other: 'Miscellaneous',
};

const PICKUP_ALIASES = {
  pickup: 'Pickup',
  delivery: 'Delivery possible',
  either: 'Pickup or delivery',
};

export function normalizeMarketplaceCategory(value) {
  if (!value) return 'Miscellaneous';
  return CATEGORY_ALIASES[value] || value;
}

export function normalizePickupOption(value) {
  if (!value) return '';
  return PICKUP_ALIASES[value] || value;
}
