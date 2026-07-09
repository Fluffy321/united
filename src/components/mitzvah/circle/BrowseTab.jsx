import React from 'react';
import { Loader2 } from 'lucide-react';
import ChesedChallenge from '@/components/feed/ChesedChallenge';
import { getCategoryGroup } from './shared';
import RequestCard from './RequestCard';
import EmptyState from './EmptyState';

export default function BrowseTab({
  activeCategory,
  loadingRequests,
  browseRequests,
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
  onQuickView,
  onUrgencyChange,
  onPostRequest,
}) {
  return (
    <>
      <ChesedChallenge />
      {loadingRequests ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : activeCategory === 'rides' ? null : browseRequests.length ? (
        <>
          {browseRequests.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              offers={offers}
              comments={commentsByRequest[r.id] || []}
              currentUser={currentUser}
              onOffer={onOffer}
              onAcceptOffer={onAcceptOffer}
              onStart={onStart}
              onComplete={onComplete}
              onVerify={onVerify}
              onComment={onComment}
              onOpenMap={onOpenMap}
              onQuickView={onQuickView}
              onUrgencyChange={onUrgencyChange}
            />
          ))}
        </>
      ) : (
        <EmptyState
          title={activeCategory === 'all' ? 'Ready for the first chesed request' : `${getCategoryGroup(activeCategory).shortLabel} requests will appear here`}
          text={activeCategory === 'all'
            ? 'Post a food, ride, errand, or care request with enough detail for someone to say yes.'
            : `${getCategoryGroup(activeCategory).description} belong here when a real need comes up.`}
          actionLabel="Post a need"
          onAction={onPostRequest}
        />
      )}
    </>
  );
}
