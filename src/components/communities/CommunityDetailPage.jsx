import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, MapPin, Calendar, MessageSquare, Bell, Loader2, ChevronRight } from 'lucide-react';
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

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* ── Banner / Header ─────────────────────────────────────── */
function CommunityBanner({ community, isFollowing, onFollow, onBack, memberCount }) {
  const gradient = TYPE_GRADIENTS[community.type] || 'from-blue-600 to-indigo-700';
  const initials = getInitials(community.name);

  return (
    <div className="relative">
      {/* Background */}
      <div className={`h-44 w-full bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {community.cover_image_url && (
          <img src={community.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Info row */}
      <div className="px-4 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-end justify-between -mt-8 mb-3">
          {/* Logo */}
          {community.logo_url ? (
            <img src={community.logo_url} alt={community.name} className="w-16 h-16 rounded-2xl border-4 border-white shadow-md object-cover" />
          ) : (
            <div className={`w-16 h-16 rounded-2xl border-4 border-white shadow-md bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg`}>
              {initials}
            </div>
          )}

          {/* Join button */}
          <button
            onClick={onFollow}
            className={`rounded-full px-5 py-2.5 text-[13px] font-bold transition-all active:scale-95 ${
              isFollowing
                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
            }`}
          >
            {isFollowing ? '✓ Joined' : 'Join'}
          </button>
        </div>

        <h1 className="text-[20px] font-bold text-slate-900 leading-tight">{community.name}</h1>

        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[12px] text-slate-500">
          {community.type && (
            <span className="bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 font-semibold">{community.type}</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {(memberCount || community.follower_count || 0).toLocaleString()} members
          </span>
          {(community.neighborhood || community.address) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {community.neighborhood || community.address?.split(',')[0]}
            </span>
          )}
        </div>

        {(community.description_short || community.description) && (
          <p className="mt-2.5 text-[13px] text-slate-600 leading-relaxed">
            {community.description_short || community.description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Section Header ───────────────────────────────────────── */
function SectionHeader({ title, icon: Icon, count, onSeeAll }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
        {count > 0 && <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">{count}</span>}
      </div>
      {onSeeAll && (
        <button onClick={onSeeAll} className="flex items-center gap-0.5 text-[12px] font-semibold text-blue-600">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Post Card ────────────────────────────────────────────── */
function PostCard({ post }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[12px] font-bold text-blue-600 flex-shrink-0">
          {(post.author_name || post.user_name || '?')[0]}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-900">{post.author_name || post.user_name || 'Community'}</p>
          <p className="text-[11px] text-slate-400">
            {post.created_date ? formatDistanceToNow(parseISO(post.created_date), { addSuffix: true }) : ''}
          </p>
        </div>
        {post.type === 'announcement' && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">📢 Announcement</span>
        )}
      </div>
      {post.title && <p className="text-[14px] font-semibold text-slate-900 mb-1">{post.title}</p>}
      {post.body && <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-3">{post.body}</p>}
    </div>
  );
}

/* ── Event Card ───────────────────────────────────────────── */
function EventCard({ event }) {
  const dateStr = event.start_date || event.event_date;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex gap-3 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center border border-blue-100">
        {dateStr ? (
          <>
            <span className="text-[10px] font-bold text-blue-500 uppercase">
              {format(parseISO(dateStr), 'MMM')}
            </span>
            <span className="text-[16px] font-black text-blue-700 leading-none">
              {format(parseISO(dateStr), 'd')}
            </span>
          </>
        ) : (
          <Calendar className="w-5 h-5 text-blue-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-slate-900 truncate">{event.title || event.name}</p>
        {event.location_text && <p className="text-[11px] text-slate-400 mt-0.5">{event.location_text}</p>}
        {event.description && <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{event.description}</p>}
      </div>
    </div>
  );
}

/* ── Members Row ──────────────────────────────────────────── */
function MembersRow({ members }) {
  const shown = members.slice(0, 6);
  const colors = ['#2563EB','#7C3AED','#16A34A','#F59E0B','#EC4899','#0891B2'];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {shown.map((m, i) => (
        <div key={m.id || i} className="flex items-center gap-1.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white border-2 border-white shadow-sm"
            style={{ background: colors[i % colors.length] }}
          >
            {(m.user_name || m.full_name || '?')[0]}
          </div>
        </div>
      ))}
      {members.length > 6 && (
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 border-2 border-white shadow-sm">
          +{members.length - 6}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function CommunityDetailPage({ communityId, currentUser, onBack }) {
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    Promise.allSettled([
      base44.entities.Community.filter({ id: communityId }).then(r => r[0]),
      base44.entities.CommunityPost.filter({ community_id: communityId }, '-created_date', 5),
      base44.entities.CommunityEvent.filter({ community_id: communityId }, 'start_date', 5),
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
      toast.success('Joined!');
    }
  };

  if (loading || !community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <CommunityBanner
        community={community}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onBack={onBack}
        memberCount={members.length}
      />

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-6">

        {/* Latest Posts */}
        {posts.length > 0 && (
          <section>
            <SectionHeader title="Latest Posts" icon={MessageSquare} count={posts.length} />
            <div className="space-y-3">
              {posts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && (
          <section>
            <SectionHeader title="Upcoming Events" icon={Calendar} count={events.length} />
            <div className="space-y-3">
              {events.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </section>
        )}

        {/* Members */}
        {members.length > 0 && (
          <section>
            <SectionHeader title="Members" icon={Users} count={members.length} />
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <MembersRow members={members} />
            </div>
          </section>
        )}

        {/* Community Prompts */}
        {prompts.length > 0 && (
          <section>
            <SectionHeader title="Community Prompts" icon={Bell} count={prompts.length} />
            <div className="space-y-3">
              {prompts.map(prompt => (
                <div key={prompt.id} className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-sm">
                  <p className="text-[14px] font-semibold leading-snug">{prompt.prompt_text || prompt.body}</p>
                  {prompt.created_date && (
                    <p className="text-[11px] text-white/70 mt-2">
                      {formatDistanceToNow(parseISO(prompt.created_date), { addSuffix: true })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {posts.length === 0 && events.length === 0 && members.length === 0 && (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-10 text-center">
            <div className="text-4xl mb-3">🏘️</div>
            <p className="text-[15px] font-bold text-slate-900">Just getting started</p>
            <p className="text-[13px] text-slate-500 mt-1">Be the first to join and start the conversation.</p>
            {!isFollowing && (
              <button
                onClick={handleFollow}
                className="mt-4 rounded-full bg-blue-600 text-white px-5 py-2.5 text-[13px] font-semibold"
              >
                Join Community
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}