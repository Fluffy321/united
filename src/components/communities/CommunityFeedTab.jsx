import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Megaphone, Sparkles } from 'lucide-react';

function PostCard({ post }) {
  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
    : '';

  const isAnnouncement = post.type === 'announcement';

  return (
    <div className={`bg-white rounded-2xl border p-4 ${post.is_pinned ? 'border-amber-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {post.is_pinned && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
          {isAnnouncement && (
            <span className="flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">
              <Megaphone className="w-2.5 h-2.5" /> Announcement
            </span>
          )}
          {post.is_seeded && (
            <span className="flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" /> Sample content
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 flex-shrink-0">{timeAgo}</span>
      </div>
      {post.title && <h3 className="font-bold text-slate-900 text-[14px] mb-1">{post.title}</h3>}
      <p className="text-[13px] text-slate-700 leading-relaxed">{post.body}</p>
      {post.author_name && (
        <p className="text-[11px] text-slate-400 mt-2">— {post.author_name}</p>
      )}
    </div>
  );
}

export default function CommunityFeedTab({ posts, isLoading }) {
  const feedPosts = (posts || []).filter(p => p.type === 'general' || p.type === 'announcement');
  const sorted = [...feedPosts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_date) - new Date(a.created_date);
  });

  if (isLoading) return (
    <div className="space-y-3 pt-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-3.5 w-48 rounded" />
          <div className="skeleton h-3 w-full rounded" />
        </div>
      ))}
    </div>
  );

  if (sorted.length === 0) return (
    <div className="text-center py-14">
      <p className="text-3xl mb-2">📋</p>
      <p className="text-[14px] font-semibold text-slate-700">No posts yet</p>
      <p className="text-[12px] text-slate-400 mt-1">Check back soon!</p>
    </div>
  );

  return (
    <div className="space-y-3 pt-4">
      {sorted.map(p => <PostCard key={p.id} post={p} />)}
    </div>
  );
}