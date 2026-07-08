import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Loader2, Gavel, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { notificationsService } from '@/services/notificationsService';
import { Avatar, EmptyState, SectionHeader, fmtDate, fmtRelative, REASON_LABEL_MAP } from './shared';

// ─── Appeals tab ──────────────────────────────────────────────────────────────

export default function AppealsTab({ communityId, community, currentUser }) {
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState(null);

  const { data: appeals = [], isLoading } = useQuery({
    queryKey: ['admin-appeals', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_member_appeals')
        .select(`
          id, removal_id, appellant_user_id, message, status, review_note, created_at, reviewed_at,
          removal:removal_id(reason_code, reason_note, removed_at, community_privacy),
          appellant:appellant_user_id(display_name, avatar_url),
          reviewer:reviewed_by_user_id(display_name)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const pending  = appeals.filter(a => a.status === 'pending');
  const resolved = appeals.filter(a => a.status !== 'pending');

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const AppealCard = ({ appeal }) => {
    const name   = appeal.appellant?.display_name || 'Member';
    const isPending = appeal.status === 'pending';
    return (
      <div className={`rounded-2xl bg-white border shadow-sm px-4 py-4 ${isPending ? 'border-amber-200' : 'border-slate-100'}`}>
        <div className="flex items-start gap-3">
          <Avatar name={name} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-bold text-slate-900">{name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                isPending ? 'bg-amber-50 text-amber-700' :
                appeal.status === 'approved' ? 'bg-green-50 text-green-700' :
                'bg-slate-100 text-slate-500'
              }`}>{appeal.status}</span>
            </div>

            {appeal.removal && (
              <p className="text-[12px] text-slate-500 mt-1">
                Removed for: <span className="font-semibold">
                  {REASON_LABEL_MAP[appeal.removal.reason_code] || appeal.removal.reason_code}
                </span>
              </p>
            )}

            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
              <p className="text-[12px] font-bold text-slate-500 mb-1">Appeal message</p>
              <p className="text-[13px] text-slate-700 leading-relaxed">{appeal.message}</p>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Submitted {fmtRelative(appeal.created_at)}
            </p>

            {appeal.status !== 'pending' && appeal.reviewer && (
              <p className="text-[11px] text-slate-400">
                Reviewed by {appeal.reviewer.display_name} · {fmtDate(appeal.reviewed_at)}
              </p>
            )}
            {appeal.review_note && (
              <p className="text-[12px] text-slate-500 italic mt-1">Admin note: "{appeal.review_note}"</p>
            )}
          </div>
        </div>

        {isPending && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReviewing({ ...appeal, action: 'approved' })}
              className="flex-1 h-9 rounded-xl bg-emerald-600 text-white text-[13px] font-black flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => setReviewing({ ...appeal, action: 'denied' })}
              className="flex-1 h-9 rounded-xl bg-slate-200 text-slate-700 text-[13px] font-black flex items-center justify-center gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              Deny
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
      {appeals.length === 0 ? (
        <EmptyState icon={Gavel} title="No pending appeals" body="When removed members submit appeals, they will appear here." />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <SectionHeader title={`${pending.length} pending`} />
              {pending.map(a => <AppealCard key={a.id} appeal={a} />)}
            </div>
          )}
          {resolved.length > 0 && (
            <div className="space-y-3">
              <SectionHeader title="Resolved" />
              {resolved.map(a => <AppealCard key={a.id} appeal={a} />)}
            </div>
          )}
        </>
      )}

      {reviewing && (
        <ReviewAppealModal
          appeal={reviewing}
          community={community}
          currentUser={currentUser}
          onClose={() => setReviewing(null)}
          onReviewed={() => {
            setReviewing(null);
            queryClient.invalidateQueries({ queryKey: ['admin-appeals', communityId] });
            queryClient.invalidateQueries({ queryKey: ['admin-ov-appeals', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
          }}
        />
      )}
    </div>
  );
}

// ─── Review appeal modal ──────────────────────────────────────────────────────

function ReviewAppealModal({ appeal, community, currentUser, onClose, onReviewed }) {
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
