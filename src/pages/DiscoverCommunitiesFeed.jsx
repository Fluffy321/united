import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Calendar, MessageSquare, Users, Search, X, SlidersHorizontal, Loader2, MapPin, Clock } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import { toast } from 'sonner';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'upcoming', label: 'Upcoming Events First' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'post', label: '💬 Posts' },
  { value: 'event', label: '📅 Events' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'Shul', label: '🕍 Shul' },
  { value: 'School', label: '🏫 School' },
  { value: 'Yeshiva', label: '📖 Yeshiva' },
  { value: 'Camp', label: '⛺ Camp' },
  { value: 'Other', label: '🌐 Other' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ''; }
}

function CommunityPill({ community, onJoin, isJoined, isJoining, onOpen }) {
  if (!community) return null;
  const initials = (community.name || '').slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 justify-between">
      <button
        onClick={() => onOpen(community.id)}
        className="flex items-center gap-1.5 min-w-0"
      >
        {community.logo_url ? (
          <img src={community.logo_url} alt="" className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <span className="text-[11px] font-semibold text-slate-600 truncate hover:text-blue-600 transition-colors">{community.name}</span>
      </button>
      <button
        onClick={() => onJoin(community)}
        disabled={isJoining}
        className={`flex-shrink-0 text-[10px] font-bold rounded-full px-2.5 py-1 transition-all active:scale-95 disabled:opacity-60 ${
          isJoined ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isJoining ? '…' : isJoined ? '✓ Joined' : '+ Join'}
      </button>
    </div>
  );
}

function PostCard({ item, community, onJoin, isJoined, isJoining, onOpen }) {
  const typeConfig = {
    discussion: { label: 'Discussion', bg: 'bg-slate-100 text-slate-600' },
    question: { label: 'Question', bg: 'bg-blue-100 text-blue-700' },
    announcement: { label: 'Announcement', bg: 'bg-purple-100 text-purple-700' },
    help: { label: 'Help', bg: 'bg-orange-100 text-orange-700' },
    recommendation: { label: 'Recommend', bg: 'bg-green-100 text-green-700' },
    event: { label: 'Event', bg: 'bg-teal-100 text-teal-700' },
    general: { label: 'Post', bg: 'bg-slate-100 text-slate-600' },
  };
  const cfg = typeConfig[item.post_type] || typeConfig.general;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
          {(item.author_name || 'M')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-slate-800">{item.author_name || 'Community Member'}</span>
            <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${cfg.bg}`}>{cfg.label}</span>
            <span className="text-[11px] text-slate-400 ml-auto">{timeAgo(item.created_date)}</span>
          </div>
          {item.title && <p className="text-[14px] font-bold text-slate-900 mt-1">{item.title}</p>}
          <p className="text-[13px] text-slate-600 mt-0.5 line-clamp-3">{item.body}</p>
          {item.image_url && (
            <img src={item.image_url} alt="" className="mt-2 rounded-xl w-full max-h-48 object-cover" />
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
            {item.likes_count > 0 && <span>❤️ {item.likes_count}</span>}
            {item.comments_count > 0 && <span>💬 {item.comments_count}</span>}
          </div>
        </div>
      </div>
      <CommunityPill community={community} onJoin={onJoin} isJoined={isJoined} isJoining={isJoining} onOpen={onOpen} />
    </div>
  );
}

function EventCard({ item, community, onJoin, isJoined, isJoining, onOpen }) {
  const dateStr = item.start_date || item.event_date;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex gap-3">
        {/* Date badge */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-green-600 flex flex-col items-center justify-center text-white">
          {dateStr ? (
            <>
              <span className="text-[9px] font-bold uppercase opacity-80">{format(parseISO(dateStr), 'MMM')}</span>
              <span className="text-[18px] font-black leading-none">{format(parseISO(dateStr), 'd')}</span>
            </>
          ) : (
            <Calendar className="w-5 h-5 opacity-80" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold bg-teal-50 text-teal-700 rounded-full px-2 py-0.5">📅 Event</span>
          <p className="text-[14px] font-bold text-slate-900 mt-1 leading-snug">{item.title || item.name}</p>
          {dateStr && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3" />
              {format(parseISO(dateStr), 'EEEE, MMMM d')}
              {item.start_time && ` · ${item.start_time}`}
            </p>
          )}
          {(item.location || item.location_text) && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <MapPin className="w-3 h-3" />{item.location || item.location_text}
            </p>
          )}
          {item.description && (
            <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>
      <CommunityPill community={community} onJoin={onJoin} isJoined={isJoined} isJoining={isJoining} onOpen={onOpen} />
    </div>
  );
}

export default function DiscoverCommunitiesFeed() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [userCommunityIds, setUserCommunityIds] = useState(new Set());
  const [joiningId, setJoiningId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = await base44.auth.me().catch(() => null);
        setCurrentUser(user);

        const [allCommunities, memberships, recentPosts, upcomingEvents] = await Promise.all([
          base44.entities.Community.list('-follower_count', 100),
          user ? base44.entities.UserCommunity.filter({ user_id: user.id }) : Promise.resolve([]),
          base44.entities.CommunityPost.list('-created_date', 80),
          base44.entities.CommunityEvent.list('start_date', 60),
        ]);

        const joinedIds = new Set(memberships.map(m => m.community_id));
        setUserCommunityIds(joinedIds);
        setCommunities(allCommunities.filter(c => c?.id && c?.name));
        setPosts(recentPosts.filter(p => p.community_id && !joinedIds.has(p.community_id)));
        setEvents(upcomingEvents.filter(e => {
          if (!e.community_id || joinedIds.has(e.community_id)) return false;
          const d = e.start_date || e.event_date;
          return !d || isFuture(parseISO(d));
        }));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const communityMap = useMemo(() => {
    const map = {};
    communities.forEach(c => { map[c.id] = c; });
    return map;
  }, [communities]);

  // Build unified feed
  const feed = useMemo(() => {
    const postItems = posts.map(p => ({ ...p, _type: 'post', _date: p.created_date, _score: (p.likes_count || 0) + (p.comments_count || 0) }));
    const eventItems = events.map(e => ({ ...e, _type: 'event', _date: e.start_date || e.event_date, _score: 0 }));

    let combined = [];
    if (typeFilter === 'all') combined = [...postItems, ...eventItems];
    else if (typeFilter === 'post') combined = postItems;
    else combined = eventItems;

    // Category filter
    if (categoryFilter !== 'all') {
      combined = combined.filter(item => {
        const comm = communityMap[item.community_id];
        return comm?.type === categoryFilter;
      });
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      combined = combined.filter(item => {
        const comm = communityMap[item.community_id];
        return (
          item.title?.toLowerCase().includes(q) ||
          item.body?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          comm?.name?.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    if (sortBy === 'recent') {
      combined.sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0));
    } else if (sortBy === 'popular') {
      combined.sort((a, b) => b._score - a._score);
    } else if (sortBy === 'upcoming') {
      // Events first, then by date
      combined.sort((a, b) => {
        if (a._type === 'event' && b._type !== 'event') return -1;
        if (b._type === 'event' && a._type !== 'event') return 1;
        return new Date(a._date || 0) - new Date(b._date || 0);
      });
    }

    return combined;
  }, [posts, events, typeFilter, categoryFilter, search, sortBy, communityMap]);

  const joinCommunity = async (community) => {
    if (!currentUser) { toast.error('Sign in to join communities'); return; }
    if (userCommunityIds.has(community.id)) return;
    setJoiningId(community.id);
    try {
      await base44.entities.UserCommunity.create({ user_id: currentUser.id, community_id: community.id, role: 'Member' });
      await base44.entities.Community.update(community.id, { follower_count: (community.follower_count || 0) + 1 });
      setUserCommunityIds(prev => new Set([...prev, community.id]));
      toast.success(`Joined ${community.name}! 🎉`);
    } catch { toast.error('Something went wrong'); }
    setJoiningId(null);
  };

  const openCommunity = (id) => navigate(`/communities/${id}`);

  const activeFilterCount = [typeFilter !== 'all', categoryFilter !== 'all', sortBy !== 'recent'].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Discover Communities</h1>
            <p className="text-[13px] text-slate-500">Posts & events from communities you haven't joined</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search posts, events, communities…"
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 outline-none shadow-sm focus:ring-2 focus:ring-blue-300"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border font-semibold text-[13px] transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && <span className="bg-white text-blue-600 rounded-full w-4 h-4 text-[10px] font-black flex items-center justify-center">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 space-y-3">
            {/* Type */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Content Type</p>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all ${
                      typeFilter === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Sort By</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all ${
                      sortBy === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Community Type</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCategoryFilter(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all ${
                      categoryFilter === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setTypeFilter('all'); setSortBy('recent'); setCategoryFilter('all'); }}
                className="text-[12px] text-red-500 font-semibold hover:text-red-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Stats strip */}
        {!loading && (
          <div className="flex items-center gap-4 mb-4 text-[12px] text-slate-500">
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {posts.length} posts</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {events.length} upcoming events</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {communities.filter(c => !userCommunityIds.has(c.id)).length} communities</span>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <p className="text-[13px] text-slate-500">Loading community content…</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-[16px] font-bold text-slate-900">Nothing found</p>
            <p className="text-[13px] text-slate-500 mt-1">Try different filters or search terms.</p>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setTypeFilter('all'); setSortBy('recent'); setCategoryFilter('all'); setSearch(''); }}
                className="mt-4 bg-blue-600 text-white rounded-full px-5 py-2 text-[13px] font-bold"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map(item => {
              const community = communityMap[item.community_id];
              const isJoined = userCommunityIds.has(item.community_id);
              const isJoining = joiningId === item.community_id;
              const props = { item, community, onJoin: joinCommunity, isJoined, isJoining, onOpen: openCommunity };
              return item._type === 'event'
                ? <EventCard key={`event-${item.id}`} {...props} />
                : <PostCard key={`post-${item.id}`} {...props} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}