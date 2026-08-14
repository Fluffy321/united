import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, HandHeart, X } from 'lucide-react';
import { STATUSES, getApproxDistance, getHelpCta, getRequestProgress, getUrgencyInfo } from './shared';
import StatusPill from './StatusPill';

export default function QuickViewSheet({ request, offers, comments = [], currentUser, onClose, onOffer, onOpenMap }) {
  if (!request || typeof document === 'undefined') return null;
  const myOffer = offers.find(
    (o) => o.requestId === request.id && o.volunteerId === currentUser?.id
  );
  const isPublicOffer = request.direction === 'offer';
  const canOffer = request.direction !== 'offer' && request.poster_id !== currentUser?.id && request.status === STATUSES.OPEN && !myOffer;
  const helperOffers = offers.filter((o) => o.requestId === request.id);
  const savedOfferCount = Number(request.offers_count || request.helper_count || request.volunteer_count || 0);
  const visibleHelperCount = Math.max(helperOffers.length, Number.isFinite(savedOfferCount) ? savedOfferCount : 0);
  const savedCommentCount = Number(request.comments_count || request.comment_count || request.replies_count || 0);
  const commentCount = Math.max(comments.length, Number.isFinite(savedCommentCount) ? savedCommentCount : 0);
  const urgencyInfo = getUrgencyInfo(request);
  const progress = getRequestProgress(request, visibleHelperCount);
  const helpCta = getHelpCta(request);
  const distanceLabel = getApproxDistance(request);
  const timingLabel = isPublicOffer
    ? (urgencyInfo.label === 'Urgent' ? 'Available now' : urgencyInfo.label === 'Today' ? 'Available today' : 'Flexible availability')
    : urgencyInfo.detail;
  const timingDetail = isPublicOffer ? 'Message them to coordinate details.' : urgencyInfo.remaining;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/45 p-3 motion-soft-in sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl motion-page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <StatusPill status={request.status} />
              {isPublicOffer && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                  Available to help
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${urgencyInfo.tone}`}>
                <span className={`h-2 w-2 rounded-full ${urgencyInfo.dot}`} />
                {urgencyInfo.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                {request.category}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-950">{request.title}</h2>
            <p className="mt-2 text-[13px] text-slate-600">{request.description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          <div className={`rounded-2xl border px-3 py-2 ${urgencyInfo.tone}`}>
            <p className="flex items-center gap-2 text-[12px] font-black">
              <Clock className="h-4 w-4" />
              {timingLabel}
            </p>
            <p className="mt-0.5 text-[11px] font-black opacity-80">{timingDetail}</p>
          </div>
          {!isPublicOffer && <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-black text-slate-950">{progress.title}</p>
                <p className="text-[12px] font-semibold text-slate-500">{progress.detail}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">
                {progress.percent}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>}
          <div className="flex flex-wrap gap-2 text-[12px] font-black">
            {!isPublicOffer && <span className="rounded-full bg-blue-50 px-2.5 py-1.5 text-blue-700">
              {visibleHelperCount} {visibleHelperCount === 1 ? 'person offered help' : 'people offered help'}
            </span>}
            <span className="rounded-full bg-slate-50 px-2.5 py-1.5 text-slate-700">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
              {distanceLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {canOffer && (
            <button
              onClick={() => { onOffer(request); onClose(); }}
              className="chesed-cta-pulse app-button-primary h-10 flex-1 text-[13px]"
              style={{ background: '#556B2F' }}
            >
              <HandHeart className="h-4 w-4" />
              {helpCta}
            </button>
          )}
          {onOpenMap && (
            <button
              onClick={() => { onOpenMap(request); onClose(); }}
              className="h-10 flex-1 rounded-xl border border-blue-200 bg-blue-50 text-[13px] font-black text-blue-700 hover:bg-blue-100"
            >
              Open map
            </button>
          )}
          <button
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-slate-200 text-[13px] font-black text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
