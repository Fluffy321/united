import React, { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Pin, Eye, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { dataService, checkRateLimit, RateLimitError } from '@/services';
import { toast } from 'sonner';
import { createReaction, deleteReaction, filterReaction } from '@/services/entityServices';

const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];

function Avatar({ name = '?' }) {
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0" style={{ background: color }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

const REACTIONS = ['❤️','👍','🙏','📌','✅'];

function AnnouncementReactionBar({ postId, currentUser, memberCount }) {
  const [myReaction, setMyReaction] = useState(null);
  const [counts, setCounts] = useState({});
  const [pickerOpen, setPicker] = useState(false);

  const react = async (emoji) => {
    setPicker(false);
    if (myReaction === emoji) {
      setMyReaction(null);
      setCounts(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 1) - 1) }));
    } else {
      if (myReaction) setCounts(prev => ({ ...prev, [myReaction]: Math.max(0, (prev[myReaction] || 1) - 1) }));
      setMyReaction(emoji);
      setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    }
    try {
      await checkRateLimit('react');
      const existing = await filterReaction({ post_id: postId, user_id: currentUser?.id });
      for (const r of existing) await deleteReaction(r.id);
      if (myReaction !== emoji) {
        await createReaction({ post_id: postId, user_id: currentUser?.id, emoji });
      }
    } catch (err) {
      if (err instanceof RateLimitError) toast.error(err.message);
    }
  };

  return (
    <div className="relative flex items-center gap-3">
      <div className="flex gap-1">
        {REACTIONS.map(em => (
          <button
            key={em}
            onClick={() => currentUser ? react(em) : dataService.auth.redirectToLogin()}
            className={`text-base transition-transform hover:scale-125 active:scale-110 ${myReaction === em ? 'filter-none' : 'opacity-60 hover:opacity-100'}`}
          >
            {em}
            {counts[em] > 0 && <span className="text-[9px] ml-0.5 text-slate-600">{counts[em]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnnouncementCard({ post, isPinned, currentUser, memberCount }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const name = post.author_name || post.user_name || 'Admin';
  const timeAgo = post.created_date ? formatDistanceToNow(parseISO(post.created_date), { addSuffix: true }) : '';
  const isUrgent = post.category === 'urgent' || post.is_urgent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
        isPinned ? 'border-amber-200' : isUrgent ? 'border-red-200' : 'border-slate-100'
      }`}
    >
      {isPinned && <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />}
      {isUrgent && !isPinned && <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500" />}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-2.5 mb-3">
          <Avatar name={name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[13px] font-semibold text-slate-900">{name}</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">📢 Admin</span>
              {isPinned && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  <Pin className="w-2.5 h-2.5" /> Pinned
                </span>
              )}
              {isUrgent && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">🚨 Urgent</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">{timeAgo}</p>
          </div>
        </div>

        {/* Content */}
        {post.title && <p className="text-[16px] font-bold text-slate-900 mb-2 leading-snug">{post.title}</p>}
        {post.body && <p className="text-[13px] text-slate-600 leading-relaxed">{post.body}</p>}
        {post.image_url && (
          <img src={post.image_url} alt="" className="w-full rounded-xl mt-3 object-cover max-h-64" loading="lazy" />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 gap-2 flex-wrap">
          <AnnouncementReactionBar postId={post.id} currentUser={currentUser} memberCount={memberCount} />

          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            {/* Seen by counter */}
            {memberCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Eye className="w-3.5 h-3.5" />
                {post.seen_count || 0} / {memberCount}
              </span>
            )}
            {/* Acknowledge button (for required-acknowledgment posts) */}
            {post.requires_acknowledgment && !acknowledged && (
              <button
                onClick={() => setAcknowledged(true)}
                className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge
              </button>
            )}
            {acknowledged && (
              <span className="flex items-center gap-1 text-[12px] font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: '🚨 Urgent' },
  { key: 'event', label: '📅 Events' },
  { key: 'closing', label: '🔒 Closings' },
  { key: 'general', label: '📋 General' },
];

export default function CommunityAnnouncementsTab({ announcements, allPosts, community, currentUser, memberCount = 0 }) {
  const [filter, setFilter] = useState('all');

  const safeAnnouncements = announcements || [];
  const safeAllPosts = allPosts || [];

  const pinned = safeAnnouncements.filter(p => p.is_pinned);
  const adminPosts = safeAnnouncements.filter(p => !p.is_pinned);
  const extraAnnounce = safeAllPosts.filter(p =>
    p.post_type === 'announcement' && !safeAnnouncements.find(a => a.id === p.id)
  );
  let all = [...pinned, ...adminPosts, ...extraAnnounce];

  // Apply filter
  if (filter !== 'all') {
    all = all.filter(p => {
      if (filter === 'urgent') return p.category === 'urgent' || p.is_urgent;
      if (filter === 'event') return p.category === 'event' || (p.title || '').toLowerCase().includes('event');
      if (filter === 'closing') return (p.title || '').toLowerCase().includes('clos');
      return !p.category || p.category === 'general' || !['urgent','event','closing'].includes(p.category);
    });
  }

  return (
    <div className="pt-4 space-y-4 pb-8">
      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {all.length === 0 ? (
        <div className="app-empty-state">
          <div className="text-4xl mb-3">📢</div>
          <p className="app-empty-state-title">No announcements yet</p>
          <p className="app-empty-state-body">Community updates from admins will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {all.map(p => (
            <AnnouncementCard
              key={p.id}
              post={p}
              isPinned={pinned.includes(p)}
              currentUser={currentUser}
              memberCount={memberCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}