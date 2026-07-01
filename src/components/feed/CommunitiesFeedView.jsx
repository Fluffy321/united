import React from 'react';
import { ArrowRight, Heart, MessageCircle } from 'lucide-react';
import { COMMUNITIES_ENABLED } from '@/config/features';
import SkeletonCard from '@/components/common/SkeletonCard';
import { feedText, formatPostAge, postDate } from '@/lib/feed/feedRanking';
import { authorColor, communityColor } from '@/lib/feed/feedColors';

export default function CommunitiesFeedView({ communityGroups, feedPosts, communitiesFetched, navigate, onLike, onReply, likedPostIds }) {
  if (!COMMUNITIES_ENABLED || (communitiesFetched && communityGroups.length === 0)) {
    return (
      <div className="mobile-page mobile-safe-bottom px-4 pt-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">🏘️</div>
        <p className="text-[16px] font-black text-slate-900">No communities yet</p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] leading-5 text-slate-500">
          Join a shul, neighborhood group, or chesed organization to see their posts here.
        </p>
        <button
          onClick={() => navigate('/Communities')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-bold text-white"
        >
          Find communities <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (!communitiesFetched) {
    return (
      <div className="mobile-page mobile-safe-bottom px-3 pt-3 space-y-2.5 bg-[#F0EEE8] min-h-screen">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="mobile-page mobile-safe-bottom bg-[#F0EEE8] min-h-screen pt-[1px]">
      {communityGroups.map((community) => {
        const communityPosts = feedPosts.filter(p => p.community_id === community.id).slice(0, 3);
        const color = communityColor(community.id);
        const hasActivity = communityPosts.length > 0;

        return (
          <div key={community.id} className="mb-2">
            <div className={`bg-white ${hasActivity ? '' : 'opacity-40'}`}>
              <button
                type="button"
                onClick={() => navigate(`/communities/${community.id}`)}
                className="w-full flex items-center px-4 py-3 border-b border-slate-100"
              >
                <div className="w-1 h-7 rounded-full mr-3 shrink-0" style={{ background: hasActivity ? color : color, opacity: hasActivity ? 1 : 0.5 }} />
                <span className="flex-1 text-left text-[11px] font-bold tracking-[0.07em] uppercase text-slate-900">
                  {community.name}
                </span>
                {hasActivity ? (
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                ) : (
                  <span className="text-[11px] text-slate-400 italic font-normal">No recent activity</span>
                )}
              </button>
              {communityPosts.map(post => (
                <CommunityCompactPost
                  key={post.id}
                  post={post}
                  liked={likedPostIds.includes(post.id)}
                  onLike={onLike}
                  onReply={onReply}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommunityCompactPost({ post, liked = false, onLike, onReply }) {
  const age = formatPostAge(postDate(post));
  const replies = Number(post.comments_count || 0);
  const reactions = Number(post.likes_count || 0);
  const initials = (post.author_name || 'J').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const avatarUrl = post.author_avatar_url;

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 bg-white">
      {avatarUrl ? (
        <img src={avatarUrl} alt={post.author_name} className="w-[30px] h-[30px] rounded-full object-cover shrink-0 mt-0.5" />
      ) : (
        <div
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
          style={{ background: authorColor(post.author_id || post.author_name || '') }}
        >
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-[13px] font-semibold text-slate-900 truncate">{post.author_name || 'Neighbor'}</span>
          <span className="text-[12px] text-slate-400 shrink-0">· {age}</span>
        </div>
        <p className="text-[14px] leading-snug text-slate-900 line-clamp-3">{feedText(post)}</p>
        <div className="flex items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1 text-[12px] ${liked ? 'text-rose-500' : 'text-slate-400'}`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-rose-500' : ''}`} />
            {reactions > 0 && <span>{reactions}</span>}
          </button>
          <button
            type="button"
            onClick={() => onReply(post)}
            className="flex items-center gap-1 text-[12px] text-slate-400"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {replies > 0 && <span>{replies}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
