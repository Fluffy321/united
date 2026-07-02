import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { X, Loader2, Gavel } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

// ─── AppealSubmitModal (exported — used in CommunityDetailView for removed users) ──

export default function AppealSubmitModal({ removal, communityName, onClose, onSubmitted }) {
  const [message, setMessage]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error('Please write your appeal message.'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('submit_community_appeal', {
        p_removal_id: removal.id,
        p_message:    message.trim(),
      });
      if (error) throw error;
      toast.success('Your appeal has been submitted. The community admin will review it.');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.message || 'Could not submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-md sm:rounded-[28px]">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
              <Gavel className="h-3.5 w-3.5" /> Appeal removal
            </p>
            <h2 className="mt-2 text-[17px] font-black text-slate-950">
              Appeal your removal from {communityName || 'this community'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Explain why you believe this decision should be reconsidered.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-[13px] font-black text-slate-700 mb-1.5 block">Your message</span>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={6}
              placeholder="Explain why you believe this removal was in error or why you should be reinstated…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
          <p className="text-[11px] text-slate-400 mt-2">You can only submit one appeal per removal.</p>
        </section>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
            {submitting ? 'Submitting…' : 'Submit appeal'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
