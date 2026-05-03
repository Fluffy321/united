import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ReactionBar({ postId, currentUser }) {
  const queryClient = useQueryClient();
  const isRealUser = !!currentUser && currentUser.id !== 'guest';
  const [popping, setPopping] = useState(false);
  const [localLiked, setLocalLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);

  const { data: reactions = [] } = useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: () => base44.entities.Reaction.filter({ post_id: postId }, '-created_date', 100),
    enabled: !!postId && appParams.hasBackendConfig,
    staleTime: 300000,
    gcTime: 600000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const { data: userReactions = [] } = useQuery({
    queryKey: ['user-reactions', postId, currentUser?.id],
    queryFn: () => base44.entities.Reaction.filter({ post_id: postId, user_id: currentUser.id }, undefined, 100),
    enabled: !!postId && isRealUser && appParams.hasBackendConfig,
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

  const totalLikes = appParams.hasBackendConfig ? reactions.filter(r => r.reaction_type === 'like').length : localLikes;
  const isLiked = appParams.hasBackendConfig ? userReactions.some(r => r.reaction_type === 'like') : localLiked;

  const handleClick = () => {
    if (!isLiked) {
      setPopping(true);
      setTimeout(() => setPopping(false), 350);
    }
    if (!appParams.hasBackendConfig) {
      setLocalLiked(value => !value);
      setLocalLikes(value => isLiked ? Math.max(0, value - 1) : value + 1);
      return;
    }
    toggleLikeMutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleLikeMutation.isPending}
      className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[13px] font-medium transition-colors ${
        isLiked
          ? 'bg-red-50 text-red-500'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      <Heart
        className={`w-4 h-4 ${isLiked ? 'fill-red-500 stroke-red-500' : ''} ${popping ? 'animate-reaction-pop' : 'transition-all duration-150'}`}
      />
      {totalLikes > 0 && <span className="font-semibold">{totalLikes}</span>}
    </button>
  );
}
