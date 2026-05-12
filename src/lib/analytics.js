/**
 * Analytics & error tracking stub.
 *
 * Wires up to Sentry and PostHog when the env vars are set AND the packages
 * are installed.  Silently no-ops otherwise — the app never fails because
 * analytics isn't available.
 *
 * To enable Sentry:  npm install @sentry/react  + set VITE_SENTRY_DSN
 * To enable PostHog: npm install posthog-js     + set VITE_POSTHOG_KEY
 *
 * Private data rules:
 * - Never send message contents, reflections, or personal text.
 * - Never send passwords, tokens, or raw PII.
 * - User ID is used for error grouping only.
 */

// Runtime references set by initAnalytics().
let sentry = null;
let posthog = null;

function optionalImport(packageName) {
  // Keep optional analytics packages out of Vite's build-time resolver.
  const importer = new Function('packageName', 'return import(packageName)');
  return importer(packageName);
}

// ── Sentry ────────────────────────────────────────────────────────────────────

async function loadSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  try {
    const mod = await optionalImport('@sentry/react');
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
      beforeSend(event) {
        if (event.request?.data) {
          const safe = { ...event.request.data };
          ['content', 'body', 'message', 'text', 'reflection', 'notes'].forEach(
            (k) => { if (k in safe) safe[k] = '[redacted]'; }
          );
          event.request.data = safe;
        }
        return event;
      },
    });
    sentry = mod;
  } catch {
    // Sentry package not installed or failed to init — safe to ignore.
  }
}

export function captureError(error, context = {}) {
  if (import.meta.env.DEV) console.error('[Analytics] error captured:', error, context);
  if (!sentry) return;
  try {
    sentry.withScope((scope) => {
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
      sentry.captureException(error);
    });
  } catch {}
}

export function setSentryUser(userId) {
  if (!sentry) return;
  try { sentry.setUser(userId ? { id: userId } : null); } catch {}
}

// ── PostHog ───────────────────────────────────────────────────────────────────

async function loadPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
  if (!key) return;
  try {
    const mod = await optionalImport('posthog-js');
    const ph = mod.default || mod;
    ph.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      persistence: 'localStorage+cookie',
    });
    posthog = ph;
  } catch {
    // posthog-js not installed — safe to ignore.
  }
}

/**
 * Track a safe product event.
 *
 * Safe events: 'signed_up', 'completed_onboarding', 'posted_request',
 *   'sent_offer', 'joined_community', 'sent_message', 'viewed_feed'
 *
 * Never track message content, bio text, reflections, or PII.
 */
export function track(event, properties = {}) {
  if (import.meta.env.DEV) console.info('[Analytics] track:', event, properties);
  if (!posthog) return;
  try { posthog.capture(event, properties); } catch {}
}

export function identifyUser(userId, traits = {}) {
  if (!userId) return;
  setSentryUser(userId);
  if (!posthog) return;
  try {
    const safe = {};
    ['role', 'city', 'age_range', 'is_verified', 'communities_joined_count'].forEach((k) => {
      if (k in traits) safe[k] = traits[k];
    });
    posthog.identify(userId, safe);
  } catch {}
}

export function resetAnalyticsUser() {
  setSentryUser(null);
  if (!posthog) return;
  try { posthog.reset(); } catch {}
}

// ── Init (call once at app startup) ──────────────────────────────────────────

export async function initAnalytics() {
  await Promise.allSettled([loadSentry(), loadPostHog()]);
}
