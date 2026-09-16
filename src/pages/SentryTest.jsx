/**
 * TEMPORARY — debug page for verifying Sentry end-to-end delivery.
 *
 * Remove this file and its route in App.jsx once reporting is confirmed.
 *
 * Reporting only reaches Sentry when BOTH are true:
 *   1. the build had VITE_SENTRY_DSN set (otherwise the SDK is tree-shaken out)
 *   2. the visitor accepted analytics cookies (initAnalytics is consent-gated)
 * Without those, the error is still caught and written to error_logs, but
 * nothing arrives in Sentry — a silent pass here does not prove the pipe works.
 */
import { useState } from 'react';
import { captureError } from '@/lib/analytics';

function Exploder() {
  // Thrown during render, so AppErrorBoundary's componentDidCatch handles it
  // exactly as it would a real render crash.
  throw new Error('SentryTest: deliberate render crash');
}

export default function SentryTest() {
  const [explode, setExplode] = useState(false);

  if (explode) return <Exploder />;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md space-y-4 pt-10">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-[13px] text-amber-900">
          <strong>Temporary debug page.</strong> Not linked from any nav. Delete
          once Sentry delivery is verified.
        </div>

        <h1 className="text-lg font-black text-slate-900">Sentry test</h1>
        <p className="text-sm text-slate-600">
          Each button routes an error to <code>captureError</code>. Check the
          Sentry issues feed and the <code>error_logs</code> table.
        </p>

        <button
          type="button"
          onClick={() => setExplode(true)}
          className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white"
        >
          Throw during render (via AppErrorBoundary)
        </button>

        <button
          type="button"
          onClick={() => {
            // Event-handler throws are NOT caught by error boundaries, so this
            // path reports directly. Both are worth proving.
            try {
              throw new Error('SentryTest: deliberate handler error');
            } catch (error) {
              captureError(error, { context: 'SentryTest: manual handler throw' });
            }
          }}
          className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900"
        >
          Report from an event handler (direct captureError)
        </button>
      </div>
    </div>
  );
}
