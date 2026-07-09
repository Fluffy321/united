import React from 'react';
import RequestCard from './RequestCard';
import EmptyState from './EmptyState';

export default function CompletedTab({
  completedRequests,
  offers,
  commentsByRequest,
  currentUser,
  onComment,
  onOpenMap,
  onUrgencyChange,
  onFindRequest,
}) {
  if (!completedRequests.length) {
    return (
      <EmptyState
        title="Completed mitzvahs will collect here"
        text="When a request is helped and marked complete, this becomes the shared record of good done."
        actionLabel="Find a request"
        onAction={onFindRequest}
      />
    );
  }

  return completedRequests.map((r) => (
    <RequestCard
      key={r.id}
      request={r}
      offers={offers}
      comments={commentsByRequest[r.id] || []}
      currentUser={currentUser}
      onOffer={() => {}}
      onAcceptOffer={() => {}}
      onStart={() => {}}
      onComplete={() => {}}
      onVerify={() => {}}
      onComment={onComment}
      onOpenMap={onOpenMap}
      onUrgencyChange={onUrgencyChange}
    />
  ));
}
