/**
 * Cookie consent — single source of truth.
 *
 * The consent record lives in localStorage. Both the banner and Settings
 * read/write through these helpers so there is only one storage key.
 */

export const CONSENT_KEY = 'junited_cookie_consent';
export const CONSENT_VERSION = 1;

/**
 * Returns the stored consent record, or null if the user has never decided.
 * @returns {{ essential: true, analytics: boolean, timestamp: string, version: number } | null}
 */
export function getStoredConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** True once the user has made any choice (accept or decline). */
export function hasConsentDecision() {
  return getStoredConsent() !== null;
}

/**
 * Persists the user's analytics preference.
 * Does NOT touch analytics SDKs — callers decide whether to enable/disable them.
 */
export function saveConsent(analyticsEnabled) {
  const consent = {
    essential: true,
    analytics: Boolean(analyticsEnabled),
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Storage blocked (incognito strict mode) — consent won't persist but we carry on.
  }
  return consent;
}
