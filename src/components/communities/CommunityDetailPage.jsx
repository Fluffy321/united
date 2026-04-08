import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, MapPin, Calendar, MessageSquare, Loader2, ImageIcon, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { toast } from 'sonner';

const TYPE_GRADIENTS = {
  Shul:     'from-violet-600 to-purple-700',
  School:   'from-sky-500 to-blue-600',
  Yeshiva:  'from-indigo-600 to-blue-700',
  Seminary: 'from-pink-500 to-rose-600',
  Camp:     'from-green-500 to-teal-600',
  Other:    'from-orange-500 to-amber-600',
};

const AVATAR_COLORS = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function Avatar({ name = '?', size = 8, index = 0 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length], fontSize: size <= 8 ? 12 : 14 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

/* ── Activity Badge ─────────────────────────────────────────── */
function ActivityBadge({ count }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
      {count} active
    </span>
  );
}

/* ── Hero Banner ────────────────────────────────────────────── */
function CommunityBanner({ community, isFollowing, onFollow, onBack, memberCount }) {
  const gradient = TYPE_GRADIENTS[community.type] || 'from-blue-600 to-indigo-700';
  const initials = getInitials(community.name);

  return (
    <div className="relative">
      {/* Tall gradient header */}
      <div className={`h-52 w-full bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {community.cover_image_url && (
          <img src={community.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        )}
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Name & stats overlaid on banner */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-white font-extrabold text-[22px] leading-tight drop-shadow">{community.name}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {community.type && (
                <span className="text-[11px] font-bold bg-white/20 backdrop-blur-sm text-white rounded-full px-2.5 py-0.5">{community.type}</span>
              )}
              <span className="flex items-center gap-1 text-white/80 text-[12px] font-medium">
                <Users className="w-3.5 h-3.5" /> {(memberCount || community.follower_count || 0).toLocaleString()} members
              </span>
              {(community.neighborhood || community.address) && (
                <span className="flex items-center gap-1 text-white/70 text-[12px]">
                  <MapPin className="w-3.5 h-3.5" />{community.neighborhood || community.address?.split(',')[0]}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onFollow}
            className={`flex-shrink-0 rounded-full px-5 py-2.5 text-[13px] font-bold transition-all active:scale-95 ${
              isFollowing
                ? 'bg-white/20 backdrop-blur-sm text-white border border-white/40'
                : 'bg-white text-blue-700 shadow-lg'
            }`}
          >
            {isFollowing ? '✓ Joined' : '+ Join'}
          </button>
        </div>
      </div>

      {/* Description strip */}
      {(community.description_short || community.description) && (
        <div className="bg-white border-b border-slate-100 px-4 py-3">
          <p className="text-[13px] text-slate-600 leading-relaxed">
            {community.description_short || community.description}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Post Card ─────────────────────────────────────────────── */
function PostCard({ post }) {
  const name = post.author_name || post.user_name || 'Community';
  const isAnnouncement = post.type === 'announcement';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isAnnouncement ? 'border-amber-200' : 'border-slate-100'}`}>
      {isAnnouncement && <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />}
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full h-44 object-cover" loading="lazy" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-2.5">
          <Avatar name={name} size={8} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate">{name}</p>
            <p className="text-[11px] text-slate-400">
              {post.created_date ? formatDistanceToNow(parseISO(post.created_date), { addSuffix: true }) : ''}
            </p>
          </div>
          {isAnnouncement && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">📢 Announcement</span>
          )}
        </div>
        {post.title && <p className="text-[15px] font-bold text-slate-900 mb-1 leading-snug">{post.title}</p>}
        {post.body && <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-3">{post.body}</p>}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
          <button className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-blue-600 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Reply
          </button>
          {post.likes_count > 0 && (
            <span className="text-[12px] text-slate-400">❤️ {post.likes_count}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Prompt Card ───────────────────────────────────────────── */
function PromptCard({ prompt }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-yellow-300" />
        <span className="text-[11px] font-bold text-white/70 uppercase tracking-wide">Community Question</span>
      </div>
      <p className="text-[15px] font-bold leading-snug">{prompt.prompt_text || prompt.body}</p>
      <button className="mt-3 bg-white/20 backdrop-blur-sm text-white text-[12px] font-bold rounded-full px-4 py-1.5 hover:bg-white/30 transition-colors active:scale-95">
        Answer →
      </button>
    </div>
  );
}

/* ── Event Card ────────────────────────────────────────────── */
function EventCard({ event }) {
  const dateStr = event.start_date || event.event_date;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex gap-3 items-start">
      <div className="flex-shrink-0 w-13 h-13 w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-sm">
        {dateStr ? (
          <>
            <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">{format(parseISO(dateStr), 'MMM')}</span>
            <span className="text-[20px] font-black leading-none">{format(parseISO(dateStr), 'd')}</span>
          </>
        ) : (
          <Calendar className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-900 truncate">{event.title || event.name}</p>
        {event.location_text && (
          <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
            <MapPin className="w-3 h-3" />{event.location_text}
          </p>
        )}
        {event.description && <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{event.description}</p>}
      </div>
    </div>
  );
}

/* ── Members Grid ──────────────────────────────────────────── */
function MembersList({ members }) {
  if (!members.length) return (
    <div className="text-center py-10 text-slate-400 text-[13px]">No members yet</div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {members.slice(0, 20).map((m, i) => (
        <div key={m.id || i} className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3 shadow-sm">
          <Avatar name={m.user_name || m.full_name || '?'} size={9} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate">{m.user_name || m.full_name || 'Member'}</p>
            {m.role && m.role !== 'member' && (
              <span className="text-[10px] font-bold text-blue-600">{m.role}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function CommunityDetailPage({ communityId, currentUser, onBack }) {
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    Promise.allSettled([
      base44.entities.Community.filter({ id: communityId }).then(r => r[0]),
      base44.entities.CommunityPost.filter({ community_id: communityId }, '-created_date', 10),
      base44.entities.CommunityEvent.filter({ community_id: communityId }, 'start_date', 10),
      base44.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 50),
      base44.entities.CommunityPrompt.filter({ community_id: communityId }, '-created_date', 3),
      currentUser ? base44.entities.CommunityFollow.filter({ community_id: communityId, user_id: currentUser.id }) : Promise.resolve([]),
    ]).then(([comm, postsRes, eventsRes, membersRes, promptsRes, followRes]) => {
      if (comm.status === 'fulfilled') setCommunity(comm.value);
      if (postsRes.status === 'fulfilled') setPosts(postsRes.value || []);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value || []);
      if (membersRes.status === 'fulfilled') setMembers(membersRes.value || []);
      if (promptsRes.status === 'fulfilled') setPrompts(promptsRes.value || []);
      if (followRes.status === 'fulfilled') setIsFollowing((followRes.value || []).length > 0);
      setLoading(false);
    });
  }, [communityId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) { toast.error('Sign in to join'); return; }
    if (isFollowing) {
      const recs = await base44.entities.CommunityFollow.filter({ community_id: communityId, user_id: currentUser.id });
      for (const r of recs) await base44.entities.CommunityFollow.delete(r.id);
      const mems = await base44.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id });
      for (const m of mems) await base44.entities.UserCommunity.delete(m.id);
      setIsFollowing(false);
      toast.success('Left community');
    } else {
      await base44.entities.CommunityFollow.create({ community_id: communityId, user_id: currentUser.id });
      await base44.entities.UserCommunity.create({ user_id: currentUser.id, community_id: communityId, role: 'Member' });
      setIsFollowing(true);
      toast.success('Joined! 🎉');
    }
  };

  if (loading || !community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const allPosts = [...prompts.map(p => ({ ...p, _isPrompt: true })), ...posts];
  const recentActive = members.filter(m => {
    if (!m.created_date) return false;
    return Date.now() - new Date(m.created_date).getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const TABS = [
    { id: 'posts',   label: 'Posts',   count: allPosts.length },
    { id: 'events',  label: 'Events',  count: events.length },
    { id: 'members', label: 'Members', count: members.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <CommunityBanner
        community={community}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onBack={onBack}
        memberCount={members.length}
      />

      {/* Activity strip */}
      {(recentActive > 0 || posts.length > 0) && (
        <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-3">
          <ActivityBadge count={recentActive || Math.min(members.length, 8)} />
          {posts.length > 0 && (
            <span className="text-[11px] text-slate-400">{posts.length} posts this week</span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[13px] font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-400 border-transparent'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          allPosts.length === 0 ? (
            <EmptyState emoji="✍️" title="No posts yet" sub="Be the first to share something with this community." />
          ) : (
            allPosts.map(p => p._isPrompt
              ? <PromptCard key={p.id} prompt={p} />
              : <PostCard key={p.id} post={p} />
            )
          )
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          events.length === 0 ? (
            <EmptyState emoji="📅" title="No upcoming events" sub="Check back soon for community events." />
          ) : (
            events.map(e => <EventCard key={e.id} event={e} />)
          )
        )}

        {/* Members Tab */}
        {activeTab === 'members' && <MembersList members={members} />}
      </div>
    </div>
  );
}

function EmptyState({ emoji, title, sub }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-10 text-center">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="text-[15px] font-bold text-slate-900">{title}</p>
      <p className="text-[13px] text-slate-500 mt-1">{sub}</p>
    </div>
  );
}