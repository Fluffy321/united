import React from 'react';
import { MessageCircle, Heart } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function RecentPostsSection({ posts, currentUser, profileUser, isOwnProfile }) {
  const preview = (posts || []).slice(0, 3);
  const navigate = useNavigate();

  if (!preview || preview.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Recent Posts</h2>
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-400 text-sm">No posts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <h2 className="text-sm font-bold text-slate-900 mb-3">Recent Posts</h2>
      <div className="space-y-2.5">
        {preview.map(post => (
          <div
            key={post.id}
            className="bg-white rounded-xl border border-slate-100 p-3.5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/Feed?postId=${post.id}`)}
          >
            <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed mb-2">
              {post.body || post.title}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{formatDistanceToNow(parseISO(post.created_date), { addSuffix: true })}</span>
              <div className="flex gap-3">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> {post.likes_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" /> {post.comments_count || 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {posts.length > 0 && (
        <button className="w-full text-center py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-3">
          View All Posts
        </button>
      )}
    </div>
  );
}