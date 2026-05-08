import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { dataService, notificationsService } from '@/services';
import { createPageUrl } from '@/utils';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import CommentsSheet from '@/components/feed/CommentsSheet';
import ReportModal from '@/components/common/ReportModal';
import { toast } from 'sonner';



export default function PostDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('id');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const user = await dataService.auth.me();
      setCurrentUser(user);

      const posts = await dataService.entities.UnifiedPost.filter({ id: postId });
      if (posts[0]) {
        setPost(posts[0]);
      } else {
        navigate(createPageUrl('Feed'));
        return;
      }

      // Load user likes
      const likes = await dataService.entities.Like.filter({ user_id: user.id });
      setUserLikes(likes.map(l => l.post_id));

      // Load user bookmarks
      const bookmarks = await dataService.entities.Bookmark.filter({ user_id: user.id });
      setUserBookmarks(bookmarks.map(b => b.post_id));
    } catch (e) {
      console.error('Failed to load post', e);
      navigate(createPageUrl('Feed'));
    }
    setLoading(false);
  };

  const handleLike = async () => {
    if (!post) return;
    const isLiked = userLikes.includes(post.id);
    setUserLikes(prev => isLiked ? prev.filter(id => id !== post.id) : [...prev, post.id]);
    
    if (isLiked) {
      const like = await dataService.entities.Like.filter({ post_id: post.id, user_id: currentUser.id });
      if (like[0]) await dataService.entities.Like.delete(like[0].id);
    } else {
      await dataService.entities.Like.create({ post_id: post.id, user_id: currentUser.id });
      if (post.user_id !== currentUser.id) {
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
    }
    await dataService.entities.UnifiedPost.update(post.id, {
      likes_count: Math.max(0, (post.likes_count || 0) + (isLiked ? -1 : 1))
    });
  };

  const handleBookmark = async () => {
    if (!post) return;
    const isBookmarked = userBookmarks.includes(post.id);
    setUserBookmarks(prev => isBookmarked ? prev.filter(id => id !== post.id) : [...prev, post.id]);
    
    if (isBookmarked) {
      const bookmark = await dataService.entities.Bookmark.filter({ post_id: post.id, user_id: currentUser.id });
      if (bookmark[0]) await dataService.entities.Bookmark.delete(bookmark[0].id);
    } else {
      await dataService.entities.Bookmark.create({ post_id: post.id, user_id: currentUser.id });
      toast.success('Post saved');
    }
  };

  const handleDelete = async () => {
    await dataService.entities.UnifiedPost.delete(post.id);
    toast.success('Post deleted');
    navigate(createPageUrl('Feed'));
  };

  const handleBlock = async (userId) => {
    await dataService.entities.Block.create({ blocker_id: currentUser.id, blocked_id: userId });
    setUserBookmarks(prev => prev.filter(id => id !== post.id));
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

          <button
            onClick={handleBookmark}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              userBookmarks.includes(post.id)
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${userBookmarks.includes(post.id) ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Save</span>
          </button>
        </div>

        {/* Comments */}
        <div className="mt-6">
          <CommentsSheet
            postId={post.id}
            postAuthorId={post.user_id}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
            currentUser={currentUser}
            blockedIds={[]}
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
