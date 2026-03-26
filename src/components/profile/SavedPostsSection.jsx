import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';

export default function SavedPostsSection({ currentUser }) {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState([]);

  useEffect(() => {
    loadSavedPosts();
  }, [currentUser?.id]);

  const loadSavedPosts = async () => {
    try {
      const bookmarks = await base44.entities.Bookmark.filter({ user_id: currentUser.id });
      const postIds = bookmarks.map(b => b.post_id);
      
      if (postIds.length === 0) {
        setSavedPosts([]);
        setLoading(false);
        return;
      }

      const posts = await base44.entities.UnifiedPost.list('-created_date', 100);
      const filtered = posts.filter(p => postIds.includes(p.id));
      setSavedPosts(filtered);

      const likes = await base44.entities.Like.filter({ user_id: currentUser.id });
      setUserLikes(likes.map(l => l.post_id));
    } catch (e) {
      console.error('Failed to load saved posts', e);
    }
    setLoading(false);
  };

  const handleLike = async (postId) => {
    const isLiked = userLikes.includes(postId);
    setUserLikes(prev => isLiked ? prev.filter(id => id !== postId) : [...prev, postId]);
    
    if (isLiked) {
      const like = await base44.entities.Like.filter({ post_id: postId, user_id: currentUser.id });
      if (like[0]) await base44.entities.Like.delete(like[0].id);
    } else {
      await base44.entities.Like.create({ post_id: postId, user_id: currentUser.id });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <p className="text-3xl mb-3">🔖</p>
        <p className="font-bold text-slate-900">No saved posts yet</p>
        <p className="text-sm text-slate-500 mt-1">Posts you save will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {savedPosts.map(post => (
        <UnifiedPostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          liked={userLikes.includes(post.id)}
          onLike={() => handleLike(post.id)}
          onComment={() => {}}
          onDelete={() => {}}
          onBlock={() => {}}
          onReport={() => {}}
        />
      ))}
    </div>
  );
}