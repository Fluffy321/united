import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { batchFetchByIds } from '@/services/supabaseRepository';
import { Bookmark, Loader2, X, MessageCircle, Heart } from 'lucide-react';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { deleteBookmark } from '@/services/entityServices';

function safeFormatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : null;
  } catch {
    return null;
  }
}

function SavedPostCard({ post, bookmarkId, onRemove, isRemoving }) {
  const navigate = useNavigate();
  const timeAgo = safeFormatDate(post.created_date || post.created_at);
  const typeLabel = {
    feed: 'Post', help: 'Help', event: 'Event', job: 'Job',
    housing: 'Housing', news: 'News', food: 'Food',
  }[post.type] || 'Post';

  return (
    <div
      onClick={() => navigate(`/PostDetail?id=${post.id}`)}
      className="relative bg-white rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{typeLabel}</span>
            {timeAgo && <span className="text-[11px] text-slate-400">{timeAgo}</span>}
          </div>
          {post.title && (
            <p className="font-semibold text-[14px] text-slate-900 leading-snug mb-0.5 line-clamp-2">{post.title}</p>
          )}
          {post.body && (
            <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-3">{post.body}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
            <span className="truncate max-w-[120px]">{post.user_name}</span>
            {post.likes_count > 0 && (
              <span className="flex items-center gap-0.5">
                <Heart className="w-3 h-3" /> {post.likes_count}
              </span>
            )}
            {post.comments_count > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageCircle className="w-3 h-3" /> {post.comments_count}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(bookmarkId);
          }}
          disabled={isRemoving}
          aria-label="Remove bookmark"
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function SavedPostsSection({ userId }) {
  const queryClient = useQueryClient();

  const { data: bookmarks = [], isLoading: loadingBookmarks } = useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id, post_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const postIds = bookmarks.map(b => b.post_id);

  const { data: savedPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['saved-posts', postIds.join(',')],
    queryFn: () => batchFetchByIds('UnifiedPost', postIds),
    enabled: postIds.length > 0,
    staleTime: 30_000,
  });

  const removeMutation = useMutation({
    mutationFn: async (bookmarkId) => {
      await deleteBookmark(bookmarkId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      toast.success('Bookmark removed');
    },
    onError: () => toast.error('Failed to remove bookmark'),
  });

  const isLoading = loadingBookmarks || (postIds.length > 0 && loadingPosts);

  // Pair each bookmark with its post for ordered rendering
  const postMap = Object.fromEntries(savedPosts.map(p => [p.id, p]));
  const orderedPairs = bookmarks
    .map(b => ({ bookmark: b, post: postMap[b.post_id] }))
    .filter(({ post }) => !!post);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <h2 className="text-sm font-bold text-slate-900 mb-3">Saved Posts</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      ) : orderedPairs.length === 0 ? (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3">
          <Bookmark className="w-5 h-5 shrink-0 text-slate-300" />
          <p className="text-[13px] text-slate-400 leading-snug">
            Tap the bookmark icon on any post to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orderedPairs.map(({ bookmark, post }) => (
            <SavedPostCard
              key={bookmark.id}
              post={post}
              bookmarkId={bookmark.id}
              onRemove={(id) => removeMutation.mutate(id)}
              isRemoving={removeMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
