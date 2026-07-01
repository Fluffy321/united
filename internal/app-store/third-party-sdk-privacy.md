# Third-Party SDK Privacy Manifest Audit — JUnited

Prepared 2026-07-01. Covers iosReadiness task `third-party-sdk-privacy`.
Scope: which of JUnited's dependencies access Apple's "required reason APIs" and need their own privacy manifest once wrapped in Capacitor for iOS.

## What's actually in the app

From `package.json`, beyond the standard React/Vite/Radix stack:

| Package | Purpose | Required-reason API risk |
|---|---|---|
| `@supabase/supabase-js` | Backend client (auth, DB, storage, realtime, edge functions) | Low. Pure network (HTTPS) + browser storage (localStorage/IndexedDB for the session). Network access itself is not a "required reason API." |
| `@sentry/react` | Error/crash tracking | **Yes** — Sentry's Cocoa SDK (bundled by `@sentry/capacitor` / `@sentry/react-native`-style native layers if added) reads `UserDefaults` and disk space/file timestamps for crash context. |
| `posthog-js` | Product analytics | **Yes** — the PostHog iOS SDK reads `UserDefaults` for session/anonymous-ID persistence, similar reason category to Sentry. |
| `@capacitor/core`, `@capacitor/ios` | Native shell | Capacitor core itself declares its own privacy manifest (has shipped one since Capacitor 5). |
| `@tanstack/react-query`, `react-router-dom`, `lucide-react`, `date-fns`, `sonner`, Radix UI | Pure JS/UI, run inside the WebView | None — these never touch native iOS APIs directly; they're irrelevant to the privacy manifest system, which only applies to compiled/native code (Swift/Obj-C frameworks and their embedded binaries), not JS running in a WKWebView. |

**Important framing:** most of JUnited's actual data access (camera, photo library, push notifications) happens through Capacitor's own plugins, not through these npm packages directly — see `privacy-manifest` task / `PrivacyInfo.xcprivacy` draft for the app-level declarations. This document is specifically about *third-party compiled SDKs* that ship their own native binary and therefore need their own manifest, separate from the app's own `PrivacyInfo.xcprivacy`.

## Are Sentry and PostHog already covered?

Both vendors' **native iOS SDKs already ship a `PrivacyInfo.xcprivacy` inside their own `.xcframework`/CocoaPod** (Sentry Cocoa SDK since ~8.9, PostHog iOS SDK since ~3.x) — this was required industry-wide once Apple started rejecting builds without required-reason declarations. **Action needed: verify the actual installed version once Capacitor is wired up**, since JUnited currently only uses the *web* SDKs (`@sentry/react`, `posthog-js`) which run inside the WebView and touch **zero native APIs** — they make HTTP calls just like any other `fetch()`.

**The web SDKs (`@sentry/react`, `posthog-js`) as currently integrated do NOT require any native privacy manifest entry at all**, because they never leave the WebView's JS sandbox. This only changes if a *native* Capacitor plugin for either product is added later (e.g. `@sentry/capacitor` for native-crash capture) — if that happens, re-run this audit, since native crash SDKs read `UserDefaults` and system boot time and would need the reason declared.

## How to verify a CocoaPod/npm package includes its own manifest

1. After `npx cap sync ios`, open `ios/App/Pods/` (if using CocoaPods) or the SPM package cache.
2. Look for a `PrivacyInfo.xcprivacy` file inside each third-party framework's bundle.
3. In Xcode, Product → Archive — Xcode's own build validation will flag any *compiled* framework missing a required manifest for an API it's detected calling. Missing declarations show as a build-time warning/error at export time, not silently.
4. `xcrun` provides no standalone privacy-manifest linter as of this writing; the App Store Connect upload step (Xcode Organizer → Distribute) is where missing-manifest violations are actually surfaced.

## Bottom line for JUnited today

- **No action required right now** — the app currently only uses the *web* builds of Sentry and PostHog, which run in the WebView and are outside the native privacy-manifest system entirely.
- **Re-check this when Capacitor is added**: if any native plugin beyond the core Capacitor set is introduced (crash reporting, analytics SDKs with a native layer, ad SDKs, etc.), re-run this audit against the actual installed CocoaPods/SPM packages.
- The app's own `PrivacyInfo.xcprivacy` (see the `privacy-manifest` task) is what needs to declare push notifications, camera, and photo library access — that's a separate, already-drafted deliverable.
