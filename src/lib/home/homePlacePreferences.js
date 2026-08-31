const EMPTY_PREFERENCES = Object.freeze({ boosts: {}, hidden: [] });
const STORAGE_PREFIX = 'junited:home-place-preferences:';

function normalize(value) {
  const boosts = Object.fromEntries(
    Object.entries(value?.boosts || {})
      .filter(([groupId, amount]) => groupId && Number.isFinite(Number(amount)) && Number(amount) !== 0)
      .map(([groupId, amount]) => [groupId, Math.max(-2, Math.min(2, Number(amount)))]),
  );
  const hidden = [...new Set((value?.hidden || []).filter(Boolean))];
  return { boosts, hidden };
}

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

export function loadHomePlacePreferences(userId) {
  if (typeof window === 'undefined' || !window.localStorage) return { ...EMPTY_PREFERENCES, boosts: {}, hidden: [] };
  try {
    return normalize(JSON.parse(window.localStorage.getItem(storageKey(userId)) || 'null'));
  } catch {
    return { boosts: {}, hidden: [] };
  }
}

export function saveHomePlacePreferences(userId, value) {
  const next = normalize(value);
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  }
  return next;
}

export function updateHomePlacePreference(value, groupId, action) {
  const current = normalize(value);
  const boosts = { ...current.boosts };
  const hidden = current.hidden.filter((id) => id !== groupId);

  if (action === 'hide') return { boosts, hidden: [...hidden, groupId] };

  const direction = action === 'more' ? 1 : action === 'less' ? -1 : 0;
  const amount = Math.max(-2, Math.min(2, (boosts[groupId] || 0) + direction));
  if (amount === 0) delete boosts[groupId];
  else boosts[groupId] = amount;
  return { boosts, hidden };
}

export function rankHomeListings(listings = [], value) {
  const preferences = normalize(value);
  const hidden = new Set(preferences.hidden);
  return listings
    .map((listing, index) => ({ listing, index }))
    .filter(({ listing }) => !hidden.has(listing.groupId))
    .sort((left, right) => (
      (preferences.boosts[right.listing.groupId] || 0) - (preferences.boosts[left.listing.groupId] || 0)
      || left.index - right.index
    ))
    .map(({ listing }) => listing);
}

export function homePlaceReason(value, groupId) {
  const amount = normalize(value).boosts[groupId] || 0;
  if (amount > 0) return 'You asked for more like this';
  if (amount < 0) return 'You asked for fewer like this';
  return '';
}
