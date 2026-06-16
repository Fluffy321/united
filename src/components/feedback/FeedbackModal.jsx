import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { captureError } from '@/lib/analytics';

const FEEDBACK_TYPES = [
  { value: 'bug',       label: '🐛 Bug' },
  { value: 'feature',   label: '💡 Feature idea' },
  { value: 'confusing', label: '😕 Confusing' },
  { value: 'content',   label: '⚠️ Content issue' },
  { value: 'other',     label: '💬 Other' },
];

const URGENCY_OPTIONS = [
  { value: 'normal',   label: 'Normal' },
  { value: 'blocking', label: 'Blocking me' },
];

function extractRouteContext(pathname, search) {
  const params = new URLSearchParams(search);
  const context = {};

  const communityMatch = pathname.match(/\/communit(?:y|ies)\/([^/?]+)/);
  if (communityMatch) context.community_id = communityMatch[1];

  const idParam = params.get('id');
  if (idParam) {
    if (pathname.includes('PostDetail')) context.post_id = idParam;
    else if (pathname.toLowerCase().includes('business')) context.business_id = idParam;
  }

  const pageName = pathname.replace(/^\//, '').split('/')[0] || 'Feed';
  return { pageName, context };
}

const DEFAULT_TYPE = 'bug';
const DEFAULT_URGENCY = 'normal';

export default function FeedbackModal({ open, onClose }) {
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const [feedbackType, setFeedbackType] = useState(DEFAULT_TYPE);
  const [urgency, setUrgency] = useState(DEFAULT_URGENCY);
  const [message, setMessage] = useState('');
  const [contactOk, setContactOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [capturedContext, setCapturedContext] = useState(null);

  // Capture context the moment the modal opens, not at submission time.
  useEffect(() => {
    if (open) {
      const { pageName, context } = extractRouteContext(location.pathname, location.search);
      setCapturedContext({
        routePath: location.pathname + location.search,
        pageName,
        routeContext: context,
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setFeedbackType(DEFAULT_TYPE);
    setUrgency(DEFAULT_URGENCY);
    setMessage('');
    setContactOk(false);
    setSubmitted(false);
    setCapturedContext(null);
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
    setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('app_feedback').insert({
        user_id: currentUser?.id ?? null,
        submitter_name: currentUser?.display_name || currentUser?.full_name || null,
        feedback_type: feedbackType,
        urgency,
        message: trimmed,
        contact_ok: contactOk,
        route_path: capturedContext?.routePath ?? location.pathname,
        page_name: capturedContext?.pageName ?? null,
        route_context: capturedContext?.routeContext ?? {},
        user_agent: capturedContext?.userAgent ?? null,
        viewport: capturedContext?.viewport ?? null,
      });
      if (error) throw error;
      setSubmitted(true);
      setTimeout(handleClose, 2000);
    } catch (err) {
      captureError(err, { context: 'FeedbackModal: submit feedback' });
      toast.error('Could not send feedback — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Send feedback"
        className="fixed inset-x-0 bottom-0 z-[70] max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-4 shadow-2xl"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
            <p className="text-[17px] font-bold text-slate-900">Thank you!</p>
            <p className="mt-1 text-[13px] text-slate-500">
              We read every submission and appreciate your help improving JUnited.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[17px] font-bold text-slate-900">Help us improve JUnited</p>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  Found a bug or have an idea? We read every submission.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 transition-colors hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Type */}
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Type</p>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setFeedbackType(t.value)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${
                      feedbackType === t.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Urgency</p>
              <div className="flex gap-2">
                {URGENCY_OPTIONS.map(u => (
                  <button
                    key={u.value}
                    onClick={() => setUrgency(u.value)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${
                      urgency === u.value
                        ? u.value === 'blocking'
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {u.value === 'blocking' ? '🚨 ' : ''}{u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                What&rsquo;s on your mind? <span className="text-red-500">*</span>
              </p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe what you experienced, what you'd like to see, or what isn't working…"
                rows={4}
                autoFocus
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Contact OK */}
            <label className="mb-4 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={contactOk}
                onChange={e => setContactOk(e.target.checked)}
                className="h-4 w-4 rounded accent-blue-600"
              />
              <span className="text-[12px] text-slate-600">
                I&rsquo;m OK with the JUnited team contacting me about this
              </span>
            </label>

            {/* Context note */}
            {capturedContext?.pageName && (
              <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                Submitting from{' '}
                <span className="font-semibold text-slate-600">{capturedContext.pageName}</span>
                {capturedContext.routePath && capturedContext.routePath !== `/${capturedContext.pageName}` && (
                  <> &middot; <span className="font-mono">{capturedContext.routePath.slice(0, 60)}</span></>
                )}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-[14px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                'Send Feedback'
              )}
            </button>
          </>
        )}

        {/* Safe-area spacer */}
        <div className="h-6 mobile-safe-bottom" />
      </div>
    </>
  );
}
