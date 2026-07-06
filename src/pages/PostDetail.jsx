import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Heart, MessageCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notificationsService, togglePostLike, loadUserPostLikes } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import CommentsSheet from '@/components/feed/CommentsSheet';
import ReportModal from '@/components/common/ReportModal';
import { toast } from 'sonner';
import { captureError } from '@/lib/analytics';
import { createBlock, deleteUnifiedPost, filterBlock, filterUnifiedPost } from '@/services/entityServices';



export default function PostDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('id');
  
  const { user: currentUser } = useAuth();
  const [userLikes, setUserLikes] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const { data: post, isLoading: loading, isError } = useQuery({
    queryKey: ['unified-post', postId],
    queryFn: async () => {
      const posts = await filterUnifiedPost({ id: postId });
      return posts[0] ?? null;
    },
    enabled: !!postId,
  });

  const { data: likedPostIds } = useQuery({
    queryKey: ['user-post-likes', currentUser?.id],
    queryFn: () => loadUserPostLikes(currentUser.id),
    enabled: !!currentUser?.id,
  });

  // Blocked users so their comments can be filtered out below
  const { data: blockedIds = [] } = useQuery({
    queryKey: ['blocked-ids', currentUser?.id],
    queryFn: async () => {
      const blocks = await filterBlock({ blocker_id: currentUser.id });
      return blocks.map(b => b.blocked_id);
    },
    enabled: !!currentUser?.id,
  });

  // Likes stay in local state so optimistic like/unlike below keeps working
  useEffect(() => {
    if (likedPostIds) setUserLikes(likedPostIds);
  }, [likedPostIds]);

  useEffect(() => {
    if (!postId || isError || (!loading && post === null)) {
      if (isError) captureError(new Error('PostDetail: load post failed'), { context: 'PostDetail: load post' });
      navigate(createPageUrl('Feed'));
    }
  }, [postId, isError, loading, post, navigate]);

  const handleLike = async () => {
    if (!post) return;
    const wasLiked = userLikes.includes(post.id);
    // Optimistic update
    setUserLikes(prev => wasLiked ? prev.filter(id => id !== post.id) : [...prev, post.id]);
    try {
      const { liked } = await togglePostLike(post.id, currentUser.id);
      // Reconcile with the authoritative result in case of a race
      setUserLikes(prev => liked ? [...new Set([...prev, post.id])] : prev.filter(id => id !== post.id));
      if (liked && post.user_id !== currentUser.id) {
        notificationsService.create({
          userId: post.user_id,
          actorId: currentUser.id,
          type: 'like',
          title: 'New like',
          body: `${currentUser.display_name || currentUser.full_name} liked your post`,
          linkUrl: `/PostDetail?id=${post.id}`,
          postId: post.id,
        }).catch(() => {});
      }
    } catch {
      // Revert optimistic update on failure
      setUserLikes(prev => wasLiked ? [...prev, post.id] : prev.filter(id => id !== post.id));
      toast.error('Could not update like. Please try again.');
    }
  };

  const handleDelete = async () => {
    await deleteUnifiedPost(post.id);
    toast.success('Post deleted');
    navigate(createPageUrl('Feed'));
  };

  const handleBlock = async (userId) => {
    await createBlock({ blocker_id: currentUser.id, blocked_id: userId });
    toast.success('User blocked');
    navigate(createPageUrl('Feed'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!post || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Feed'))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Post</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Post Card */}
        <UnifiedPostCard
          post={post}
          currentUser={currentUser}
          liked={userLikes.includes(post.id)}
          onLike={handleLike}
          onComment={() => setShowComments(true)}
          onDelete={handleDelete}
          onBlock={handleBlock}
          onReport={() => setShowReport(true)}
        />

        {/* Action Bar */}
        <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              userLikes.includes(post.id)
                ? 'text-red-600 bg-red-50'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Heart className={`w-5 h-5 ${userLikes.includes(post.id) ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{post.likes_count || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments_count || 0}</span>
          </button>

          <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500">
            Save paused for beta
          </span>
        </div>

        {/* Comments */}
        <div className="mt-6">
          <CommentsSheet
            postId={post.id}
            postAuthorId={post.user_id}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
            currentUser={currentUser}
            blockedIds={blockedIds}
          />
          <button
            onClick={() => setShowComments(true)}
            className="w-full text-center py-3 text-blue-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
          >
            View All Comments
          </button>
        </div>
      </div>

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        contentId={post.id}
        contentType="post"
        currentUser={currentUser}
      />
    </div>
  );
}
