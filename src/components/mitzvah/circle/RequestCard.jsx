import React from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  Eye,
  HandHeart,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  STATUSES,
  getApproxDistance,
  getHelpCta,
  getPrimaryActionLabel,
  getRequestProgress,
  getUpdatedLabel,
  getUrgencyHeadline,
  getUrgencyInfo,
} from './shared';
import StatusPill from './StatusPill';

export default function RequestCard({
  request,
  offers,
  comments = [],
  currentUser,
  onOffer,
  onAcceptOffer,
  onStart,
  onComplete,
  onVerify,
  onComment,
  onOpenMap,
  onQuickView,
  onUrgencyChange,
}) {
  const [discussionOpen, setDiscussionOpen] = React.useState(false);
  const [commentBody, setCommentBody] = React.useState('');
  const isPoster = request.poster_id === currentUser?.id;
  const acceptedOffer = offers.find(
    (o) => o.requestId === request.id && o.status === 'accepted'
  );
  const acceptedVolunteerId = acceptedOffer?.volunteerId || request.accepted_volunteer_id;
  const myOffer = offers.find(
    (o) => o.requestId === request.id && o.volunteerId === currentUser?.id
  );
  const isAcceptedVolunteer = acceptedVolunteerId === currentUser?.id;
  const canOffer = !isPoster && request.status === STATUSES.OPEN && !myOffer;
  const canStart = isAcceptedVolunteer && request.status === STATUSES.ACCEPTED;
  const canComplete = isAcceptedVolunteer && request.status === STATUSES.IN_PROG;
  const canVerify =
    isPoster &&
    acceptedVolunteerId !== currentUser?.id &&
    request.status === STATUSES.PENDING;
  const pendingOffers = offers.filter(
    (o) => o.requestId === request.id && o.status === 'offered'
  );
  const urgencyInfo = getUrgencyInfo(request);
  const helperOffers = offers.filter((o) => o.requestId === request.id);
  const helperNames = [...new Set(helperOffers.map((offer) => offer.volunteerName).filter(Boolean))];
  const savedOfferCount = Number(request.offers_count || request.helper_count || request.volunteer_count || 0);
  const visibleHelperCount = Math.max(helperOffers.length, Number.isFinite(savedOfferCount) ? savedOfferCount : 0);
  const helperPreviewNames = helperNames.length
    ? helperNames
    : Array.from({ length: Math.min(visibleHelperCount, 4) }, (_, index) => `Helper ${index + 1}`);
  const savedCommentCount = Number(request.comments_count || request.comment_count || request.replies_count || 0);
  const commentCount = Math.max(comments.length, Number.isFinite(savedCommentCount) ? savedCommentCount : 0);
  const progress = getRequestProgress(request, visibleHelperCount);
  const progressTone = {
    emerald: 'from-emerald-500 to-teal-500',
    blue: 'from-blue-500 to-sky-500',
    violet: 'from-violet-500 to-blue-500',
  }[progress.tone] || 'from-blue-500 to-sky-500';
  const helpCta = getHelpCta(request);
  const primaryActionLabel = getPrimaryActionLabel(request, helpCta);
  const distanceLabel = getApproxDistance(request);
  const urgencyHeadline = getUrgencyHeadline(request, urgencyInfo);
  const updatedLabel = getUpdatedLabel(request);
  const cardStateTone = request.status === STATUSES.VERIFIED
    ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-white'
    : request.status === STATUSES.OFFERED || request.status === STATUSES.ACCEPTED || request.status === STATUSES.IN_PROG
      ? 'border-amber-200 bg-gradient-to-br from-amber-50/90 via-white to-white'
      : {
        Urgent: 'border-red-200 bg-gradient-to-br from-red-50/90 via-white to-white',
        Today: 'border-orange-200 bg-gradient-to-br from-orange-50/80 via-white to-white',
        Flexible: 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white',
      }[urgencyInfo.label] || 'border-slate-200 bg-white';
  const urgencyRail = {
    Urgent: request.status === STATUSES.VERIFIED ? 'bg-emerald-500' : 'bg-red-500',
    Today: request.status === STATUSES.VERIFIED ? 'bg-emerald-500' : request.status === STATUSES.IN_PROG ? 'bg-amber-500' : 'bg-orange-500',
    Flexible: 'bg-slate-400',
  }[urgencyInfo.label] || 'bg-slate-300';
  const firstHelperName = helperNames[0] || request.claimed_by_name || null;
  const liveActivityText = firstHelperName
    ? `${firstHelperName} offered help`
    : visibleHelperCount > 0
      ? `${visibleHelperCount} people responding now`
      : 'Offer help';

  const submitComment = async (event) => {
    event.preventDefault();
    if (!commentBody.trim()) return;
    await onComment?.(request, commentBody.trim());
    setCommentBody('');
    setDiscussionOpen(true);
  };

  const handleCardClick = (event) => {
    if (!onOpenMap) return;
    if (event.target.closest('button, input, textarea, select, a')) return;
    onOpenMap(request);
  };

  const handleShare = async (event) => {
    event.stopPropagation();
    const shareText = `${urgencyHeadline}: ${request.title}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mitzvah request', text: shareText, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
        toast.success('Request link copied.');
      }
    } catch {}
  };

  const canAdjustUrgency = Boolean(isPoster && onUrgencyChange && ![STATUSES.VERIFIED, STATUSES.CANCELLED].includes(request.status));

  return (
	    <article
	      className={`relative cursor-pointer overflow-hidden rounded-2xl border px-3.5 py-3 shadow-sm transition hover:shadow-md ${cardStateTone}`}
      onClick={handleCardClick}
      role={onOpenMap ? 'button' : undefined}
      tabIndex={onOpenMap ? 0 : undefined}
    >
	      <div className={`absolute inset-y-0 left-0 w-1 ${urgencyRail}`} />
	      <div className="flex items-start justify-between gap-2">
	        <div className="min-w-0 flex-1">
	          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
	            <span className="rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[10px] font-black text-slate-700 shadow-sm">
	              {request.category}
	            </span>
	            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black ${urgencyInfo.tone}`}>
	              <span className={`h-1.5 w-1.5 rounded-full ${urgencyInfo.dot}`} />
	              {urgencyInfo.label}
	            </span>
	            <StatusPill status={request.status} />
	          </div>
	          {canAdjustUrgency && (
	            <div className="mb-2 flex flex-wrap items-center gap-1.5">
	              {['Urgent', 'Today', 'Flexible'].map((level) => {
                const selected = urgencyInfo.label === level;
                const levelClass = {
                  Urgent: selected ? 'border-red-500 bg-red-600 text-white' : 'border-red-200 bg-red-50 text-red-700',
                  Today: selected ? 'border-orange-500 bg-orange-500 text-white' : 'border-orange-200 bg-orange-50 text-orange-700',
                  Flexible: selected ? 'border-slate-500 bg-slate-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-600',
                }[level];
                return (
	                  <button
                    key={level}
                    type="button"
                    onClick={() => onUrgencyChange(request.id, level)}
	                    className={`motion-press rounded-full border px-2.5 py-1 text-[11px] font-black transition ${levelClass}`}
                    aria-pressed={selected}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          )}
	          <p className="mb-0.5 text-[11px] font-black uppercase tracking-wide text-red-600">
	            {urgencyHeadline}
	          </p>
	          <h2 className="line-clamp-2 text-[19px] font-black leading-[1.12] text-slate-950">{request.title}</h2>
	          <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-5 text-slate-600">
	            {request.description}
	          </p>
	
		          <div className="mt-3 rounded-2xl border border-white/80 bg-white/75 p-2.5 shadow-sm">
		            <div className="flex items-center gap-2 text-[11px] font-black text-slate-700">
		              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 ${urgencyInfo.tone}`}>
		                <Clock className="h-3 w-3" />
		                {urgencyInfo.detail}
		              </span>
		              <span className="min-w-0 flex-1 truncate">{progress.title}</span>
		              <span className="shrink-0 text-slate-400">{progress.percent}%</span>
		            </div>
		            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
		              <div
		                className={`h-full rounded-full bg-gradient-to-r ${progressTone} transition-all duration-300`}
		                style={{ width: `${progress.percent}%` }}
		              />
		            </div>
		            <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
		              <span className="truncate">{progress.detail}</span>
		              <span className="shrink-0">{updatedLabel}</span>
		            </div>
		          </div>

          {request.status === STATUSES.VERIFIED && (
	            <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-2.5 py-2">
              <span className="text-base">⛓️</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                  Chesed Chain
                </p>
                <p className="text-[12px] font-semibold leading-5 text-emerald-900">
                  {request.estimatedHours}h contributed to the community
                </p>
              </div>
            </div>
          )}

	          <div className="mt-3 flex flex-wrap items-center gap-1.5">
	            <div className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-100 bg-white px-2 py-1 shadow-sm">
	              <div className="flex -space-x-2">
	                {helperPreviewNames.length > 0 ? helperPreviewNames.slice(0, 4).map((name) => (
	                  <span
	                    key={name}
	                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-black text-white"
                    title={name}
                  >
                    {name.charAt(0).toUpperCase()}
                  </span>
                )) : (
	                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-black text-slate-500">
                    +
                  </span>
                )}
              </div>
	              <span className="text-[11px] font-black text-slate-700">
	                {liveActivityText}
	              </span>
	            </div>
            <button
              type="button"
              onClick={() => setDiscussionOpen((value) => !value)}
	              className="motion-press inline-flex min-h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-600"
	            >
              <MessageCircle className="h-3.5 w-3.5" />
	              {commentCount} replies
            </button>
            <button
              type="button"
              onClick={() => onOpenMap?.(request)}
	              className="motion-press inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-black text-blue-700"
            >
              <MapPin className="h-3.5 w-3.5" />
              {distanceLabel}
            </button>
          </div>
        </div>

        {onQuickView && (
          <button
            onClick={() => onQuickView(request)}
	            className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 p-1.5 text-slate-400 transition-all hover:bg-slate-100 active:scale-95"
            title="Quick view"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      </div>

	      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-500">
	        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-1.5 py-0.5">
	          <Clock className="h-3 w-3" />
	          {request.estimatedHours}h
	        </span>
	        <span className="inline-flex max-w-[120px] items-center gap-1 truncate rounded-full bg-slate-50 px-1.5 py-0.5">
	          <Users className="h-3 w-3" />
	          <span className="truncate">{request.poster_name}</span>
	        </span>
	        <span className="truncate text-slate-400">{urgencyInfo.remaining}</span>
	      </div>

      {isPoster && pendingOffers.length > 0 && (
        <div className="mt-3 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-[12px] font-black uppercase text-blue-700">Volunteer offers</p>
          {pendingOffers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-2">
              <div className="min-w-0">
                <p className="text-[13px] font-black text-slate-950">{offer.volunteerName}</p>
                {offer.note && (
                  <p className="truncate text-[12px] font-medium text-slate-500">{offer.note}</p>
                )}
              </div>
              <button
                onClick={() => onAcceptOffer(request.id, offer.id, offer.volunteerId)}
                className="app-button-primary min-h-9 shrink-0 rounded-lg px-3 py-0 text-[12px]"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

		      <div className="mt-3 flex flex-wrap gap-2">
	        {canOffer && (
	          <button
	            onClick={() => onOffer(request)}
		            className="chesed-cta-pulse app-button-primary h-10 rounded-xl px-4 text-[13px] shadow-md"
            style={{ background: '#556B2F' }}
          >
	            <HandHeart className="h-3.5 w-3.5" />
            {primaryActionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDiscussionOpen((value) => !value)}
          className="motion-press inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="motion-press inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
        {onOpenMap && (
	          <button
	            type="button"
	            onClick={() => onOpenMap(request)}
		            className="motion-press inline-flex h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[12px] font-black text-blue-700"
          >
	            <MapPin className="h-4 w-4" />
	            Map
          </button>
        )}
        {myOffer && myOffer.status === 'offered' && (
	          <span className="inline-flex h-7 items-center rounded-lg border border-blue-200 bg-blue-50 px-2 text-[10px] font-black text-blue-700">
            Offer sent ✓
          </span>
        )}
        {canStart && (
	          <button
	            onClick={() => onStart(request.id)}
	            className="app-button-primary h-7 rounded-lg bg-indigo-600 px-2 text-[10px] hover:bg-indigo-700"
          >
	            <UserCheck className="h-3.5 w-3.5" />
	            Start
          </button>
        )}
        {canComplete && (
	          <button
	            onClick={() => onComplete(request.id)}
	            className="app-button-primary h-7 rounded-lg bg-purple-600 px-2 text-[10px] hover:bg-purple-700"
          >
	            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark Completed
          </button>
        )}
        {canVerify && (
	          <button
	            onClick={() => onVerify(request.id)}
	            className="app-button-primary h-7 rounded-lg bg-emerald-600 px-2 text-[10px] hover:bg-emerald-700"
          >
	            <ShieldCheck className="h-3.5 w-3.5" />
            Verify Completion
          </button>
        )}
        {isPoster && acceptedVolunteerId === currentUser?.id && request.status === STATUSES.PENDING && (
	          <span className="inline-flex h-7 items-center rounded-lg border border-red-200 bg-red-50 px-2 text-[10px] font-black text-red-700">
            Cannot verify your own hours
          </span>
        )}
      </div>

	        {discussionOpen && (
	          <div className="mt-2 space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2">
            {comments.length > 0 ? (
              comments.slice(-4).map((comment) => (
                <div key={comment.id} className="flex gap-2 rounded-2xl bg-white p-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[12px] font-black text-blue-700">
                    {comment.author_avatar_url ? (
                      <img src={comment.author_avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (comment.author_name || 'C').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-slate-800">{comment.author_name || 'Community member'}</p>
                    <p className="text-[12px] font-semibold leading-5 text-slate-600">{comment.body}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-white px-3 py-2 text-[12px] font-semibold text-slate-500">
                Ask a detail, coordinate timing, or encourage the helper chain.
              </p>
            )}

            <form onSubmit={submitComment} className="flex gap-2">
              <input
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder="Add a comment..."
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={!commentBody.trim()}
                className="motion-press flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-40"
                aria-label="Post comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
	          </div>
	        )}
    </article>
  );
}
