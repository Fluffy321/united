import React from 'react';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';

function FeedPost({
  post,
  currentUser,
  liked = false,
  onLike,
  onComment,
  onDelete,
  onBlock,
  blockedIds = [],
  onReport,
  communities = [],
  onCommunityClick,
  isFromJoinedCommunity = false,
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-100 bg-white">
      <UnifiedPostCard
        post={post}
        currentUser={currentUser}
        liked={liked}
        onLike={onLike}
        onComment={onComment}
        onDelete={onDelete}
        onBlock={onBlock}
        blockedIds={blockedIds}
        onReport={onReport}
        communities={communities}
        onCommunityClick={onCommunityClick}
        isFromJoinedCommunity={isFromJoinedCommunity}
      />
    </div>
  );
}

export default React.memo(FeedPost);
