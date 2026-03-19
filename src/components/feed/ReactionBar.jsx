import React from 'react';
import { Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ReactionBar({ postId, currentUser }) {
  const queryClient = useQueryClient();
  const isRealUser = !!currentUser && currentUser.id !== 'guest';

  const { data: reactions = [] } = useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: () => base44.entities.Reaction.filter({ post_id: postId }, '-created_date', 100),
    enabled: !!postId,
    staleTime: 300000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: userReactions = [] } = useQuery({
    queryKey: ['user-reactions', postId, currentUser?.id],
    queryFn: () => base44.entities.Reaction.filter({ post_id: postId, user_id: currentUser.id }, undefined, 100),
    enabled: !!postId && isRealUser,
    staleTime: 300000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      const existing = userReactions.find(r => r.reaction_type === 'like');
      if (existing) {
        await base44.entities.Reaction.delete(existing.id);
      } else {
        await base44.entities.Reaction.create({
          post_id: postId,
          user_id: currentUser.id,
          reaction_type: 'like',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-reactions', postId] });
      queryClient.invalidateQueries({ queryKey: ['user-reactions', postId, currentUser?.id] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const totalLikes = reactions.filter(r => r.reaction_type === 'like').length;
  const isLiked = userReactions.some(r => r.reaction_type === 'like');

  return (
    <button
      onClick={() => toggleLikeMutation.mutate()}
      disabled={toggleLikeMutation.isPending}
      className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[13px] font-medium transition-all ${
        isLiked
          ? 'bg-red-50 text-red-500 scale-105'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-red-500 stroke-red-500' : ''}`} />
      {totalLikes > 0 && <span className="font-semibold">{totalLikes}</span>}
    </button>
  );
}