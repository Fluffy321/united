import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService, batchFetchByIds } from '@/services';
import { Bookmark, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

function SavedPostCard({ post }) {
  const typeEmoji = {
    feed: '💬', help: '🤝', event: '📅', job: '💼', housing: '🏠', news: '📰', food: '🍽️',
  }[post.type] || '💬';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 mb-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{typeEmoji} {post.type}</span>
        <span className="ml-auto text-[11px] text-slate-400">
          {formatDistanceToNow(parseISO(post.created_date), { addSuffix: true })}
        </span>
      </div>
      {post.title && <p className="font-semibold text-[14px] text-slate-900 mb-0.5 leading-snug">{post.title}</p>}
      <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-3">{post.body}</p>
      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
        <span>by {post.user_name}</span>
        {post.likes_count > 0 && <span>❤️ {post.likes_count}</span>}
        {post.comments_count > 0 && <span>💬 {post.comments_count}</span>}
      </div>
    </div>
  );
}

export default function SavedPostsSection({ userId }) {
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: () => dataService.entities.Bookmark.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId,
    staleTime: 30000,
  });

  const { data: savedPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['saved-posts', bookmarks.map(b => b.post_id).join(',')],
    queryFn: () => batchFetchByIds('UnifiedPost', bookmarks.map(b => b.post_id)),
    enabled: bookmarks.length > 0,
    staleTime: 30000,
  });

  if (isLoading || loadingPosts) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bookmark className="w-10 h-10 text-slate-300 mb-3" />
        <p className="font-semibold text-slate-600">No saved posts yet</p>
        <p className="text-[13px] text-slate-400 mt-1">Tap the bookmark icon on any post to save it here.</p>
      </div>
    );
  }

  return (
    <div>
      {savedPosts.map(post => <SavedPostCard key={post.id} post={post} />)}
    </div>
  );
}