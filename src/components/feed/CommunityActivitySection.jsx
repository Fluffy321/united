import React, { useState, useEffect } from 'react';
import { ChevronRight, Heart, MessageCircle, HandHeart, Calendar } from 'lucide-react';
import { dataService } from '@/services';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORY_EMOJI = {
  'Torah Learning': '📚', Shabbat: '🕯️', Chesed: '🤝', Events: '🎉',
  Youth: '👦', Families: '👨‍👩‍👧', Seniors: '👴', General: '💬',
};

const POST_TYPE_CONFIG = {
  post:  { label: null,            color: '#2563EB', bg: '#EFF6FF', icon: null },
  help:  { label: 'Help Request',  color: '#D97706', bg: '#FFFBEB', icon: HandHeart },
  event: { label: 'Event',         color: '#7C3AED', bg: '#F5F3FF', icon: Calendar },
};

function CommunityTag({ group, postType }) {
  const cfg = POST_TYPE_CONFIG[postType] || POST_TYPE_CONFIG.post;
  const emoji = group ? (CATEGORY_EMOJI[group.category] || '💬') : '💬';
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      {/* Community badge */}
      <span
        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: '#EFF6FF', color: '#2563EB' }}
      >
        <span>{emoji}</span>
        {group?.name || 'Community'}
      </span>

      {/* Type badge (help / event) */}
      {Icon && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
      )}
    </div>
  );
}

function PostCard({ post, group, onClick }) {
  const postType = post.post_type || 'post';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <CommunityTag group={group} postType={postType} />

      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 flex-shrink-0">
          {post.user_name?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-[13px] font-semibold text-slate-800 flex-1 truncate">{post.user_name}</span>
        <span className="text-[11px] text-slate-400 flex-shrink-0">
          {formatDistanceToNow(parseISO(post.created_date), { addSuffix: true })}
        </span>
      </div>

      {/* Body */}
      <p className="text-[14px] text-slate-700 leading-relaxed line-clamp-3">{post.body}</p>

      {/* Image */}
      {post.image_url && (
        <img src={post.image_url} alt="" className="mt-2.5 w-full rounded-xl object-cover max-h-48" />
      )}

      {/* Help status pill */}
      {postType === 'help' && (
        <div className="mt-2.5">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={post.help_status === 'fulfilled'
              ? { background: '#DCFCE7', color: '#166534' }
              : { background: '#FEF3C7', color: '#92400E' }
            }
          >
            {post.help_status === 'fulfilled' ? '✓ Fulfilled' : '● Open'}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-50">
        <span className="flex items-center gap-1 text-[12px] text-slate-400">
          <Heart className="w-3.5 h-3.5" /> {post.likes_count || 0}
        </span>
        <span className="flex items-center gap-1 text-[12px] text-slate-400">
          <MessageCircle className="w-3.5 h-3.5" /> {post.comments_count || 0}
        </span>
      </div>
    </div>
  );
}

export default function CommunityActivitySection({ currentUser, onNavigateToCommunities }) {
  const [posts, setPosts] = useState([]);
  const [groupMap, setGroupMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasMemberships, setHasMemberships] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.id) return;
    load();
  }, [currentUser?.id]);

  const load = async () => {
    setLoading(true);
    const memberships = await dataService.entities.GroupMember.filter({ user_id: currentUser.id });

    if (memberships.length === 0) {
      setHasMemberships(false);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map(m => m.group_id);

    const [allGroups, recentPosts] = await Promise.all([
      dataService.entities.CommunityGroup.list('-created_date', 200),
      dataService.entities.GroupPost.list('-created_date', 80),
    ]);

    const gMap = {};
    allGroups.forEach(g => { gMap[g.id] = g; });
    setGroupMap(gMap);

    const communityPosts = recentPosts
      .filter(p => groupIds.includes(p.group_id))
      .slice(0, 30);

    setPosts(communityPosts);
    setLoading(false);
  };

  const goToCommunities = () => navigate(createPageUrl('Communities'));

  if (loading) {
    return (
      <div className="space-y-2.5 mb-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="skeleton h-5 w-24 rounded-full" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="skeleton w-7 h-7 rounded-full" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
            <div className="skeleton h-3 w-full rounded mb-1" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!hasMemberships || posts.length === 0) {
    return (
      <button
        onClick={goToCommunities}
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
      {/* Section header */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Your Communities</p>
        <button onClick={goToCommunities} className="text-[12px] font-semibold text-[#2563EB]">
          See all →
        </button>
      </div>

      <div className="space-y-2.5">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            group={groupMap[post.group_id]}
            onClick={goToCommunities}
          />
        ))}
      </div>
    </div>
  );
}