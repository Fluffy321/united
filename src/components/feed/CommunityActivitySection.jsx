import React, { useState, useEffect } from 'react';
import { Users, ChevronRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const CATEGORY_CONFIG = {
  'Torah Learning': { emoji: '📚' },
  'Shabbat':        { emoji: '🕯️' },
  'Chesed':         { emoji: '🤝' },
  'Events':         { emoji: '🎉' },
  'Youth':          { emoji: '👦' },
  'Families':       { emoji: '👨‍👩‍👧' },
  'Seniors':        { emoji: '👴' },
  'General':        { emoji: '💬' },
};

export default function CommunityActivitySection({ currentUser, onNavigateToCommunities }) {
  const [posts, setPosts] = useState([]);
  const [groupMap, setGroupMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.id) return;
    load();
  }, [currentUser?.id]);

  const load = async () => {
    setLoading(true);
    // Get user's group memberships
    const memberships = await base44.entities.GroupMember.filter({ user_id: currentUser.id });
    if (memberships.length === 0) {
      setLoading(false);
      return;
    }

    const groupIds = memberships.map(m => m.group_id);

    // Fetch group metadata and recent posts in parallel
    const [allGroups, recentPosts] = await Promise.all([
      base44.entities.CommunityGroup.list('-created_date', 200),
      base44.entities.GroupPost.list('-created_date', 60),
    ]);

    // Build a map of groupId -> group
    const gMap = {};
    allGroups.forEach(g => { gMap[g.id] = g; });
    setGroupMap(gMap);

    // Only show posts from groups the user is a member of
    const communityPosts = recentPosts
      .filter(p => groupIds.includes(p.group_id))
      .slice(0, 20);

    setPosts(communityPosts);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">From Your Communities</p>
        </div>
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="skeleton w-6 h-6 rounded-full" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
              <div className="skeleton h-3 w-full rounded mb-1" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    // Show a CTA to join communities
    return (
      <button
        onClick={onNavigateToCommunities}
        className="w-full flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 mb-4 text-left active:scale-[0.99] transition-transform"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-xl">🏘️</div>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-blue-800">Join communities to see their posts here</p>
          <p className="text-[12px] text-blue-500 mt-0.5">DRS · Young Israel · Jewish Basketball · and more</p>
        </div>
        <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
      </button>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">From Your Communities</p>
        <button
          onClick={onNavigateToCommunities}
          className="text-[12px] font-semibold text-[#2563EB]"
        >
          See all →
        </button>
      </div>

      <div className="space-y-2.5">
        {posts.map(post => {
          const group = groupMap[post.group_id];
          const emoji = group ? (CATEGORY_CONFIG[group.category]?.emoji || '💬') : '💬';

          return (
            <div
              key={post.id}
              onClick={onNavigateToCommunities}
              className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer active:scale-[0.99] transition-transform"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              {/* Community badge */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-[14px] leading-none">{emoji}</span>
                <span className="text-[11px] font-bold text-[#2563EB] truncate max-w-[160px]">
                  {group?.name || 'Community'}
                </span>
                <span className="text-slate-300 text-[11px]">·</span>
                <span className="text-[11px] text-slate-400">
                  {formatDistanceToNow(parseISO(post.created_date), { addSuffix: true })}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 flex-shrink-0">
                  {post.user_name?.[0] || '?'}
                </div>
                <span className="text-[13px] font-semibold text-slate-800">{post.user_name}</span>
              </div>

              {/* Post body */}
              <p className="text-[14px] text-slate-700 leading-relaxed line-clamp-3">{post.body}</p>

              {/* Image */}
              {post.image_url && (
                <img src={post.image_url} alt="" className="mt-2.5 w-full rounded-xl object-cover max-h-48" />
              )}

              {/* Footer counts */}
              <div className="flex items-center gap-4 mt-2.5">
                <span className="text-[12px] text-slate-400">❤️ {post.likes_count || 0}</span>
                <span className="text-[12px] text-slate-400">💬 {post.comments_count || 0}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}