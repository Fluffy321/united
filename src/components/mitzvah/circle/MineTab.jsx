import React from 'react';
import RequestCard from './RequestCard';
import EmptyState from './EmptyState';

export default function MineTab({
  myActivityItems,
  offers,
  commentsByRequest,
  currentUser,
  onOffer,
  onAcceptOffer,
  onStart,
  onComplete,
  onVerify,
  onComment,
  onOpenMap,
  onUrgencyChange,
  onBrowse,
}) {
  if (!myActivityItems.length) {
    return (
      <EmptyState
        title="Your mitzvah activity starts here"
        text="Post a need you know about, or offer help on an open request and it will show here."
        actionLabel="Offer help"
        onAction={onBrowse}
      />
    );
  }

  return myActivityItems.map(({ type, request }) => (
    <div key={`${type}-${request.id}`} className="space-y-2">
      <p className="px-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
        {type === 'request' ? 'My request' : 'My offer'}
      </p>
      <RequestCard
        request={request}
        offers={offers}
        comments={commentsByRequest[request.id] || []}
        currentUser={currentUser}
        onOffer={onOffer}
        onAcceptOffer={onAcceptOffer}
        onStart={onStart}
        onComplete={onComplete}
        onVerify={onVerify}
        onComment={onComment}
        onOpenMap={onOpenMap}
        onUrgencyChange={onUrgencyChange}
      />
    </div>
  ));
}
