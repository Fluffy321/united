import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Clock, Filter, ChevronLeft, Users, Calendar, FileText, User, Loader2, Store, ShoppingBag, HeartHandshake, MapPin } from 'lucide-react';
import { dataService, storageService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { appParams } from '@/lib/app-params';
import { COMMUNITIES_ENABLED } from '@/config/features';
import { formatDistanceToNow } from 'date-fns';

const POST_TYPES = [
  { value: '', label: 'All types' },
  { value: 'feed', label: 'Posts' },
  ...(COMMUNITIES_ENABLED ? [{ value: 'community_post', label: 'Community posts' }] : []),
  { value: 'event', label: 'Events' },
  { value: 'help', label: 'Help requests' },
  { value: 'marketplace_listing', label: 'Marketplace' },
  { value: 'map_post', label: 'Map posts' },
  { value: 'job', label: 'Jobs' },
  { value: 'housing', label: 'Housing' },
];

const EMPTY_RESULTS = { posts: [], communities: [], events: [], people: [], mitzvahRequests: [], businesses: [], marketplace: [] };

function ResultSection({ title, icon: Icon, count, children }) {
  if (!count) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wide">{title}</span>
        <span className="text-[11px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 font-semibold">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PostResult({ post, onClick }) {
  return (
    <button onClick={() => onClick(post)} className="w-full text-left bg-white rounded-xl border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50/30 transition-all active:scale-[0.99]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {post.title && <p className="font-bold text-slate-900 text-[13px] truncate">{post.title}</p>}
          <p className="text-[13px] text-slate-600 line-clamp-2 mt-0.5">{post.body}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
            <span>{post.author_name}</span>
            {post.community_name && <><span>·</span><span className="text-blue-600">{post.community_name}</span></>}
            <span>·</span>
            <span>{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
          </div>
        </div>
        {post.image_url && <img src={post.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
      </div>
      <div className="flex gap-3 mt-1.5 text-[11px] text-slate-400">
        <span>❤️ {post.likes_count || 0}</span>
        <span>💬 {post.comments_count || 0}</span>
      </div>
    </button>
  );
}

function CommunityResult({ community, onNavigate }) {
  return (
    <button onClick={() => onNavigate(`/communities/${community.id}`)} className="w-full text-left bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3 hover:border-blue-200 hover:bg-blue-50/30 transition-all active:scale-[0.99]">
      {community.logo_url
        ? <img src={community.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        : <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">🏘️</div>
      }
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-[13px]">{community.name}</p>
        <p className="text-[12px] text-slate-500">{community.type} · {community.follower_count || 0} members</p>
      </div>
    </button>
  );
}

function EventResult({ event }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3">
      <p className="font-bold text-slate-900 text-[13px]">{event.title}</p>
      {event.start_date && <p className="text-[12px] text-blue-600 font-semibold mt-0.5">{new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>}
      {event.location && <p className="text-[12px] text-slate-500 mt-0.5">📍 {event.location}</p>}
    </div>
  );
}

function PersonResult({ person }) {
  return (
    <Link to={`/PublicProfile?userId=${person.id}`} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:border-blue-200 transition-colors">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0 overflow-hidden">
        {person.avatar_url ? <img src={person.avatar_url} alt="" className="w-full h-full object-cover" /> : person.full_name?.[0]}
      </div>
      <div>
        <p className="font-bold text-slate-900 text-[13px]">{person.full_name}</p>
        {person.bio && <p className="text-[12px] text-slate-500 line-clamp-1">{person.bio}</p>}
      </div>
    </Link>
  );
}

function SimpleResult({ item, icon: Icon, title, subtitle, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-blue-200 hover:bg-blue-50/30 active:scale-[0.99]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-slate-900">{title}</p>
        <p className="truncate text-[12px] text-slate-500">{subtitle}</p>
      </div>
    </button>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ post_type: '', community_id: '', date_from: '', date_to: '' });
  const [recentSearches, setRecentSearches] = useState(() => storageService.getJson('junited_recent_searches', []));
  const { user } = useAuth();
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Run search
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) { setResults(null); return; }
    setSearching(true);
    if (!appParams.hasBackendConfig) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      const updated = [debouncedQuery, ...recentSearches.filter(s => s !== debouncedQuery)].slice(0, 8);
      setRecentSearches(updated);
      storageService.setJson('junited_recent_searches', updated);
      return;
    }
    dataService.functions.invoke('universalSearch', { query: debouncedQuery, filters, user_id: user?.id })
      .then(res => {
        setResults(res.data?.results || EMPTY_RESULTS);
        setSearching(false);
        // Save to recent
        const updated = [debouncedQuery, ...recentSearches.filter(s => s !== debouncedQuery)].slice(0, 8);
        setRecentSearches(updated);
        storageService.setJson('junited_recent_searches', updated);
      })
      .catch(() => {
        setResults(EMPTY_RESULTS);
        setSearching(false);
      });
  }, [debouncedQuery, filters, user?.id]);

  const handlePostClick = (post) => {
    navigate(`/PostDetail?postId=${post.id}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    storageService.removeItem('junited_recent_searches');
  };

  const visibleCommunities = COMMUNITIES_ENABLED ? (results?.communities || []) : [];
  const totalResults = results
    ? (results.posts?.length || 0)
      + visibleCommunities.length
      + (results.events?.length || 0)
      + (results.people?.length || 0)
      + (results.mitzvahRequests?.length || 0)
      + (results.businesses?.length || 0)
      + (results.marketplace?.length || 0)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Search header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 px-4 pt-4 pb-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search people, shuls, businesses, posts, marketplace…"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-100 text-[14px] text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(f => !f)} className={`p-2 rounded-full transition-colors flex-shrink-0 ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}>
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex gap-2 flex-wrap pb-1">
              <select value={filters.post_type} onChange={e => setFilters(f => ({ ...f, post_type: e.target.value }))}
                className="text-[12px] px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 outline-none">
                {POST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                className="text-[12px] px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 outline-none" placeholder="From" />
              <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                className="text-[12px] px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 outline-none" placeholder="To" />
              {(filters.post_type || filters.date_from || filters.date_to) && (
                <button onClick={() => setFilters({ post_type: '', community_id: '', date_from: '', date_to: '' })}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-600 font-semibold">Clear filters</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Empty state: recent searches only. Suggestions should come from real data before rendering here. */}
        {!query && (
          <>
            {/* Recent */}
            {recentSearches.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Recent</p>
                  <button onClick={clearRecent} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">Clear</button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map(s => (
                    <button key={s} onClick={() => setQuery(s)} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-[13px] text-slate-600 text-left">
                      <Clock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentSearches.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
                <Search className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-3 text-[14px] font-bold text-slate-700">Search JUnited</p>
                <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-400">
                  Type a real name, post, business, shul, or mitzvah request to search.
                </p>
              </div>
            )}
          </>
        )}

        {/* Searching indicator */}
        {searching && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {/* Results */}
        {results && !searching && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-slate-500">
                {totalResults === 0 ? 'No results found' : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${debouncedQuery}"`}
              </p>
              {query.trim().length >= 2 && user && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-500">
                  Saved searches paused for beta
                </span>
              )}
            </div>

            {totalResults === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold text-slate-600">No results for "{debouncedQuery}"</p>
                <p className="text-[13px] mt-1">Try different keywords or remove filters</p>
              </div>
            )}

            <ResultSection title="Posts" icon={FileText} count={results.posts?.length}>
              {results.posts?.map(p => <PostResult key={p.id} post={p} onClick={handlePostClick} />)}
            </ResultSection>

            {COMMUNITIES_ENABLED && (
              <ResultSection title="Communities" icon={Users} count={visibleCommunities.length}>
                {visibleCommunities.map(c => <CommunityResult key={c.id} community={c} onNavigate={navigate} />)}
              </ResultSection>
            )}

            <ResultSection title="Events" icon={Calendar} count={results.events?.length}>
              {results.events?.map(e => <EventResult key={e.id} event={e} />)}
            </ResultSection>

            <ResultSection title="People" icon={User} count={results.people?.length}>
              {results.people?.map(p => <PersonResult key={p.id} person={p} />)}
            </ResultSection>

            <ResultSection title="Mitzvah requests" icon={HeartHandshake} count={results.mitzvahRequests?.length}>
              {results.mitzvahRequests?.map(r => (
                <SimpleResult
                  key={r.id}
                  item={r}
                  icon={HeartHandshake}
                  title={r.title}
                  subtitle={`${r.urgency || 'help'} · ${r.location_label || r.neighborhood || 'Five Towns'}`}
                  onClick={() => navigate(`/MitzvahCircle?requestId=${r.id}`)}
                />
              ))}
            </ResultSection>

            <ResultSection title="Businesses, shuls, schools, map pins" icon={MapPin} count={results.businesses?.length}>
              {results.businesses?.map(b => (
                <SimpleResult
                  key={b.id}
                  item={b}
                  icon={Store}
                  title={b.name}
                  subtitle={`${b.category || 'Directory'} · ${b.address || b.location_text || 'Five Towns'}`}
                  onClick={() => navigate(`/Map?place=${encodeURIComponent(b.name)}`)}
                />
              ))}
            </ResultSection>

            <ResultSection title="Marketplace" icon={ShoppingBag} count={results.marketplace?.length}>
              {results.marketplace?.map(m => (
                <SimpleResult
                  key={m.id}
                  item={m}
                  icon={ShoppingBag}
                  title={m.title}
                  subtitle={`${m.price || 'Listing'} · ${m.category || 'Marketplace'} · ${m.neighborhood || 'nearby'}`}
                  onClick={() => navigate(`/Marketplace?listing=${m.id}`)}
                />
              ))}
            </ResultSection>
          </>
        )}
      </div>
    </div>
  );
}
