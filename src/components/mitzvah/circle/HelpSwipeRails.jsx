import React from 'react';
import { ArrowUpRight, HandHeart, MapPin, Plus } from 'lucide-react';
import { getUrgencyInfo, splitPublicHelpPosts } from './shared';

function HelpRailCard({ request, direction, onOpen }) {
  const urgency = getUrgencyInfo(request);
  const isOffer = direction === 'offer';

  return (
    <button
      type="button"
      data-help-direction={direction}
      onClick={() => onOpen?.(request)}
      className="motion-press snap-start shrink-0 basis-[82%] rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm sm:basis-[46%] lg:basis-[31%]"
      aria-label={`Open ${isOffer ? 'help offer' : 'help need'}: ${request.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full px-2 py-1 text-[10px] font-black ${isOffer ? 'bg-emerald-50 text-emerald-700' : urgency.tone}`}>
          {isOffer ? 'Available to help' : urgency.label}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
      </div>
      <p className="mt-3 line-clamp-2 text-[15px] font-black leading-tight text-slate-950">{request.title}</p>
      <p className="mt-2 text-[11px] font-bold text-slate-500">{request.category || 'Community help'}</p>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
        <MapPin className="h-3.5 w-3.5" />
        <span className="truncate">{request.neighborhood || 'Five Towns'}</span>
        <span aria-hidden="true">·</span>
        <span className="shrink-0">{isOffer ? 'Flexible' : urgency.remaining}</span>
      </div>
    </button>
  );
}

function HelpRail({ title, actionLabel, direction, requests, emptyText, onPost, onOpen }) {
  return (
    <section aria-labelledby={`help-${direction}-heading`}>
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${direction === 'offer' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
            <HandHeart className="h-4 w-4" />
          </span>
          <div>
            <h2 id={`help-${direction}-heading`} className="text-[16px] font-black text-slate-950">{title}</h2>
            <p className="text-[11px] font-semibold text-slate-500">Swipe to see more</p>
          </div>
        </div>
        <button type="button" onClick={onPost} className="motion-press inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-[11px] font-black text-white">
          <Plus className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      </div>

      <div className="mobile-scroll-x flex snap-x snap-mandatory gap-2.5 pb-2">
        {requests.length > 0 ? requests.map((request) => (
          <HelpRailCard key={request.id} request={request} direction={direction} onOpen={onOpen} />
        )) : (
          <div className="snap-start shrink-0 basis-[82%] rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 sm:basis-[46%] lg:basis-[31%]">
            <p className="text-[13px] font-black text-slate-700">{emptyText}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Be the first when something real comes up.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function HelpSwipeRails({ requests = [], onPostNeed, onPostOffer, onOpen }) {
  const { needs, offers } = splitPublicHelpPosts(requests);

  return (
    <div className="space-y-5" data-testid="help-swipe-rails">
      <HelpRail
        title="Help needed"
        actionLabel="Post a need"
        direction="need"
        requests={needs}
        emptyText="No public needs right now"
        onPost={onPostNeed}
        onOpen={onOpen}
      />
      <HelpRail
        title="Help offered"
        actionLabel="Offer help"
        direction="offer"
        requests={offers}
        emptyText="No public offers yet"
        onPost={onPostOffer}
        onOpen={onOpen}
      />
    </div>
  );
}
