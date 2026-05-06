import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react';
import { storageService } from '@/services';

const STORAGE_KEY = 'junited_cookie_consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState({ essential: true, analytics: false });

  useEffect(() => {
    try {
      const stored = storageService.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // Browser storage blocked (e.g. incognito with strict settings) — skip banner
    }
  }, []);

  const save = (analyticsEnabled) => {
    const consent = { essential: true, analytics: analyticsEnabled, timestamp: new Date().toISOString() };
    storageService.setJson(STORAGE_KEY, consent);
    // Expose preference globally so analytics lib can check it
    window.__junited_analytics_enabled = analyticsEnabled;
    setVisible(false);
  };

  const handleAcceptAll = () => save(true);
  const handleRejectOptional = () => save(false);
  const handleSavePrefs = () => save(prefs.analytics);

  if (!visible) return null;

  return (
    <div className="app-floating-banner fixed left-0 right-0 z-[200] px-3 pb-2">
      <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="font-semibold text-[15px]">We use cookies</p>
            </div>
            <button onClick={handleRejectOptional} aria-label="Close cookie banner" className="p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <p className="text-[13px] text-slate-300 leading-relaxed mb-3">
            Essential cookies keep the app running. Optional analytics cookies help us improve it.{' '}
            <Link to="/privacy" className="text-blue-400 underline">Privacy Policy</Link>
          </p>

          {/* Expandable preferences */}
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-white transition-colors mb-3">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide preferences' : 'Manage preferences'}
          </button>

          {expanded && (
            <div className="space-y-2 mb-3 bg-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">Essential cookies</p>
                  <p className="text-[11px] text-slate-400">Login, security, preferences. Required.</p>
                </div>
                <div className="w-8 h-5 bg-blue-600 rounded-full flex-shrink-0" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">Analytics cookies</p>
                  <p className="text-[11px] text-slate-400">Help us understand usage. Optional.</p>
                </div>
                <button onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                  className={`w-8 h-5 rounded-full transition-colors flex-shrink-0 relative ${prefs.analytics ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${prefs.analytics ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <button onClick={handleSavePrefs}
                className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[12px] font-semibold transition-colors mt-1">
                Save preferences
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleRejectOptional}
              className="flex-1 py-2 rounded-xl border border-white/20 text-[13px] font-semibold hover:bg-white/5 transition-colors">
              Essential only
            </button>
            <button onClick={handleAcceptAll}
              className="flex-1 py-2 rounded-xl bg-blue-600 text-[13px] font-semibold hover:bg-blue-500 transition-colors">
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
