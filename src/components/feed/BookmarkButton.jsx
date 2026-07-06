import React from 'react';
import { Bookmark } from 'lucide-react';
import { createBookmark, deleteBookmark, filterBookmark } from '@/services/entityServices';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { appParams } from '@/lib/app-params';
import { postKeys } from '@/lib/queryKeys';

export default function BookmarkButton({ postId, currentUser }) {
  const queryClient = useQueryClient();
  const isRealUser = !!currentUser && currentUser.id !== 'guest';

  const { data: bookmark } = useQuery({
    queryKey: ['bookmark', postId, currentUser?.id],
    queryFn: async () => {
      const rows = await filterBookmark({ user_id: currentUser.id, post_id: postId }, undefined, 1);
      return rows[0] ?? null;
    },
    enabled: !!postId && isRealUser && appParams.hasBackendConfig,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const isBookmarked = !!bookmark;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await deleteBookmark(bookmark.id);
      } else {
        await createBookmark({ user_id: currentUser.id, post_id: postId });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['bookmark', postId, currentUser?.id] });
      const prev = queryClient.getQueryData(['bookmark', postId, currentUser?.id]);
      queryClient.setQueryData(
        ['bookmark', postId, currentUser?.id],
        isBookmarked ? null : { id: 'optimistic' }
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['bookmark', postId, currentUser?.id], ctx?.prev);
      toast.error('Failed to update bookmark');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', postId, currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: postKeys.savedAll() });
      if (!isBookmarked) toast.success('Post saved');
    },
  });

  if (!isRealUser || !appParams.hasBackendConfig) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleMutation.mutate();
      }}
      disabled={toggleMutation.isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Save post'}
      className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ${
        isBookmarked
          ? 'text-blue-600 bg-blue-50 border border-blue-200'
          : 'text-slate-400 hover:bg-slate-100 border border-transparent'
      }`}
    >
      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-blue-600 stroke-blue-600' : ''}`} />
    </button>
  );
}
