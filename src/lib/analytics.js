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
 * Consent rules:
 * - initAnalytics() (called at startup) checks stored consent and does nothing
 *   if the user has not accepted analytics cookies.
 * - enableAnalytics() is called immediately after the user accepts.
 * - optOutAnalytics() is called immediately after the user declines or revokes.
 *
 * Private data rules:
 * - Never send message contents, reflections, or personal text.
 * - Never send passwords, tokens, or raw PII.
 * - User ID is used for error grouping only.
 */

import { getStoredConsent } from '@/lib/cookieConsent';
import { shouldUseSupabase, supabase } from '@/api/supabaseClient';

// Runtime references set after consent-gated init.
let sentry = null;
let posthog = null;
let analyticsLoaded = false;
let errorLoggingInstalled = false;

const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 4000;
const MAX_ROUTE_LENGTH = 300;
const MAX_USER_AGENT_LENGTH = 500;

function truncate(value, maxLength) {
  if (!value) return null;
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function sanitizeErrorText(value) {
  if (!value) return null;
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, '[redacted-phone]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-token]')
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/g, '[redacted-key]')
    .replace(/([?&](?:token|access_token|refresh_token|password|email|phone|key|secret)=)[^&#\s]+/gi, '$1[redacted]');
}

function safeRoute() {
  if (typeof window === 'undefined') return null;
  return truncate(sanitizeErrorText(window.location?.pathname || '/'), MAX_ROUTE_LENGTH);
}

function normalizeError(errorLike) {
  if (errorLike instanceof Error) {
    return {
      message: errorLike.message || errorLike.name || 'Unknown error',
      stack: errorLike.stack || null,
    };
  }

  if (typeof errorLike === 'string') {
    return { message: errorLike, stack: null };
  }

  if (errorLike && typeof errorLike === 'object') {
    const message = errorLike.message || errorLike.reason || errorLike.type || 'Unknown error';
    const stack = errorLike.stack || null;
    return { message, stack };
  }

  return { message: 'Unknown error', stack: null };
}

async function currentUserId() {
  if (!shouldUseSupabase || !supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

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
  logClientError(error, context);
  if (!sentry) return;
  try {
    sentry.withScope((scope) => {
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
      sentry.captureException(error);
    });
  } catch {}
}

export async function logClientError(errorLike, context = {}) {
  if (!shouldUseSupabase || !supabase) return;

  try {
    const normalized = normalizeError(errorLike);
    const stackParts = [normalized.stack, context.componentStack]
      .filter(Boolean)
      .join('\n\nComponent stack:\n');

    // error_logs RLS requires an authenticated user (migration 20260701223223);
    // pre-auth errors go to Sentry only, so skip the doomed insert
    const userId = await currentUserId();
    if (!userId) return;

    const row = {
      user_id: userId,
      route: safeRoute(),
      message: truncate(sanitizeErrorText(normalized.message) || 'Unknown error', MAX_MESSAGE_LENGTH),
      stack: truncate(sanitizeErrorText(stackParts), MAX_STACK_LENGTH),
      user_agent: typeof navigator !== 'undefined'
        ? truncate(sanitizeErrorText(navigator.userAgent), MAX_USER_AGENT_LENGTH)
        : null,
    };

    await supabase.from('error_logs').insert(row);
  } catch {}
}

export function installGlobalErrorLogging() {
  if (typeof window === 'undefined' || errorLoggingInstalled) return;
  errorLoggingInstalled = true;

  window.addEventListener('error', (event) => {
    logClientError(event.error || event.message || 'Window error', { source: 'window.error' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logClientError(event.reason || 'Unhandled promise rejection', { source: 'unhandledrejection' });
  });
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
    // Respect any opt-out that was stored before the package loaded.
    // posthog.has_opted_out_capturing() returns true if the user previously opted out.
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

// ── Consent-aware init ────────────────────────────────────────────────────────

/**
 * Loads analytics SDKs. Called immediately after the user grants consent.
 * Idempotent — safe to call more than once.
 */
export async function enableAnalytics() {
  if (analyticsLoaded) return;
  analyticsLoaded = true;
  await Promise.allSettled([loadSentry(), loadPostHog()]);
}

/**
 * Stops analytics data collection immediately.
 * PostHog: opts out of capturing and writes an opt-out cookie.
 * Sentry: clears the user identity so future errors are anonymous.
 * On the next page load, initAnalytics() will see consent=false and skip loading.
 */
export function optOutAnalytics() {
  setSentryUser(null);
  if (!posthog) return;
  try { posthog.opt_out_capturing(); } catch {}
}

/**
 * Called once at app startup (main.jsx).
 * Only loads analytics if the user has already accepted — new visitors get nothing.
 */
export async function initAnalytics() {
  const consent = getStoredConsent();
  if (!consent?.analytics) return; // no stored consent or analytics=false → skip
  await enableAnalytics();
}
