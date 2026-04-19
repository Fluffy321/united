import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Pin, Megaphone, Heart, MessageSquare } from 'lucide-react';

const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];

function Avatar({ name = '?' }) {
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0" style={{ background: color }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function AnnouncementCard({ post, isPinned }) {
  const name = post.author_name || post.user_name || 'Admin';
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isPinned ? 'border-amber-200' : 'border-slate-100'}`}>
      {isPinned && <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar name={name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-slate-900">{name}</p>
              {isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  <Pin className="w-2.5 h-2.5" /> Pinned
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {post.created_date ? formatDistanceToNow(parseISO(post.created_date), { addSuffix: true }) : ''}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">📢 Announcement</span>
        </div>
        {post.title && <p className="text-[16px] font-bold text-slate-900 mb-2 leading-snug">{post.title}</p>}
        {post.body && <p className="text-[14px] text-slate-600 leading-relaxed">{post.body}</p>}
        {post.image_url && (
          <img src={post.image_url} alt="" className="w-full rounded-xl mt-3 object-cover max-h-64" loading="lazy" />
        )}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
          <span className="flex items-center gap-1.5 text-[12px] text-slate-400">
            <Heart className="w-3.5 h-3.5" /> {post.likes_count || 0}
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-slate-400">
            <MessageSquare className="w-3.5 h-3.5" /> {post.comments_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CommunityAnnouncementsTab({ announcements, allPosts, community }) {
  const safeAnnouncements = announcements || [];
  const safeAllPosts = allPosts || [];
  // Show pinned/announcements first, then recent admin posts
  const pinned = safeAnnouncements.filter(p => p.is_pinned);
  const adminPosts = safeAnnouncements.filter(p => !p.is_pinned);
  // Also show any posts with "announcement" type from all posts
  const extraAnnounce = safeAllPosts.filter(p => p.post_type === 'announcement' && !safeAnnouncements.find(a => a.id === p.id));

  const all = [...pinned, ...adminPosts, ...extraAnnounce];

  if (all.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center mb-4">
        <div className="text-4xl mb-3">📢</div>
        <p className="text-[15px] font-bold text-slate-900">No announcements yet</p>
        <p className="text-[13px] text-slate-500 mt-1">Community updates from admins will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {pinned.length > 0 && (
        <div className="flex items-center gap-2 text-[12px] font-bold text-amber-600 mb-1">
          <Pin className="w-3.5 h-3.5" /> Pinned
        </div>
      )}
      {pinned.map(p => <AnnouncementCard key={p.id} post={p} isPinned />)}

      {(adminPosts.length > 0 || extraAnnounce.length > 0) && (
        <>
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500 mt-2 mb-1">
            <Megaphone className="w-3.5 h-3.5" /> Recent Updates
          </div>
          {[...adminPosts, ...extraAnnounce].map(p => <AnnouncementCard key={p.id} post={p} isPinned={false} />)}
        </>
      )}
    </div>
  );
}