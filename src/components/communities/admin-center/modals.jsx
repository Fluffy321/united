import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  X, Loader2, CheckCircle2, XCircle,
  UserMinus, Gavel,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { notificationsService } from '@/services/notificationsService';
import { PUBLIC_REMOVAL_REASONS, PRIVATE_REMOVAL_REASONS, REASON_LABEL_MAP, isPublicCommunity } from './shared';

export function RemoveMemberModal({ member, community, currentUser, onClose, onRemoved }) {
  const isPublic    = isPublicCommunity(community);
  const reasons     = isPublic ? PUBLIC_REMOVAL_REASONS : PRIVATE_REMOVAL_REASONS;
  const [reasonCode, setReasonCode]   = useState('');
  const [reasonNote, setReasonNote]   = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const name = member.profile?.display_name || member.user_name || 'this member';

  const handleRemove = async () => {
    if (!reasonCode) { toast.error('Select a removal reason.'); return; }
    if (reasonCode === 'other' && isPublic && !reasonNote.trim()) {
      toast.error('A written explanation is required for "Other".'); return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('remove_community_member', {
        p_community_id: community.id,
        p_user_id:      member.user_id,
        p_reason_code:  reasonCode,
        p_reason_note:  reasonNote.trim() || null,
      });
      if (error) throw error;

      // Notify removed user
      try {
        await notificationsService.notifyMemberRemoved({
          removedUserId: member.user_id,
          adminId:       currentUser.id,
          communityName: community.name,
          communityId:   community.id,
          removalId:     data?.removal_id,
        });
      } catch { /* notification failure is non-fatal */ }

      toast.success(`${name} was removed from the community.`);
      onRemoved();
    } catch (err) {
      toast.error(err.message || 'Could not remove member');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-md sm:rounded-[28px]">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red-700">
                <UserMinus className="h-3.5 w-3.5" />
                Remove member
              </p>
              <h2 className="mt-2 text-[18px] font-black text-slate-950">Remove {name}?</h2>
              {isPublic && (
                <p className="mt-1 text-[12px] font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 mt-2">
                  This is a public community — a valid reason is required and the member can appeal.
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-[13px] font-black text-slate-700 mb-2">
              {isPublic ? 'Removal reason (required)' : 'Removal reason'}
            </p>
            <div className="space-y-2">
              {reasons.map(r => (
                <label key={r.code} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.code}
                    checked={reasonCode === r.code}
                    onChange={() => setReasonCode(r.code)}
                    className="mt-0.5 accent-blue-600"
                  />
                  <span className="text-[13px] font-semibold text-slate-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[13px] font-black text-slate-700 mb-1.5 block">
              Admin note
              {isPublic && reasonCode === 'other' ? ' (required)' : ' (optional)'}
            </span>
            <textarea
              value={reasonNote}
              onChange={e => setReasonNote(e.target.value)}
              rows={3}
              placeholder="Add context for your records…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
        </section>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={submitting || (!reasonCode && isPublic)}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
            {submitting ? 'Removing…' : 'Remove member'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

// ─── Review appeal modal ──────────────────────────────────────────────────────

export function ReviewAppealModal({ appeal, community, currentUser, onClose, onReviewed }) {
  const decision    = appeal.action; // 'approved' | 'denied'
  const [note, setNote]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isApprove = decision === 'approved';

  const handleReview = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('review_community_appeal', {
        p_appeal_id:   appeal.id,
        p_decision:    decision,
        p_review_note: note.trim() || null,
      });
      if (error) throw error;

      // Notify appellant
      try {
        await notificationsService.notifyAppealResolved({
          userId:        appeal.appellant_user_id,
          adminId:       currentUser.id,
          communityName: community.name,
          communityId:   community.id,
          decision,
        });
      } catch { /* non-fatal */ }

      toast.success(isApprove ? 'Appeal approved — member reinstated.' : 'Appeal denied.');
      onReviewed();
    } catch (err) {
      toast.error(err.message || 'Could not process appeal review');
    } finally {
      setSubmitting(false);
    }
  };

  const name = appeal.appellant?.display_name || 'this member';

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-md sm:rounded-[28px]">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
              isApprove ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {isApprove ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {isApprove ? 'Approve appeal' : 'Deny appeal'}
            </p>
            <h2 className="mt-2 text-[17px] font-black text-slate-950">
              {isApprove ? `Reinstate ${name}?` : `Deny ${name}'s appeal?`}
            </h2>
            {isApprove && (
              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                They will be re-added as a regular member.
              </p>
            )}
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Appeal summary */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[12px] font-bold text-slate-500 mb-1">Appeal message</p>
            <p className="text-[13px] text-slate-700 leading-relaxed">{appeal.message}</p>
          </div>
          {appeal.removal && (
            <div className="text-[12px] text-slate-500">
              <span className="font-bold">Original reason: </span>
              {REASON_LABEL_MAP[appeal.removal.reason_code] || appeal.removal.reason_code}
            </div>
          )}
          <label className="block">
            <span className="text-[13px] font-black text-slate-700 mb-1.5 block">Review note (optional)</span>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Leave a note about this decision…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
        </section>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReview}
            disabled={submitting}
            className={`flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white disabled:opacity-60 ${
              isApprove ? 'bg-emerald-600' : 'bg-slate-800'
            }`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> :
              isApprove ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {submitting ? 'Saving…' : isApprove ? 'Approve & reinstate' : 'Deny appeal'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

// ─── AppealSubmitModal (exported — used in CommunityDetailView for removed users) ──

export function AppealSubmitModal({ removal, communityName, onClose, onSubmitted }) {
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

