import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Cookie } from 'lucide-react';
import { getStoredConsent, saveConsent } from '@/lib/cookieConsent';
import { enableAnalytics, optOutAnalytics } from '@/lib/analytics';

export default function CookieConsentBanner() {
  const [visible, setVisible]     = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [wantsAnalytics, setWantsAnalytics] = useState(false);

  useEffect(() => {
    // Only show the banner if the user has never made a choice.
    try {
      if (!getStoredConsent()) setVisible(true);
    } catch {
      // Storage blocked — skip banner gracefully.
    }
  }, []);

  const accept = (analyticsEnabled) => {
    saveConsent(analyticsEnabled);
    if (analyticsEnabled) {
      enableAnalytics();
    } else {
      optOutAnalytics();
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="app-floating-banner fixed left-0 right-0 z-[200] px-3 pb-2">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="px-4 py-4">

          {/* Header */}
          <div className="mb-2.5 flex items-center gap-2">
            <Cookie className="h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-[14px] font-bold text-slate-900">Cookies on JUnited</p>
          </div>

          {/* Body */}
          <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
            We use essential cookies to keep the app running. We also offer optional analytics
            cookies that help us understand how people use JUnited — never your content or messages.{' '}
            <Link to="/privacy" className="text-blue-600 underline underline-offset-2">
              Privacy Policy
            </Link>
          </p>

          {/* Primary actions */}
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => accept(false)}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              No thanks
            </button>
            <button
              onClick={() => accept(true)}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98]"
            >
              Accept analytics
            </button>
          </div>

          {/* Manage preferences toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-[12px] text-slate-400 transition hover:text-slate-600"
          >
            {expanded
              ? <ChevronUp className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />}
            Manage preferences
          </button>

          {/* Expanded preferences */}
          {expanded && (
            <div className="mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
              {/* Essential — locked */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">Essential cookies</p>
                  <p className="text-[11px] text-slate-500">Login, security, and core app features. Required.</p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  Always on
                </span>
              </div>

              {/* Analytics — toggleable */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">Analytics cookies</p>
                  <p className="text-[11px] text-slate-500">Help us improve the app. Your content is never shared.</p>
                </div>
                <button
                  onClick={() => setWantsAnalytics(v => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${wantsAnalytics ? 'bg-blue-600' : 'bg-slate-300'}`}
                  aria-checked={wantsAnalytics}
                  role="switch"
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${wantsAnalytics ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <button
                onClick={() => accept(wantsAnalytics)}
                className="mt-1 w-full rounded-lg bg-slate-800 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-700"
              >
                Save preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
