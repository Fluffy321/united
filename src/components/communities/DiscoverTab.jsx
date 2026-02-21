import React, { useState, useMemo } from 'react';
import { Search, Loader2, Sparkles, Clock, Flame, ChevronDown, Play, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import CommunityListCard from './CommunityListCard';
import CommunityLogo from './CommunityLogo';

const FILTERS = ['All', 'Shuls', 'Schools', 'Yeshivas', 'Organizations'];
const FILTER_MAP = { 'All': null, 'Shuls': 'Shul', 'Schools': 'School', 'Yeshivas': 'Yeshiva', 'Organizations': 'Other' };
const PAGE_SIZE = 100;
const FIVE_TOWNS = new Set(['Lawrence', 'Cedarhurst', 'Woodmere', 'Inwood', 'Hewlett']);

export default function DiscoverTab({ communities, isLoading, currentUser, joinedIds, onJoinChange, onViewCommunity, onSeedDone }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [joiningId, setJoiningId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [allPage, setAllPage] = useState(1);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [pruning, setPruning] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const [showSeededOnly, setShowSeededOnly] = useState(false);
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === 'admin';

  const handleJoin = async (e, community) => {
    e.stopPropagation();
    const isJoined = joinedIds.has(community.id);
    setJoiningId(community.id);
    try {
      if (isJoined) {
        const records = await base44.entities.UserCommunity.filter({ user_id: currentUser.id, community_id: community.id });
        if (records[0]) await base44.entities.UserCommunity.delete(records[0].id);
        await base44.entities.Community.update(community.id, { follower_count: Math.max(0, (community.follower_count || 0) - 1) });
        toast.success('Left community');
      } else {
        await base44.entities.UserCommunity.create({ user_id: currentUser.id, community_id: community.id, role: 'Member' });
        await base44.entities.Community.update(community.id, { follower_count: (community.follower_count || 0) + 1 });
        toast.success('Joined!');
      }
      onJoinChange();
      queryClient.invalidateQueries({ queryKey: ['communities-list'] });
    } catch {
      toast.error('Something went wrong');
    }
    setJoiningId(null);
  };

  const handlePrune = async () => {
    setPruning(true);
    try {
      const res = await base44.functions.invoke('pruneNonFiveTownsCommunities', {});
      toast.success(`Deleted ${res.data?.deletedCount ?? 0} non–Five Towns seeded communities`);
      queryClient.removeQueries({ queryKey: ['communities-list'] });
      if (onSeedDone) onSeedDone();
    } catch (e) {
      toast.error(e.message || 'Prune failed');
    }
    setPruning(false);
  };

  const handleRunSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    setSearch('');
    setActiveFilter('All');
    setShowAll(false);
    setAllPage(1);
    try {
      const res = await base44.functions.invoke('seedFiveTownsCommunities', {});
      const d = res.data;
      setSeedResult(d);
      toast.success(`Inserted ${d?.insertedCount ?? 0} · Total now ${d?.totalCommunitiesAfter ?? '?'}`);
      queryClient.removeQueries({ queryKey: ['communities-list'] });
      if (onSeedDone) onSeedDone();
    } catch (e) {
      toast.error(e.message || 'Seed failed');
    }
    setSeeding(false);
  };

  const isFiltering = search.trim() || activeFilter !== 'All';

  // Base list: only Five Towns unless admin toggles global view
  const baseCommunities = useMemo(() => {
    let list = (isAdmin && showGlobal)
      ? communities
      : communities.filter(c => FIVE_TOWNS.has(c.neighborhood));
    if (isAdmin && showSeededOnly) list = list.filter(c => c.is_seeded);
    return list;
  }, [communities, isAdmin, showGlobal, showSeededOnly]);

  const filtered = useMemo(() => {
    let list = baseCommunities;
    const typeFilter = FILTER_MAP[activeFilter];
    if (typeFilter) list = list.filter(c => c.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.neighborhood?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [baseCommunities, search, activeFilter]);

  const trending = useMemo(() =>
    [...baseCommunities].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0)).slice(0, 8),
    [baseCommunities]
  );

  const newThisWeek = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return baseCommunities
      .filter(c => c.created_date >= cutoff)
      .sort((a, b) => b.created_date?.localeCompare(a.created_date))
      .slice(0, 6);
  }, [baseCommunities]);

  const allSorted = useMemo(() =>
    [...baseCommunities].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0)),
    [baseCommunities]
  );

  const allVisible = allSorted.slice(0, allPage * PAGE_SIZE);
  const hasMore = allVisible.length < allSorted.length;

  const listToShow = isFiltering ? filtered : (showAll ? allSorted.slice(0, allPage * PAGE_SIZE) : allSorted.slice(0, PAGE_SIZE));

  const CardList = ({ items }) => (
    <div className="px-4 space-y-3">
      {items.map(c => (
        <CommunityListCard
          key={c.id}
          community={c}
          joined={joinedIds.has(c.id)}
          loading={joiningId === c.id}
          onJoin={handleJoin}
          onView={onViewCommunity}
        />
      ))}
    </div>
  );

  return (
    <div className="pt-4 pb-28">
      {/* Admin seed button */}
      {isAdmin && (
        <div className="px-4 mb-4 space-y-2">
          {/* Seed row */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-700">Run Five Towns Seed</p>
              <p className="text-[11px] text-slate-400">Insert curated Five Towns directory</p>
            </div>
            <button
              onClick={handleRunSeed}
              disabled={seeding || pruning}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#0F5ED7] text-white px-3 py-1.5 rounded-lg disabled:opacity-60"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {seeding ? 'Seeding…' : 'Run Seed'}
            </button>
          </div>
          {/* Prune row */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-red-700">Prune Non–Five Towns</p>
              <p className="text-[11px] text-red-400">Delete seeded communities outside Five Towns</p>
            </div>
            <button
              onClick={handlePrune}
              disabled={pruning || seeding}
              className="flex items-center gap-1.5 text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-60"
            >
              {pruning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {pruning ? 'Pruning…' : 'Prune'}
            </button>
          </div>
          {/* Admin toggles */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-400">Show Global (non–Five Towns)</span>
              <button
                onClick={() => setShowGlobal(g => !g)}
                className={`relative w-9 h-5 rounded-full transition-colors ${showGlobal ? 'bg-[#0F5ED7]' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showGlobal ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-400">Show Seeded Only</span>
              <button
                onClick={() => setShowSeededOnly(s => !s)}
                className={`relative w-9 h-5 rounded-full transition-colors ${showSeededOnly ? 'bg-amber-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showSeededOnly ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
          {seedResult && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Inserted {seedResult.insertedCount} · Total now {seedResult.totalCommunitiesAfter}</span>
              </div>
              <div className="text-[10px] text-green-600 pl-5">Before: {seedResult.totalCommunitiesBefore} → After: {seedResult.totalCommunitiesAfter}</div>
            </div>
          )}
        </div>
      )}

      {/* Debug counter */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Showing {isFiltering ? filtered.length : baseCommunities.length} of {communities.length} communities
        </span>
        {isAdmin && showSeededOnly && (
          <span className="text-[10px] bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 font-semibold">Seeded only</span>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3 px-4">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowAll(false); setAllPage(1); }}
          placeholder="Search by name, city, type…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0F5ED7] transition-colors"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide px-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => { setActiveFilter(f); setShowAll(false); setAllPage(1); }}
            className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              activeFilter === f
                ? 'bg-[#0F5ED7] text-white border-[#0F5ED7]'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-12 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
          <p className="text-xs text-slate-400">Loading {communities.length > 0 ? communities.length : ''} communities…</p>
        </div>
      ) : isFiltering ? (
        /* ── Filtered / search results (all) ── */
        <div className="mt-1">
          <p className="px-4 mb-3 text-xs text-slate-400">{filtered.length} results</p>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No communities found</p>
            </div>
          ) : <CardList items={filtered} />}
        </div>
      ) : showAll ? (
        /* ── Full "View All" list with pagination ── */
        <div className="mt-1">
          <div className="flex items-center justify-between px-4 mb-3">
            <p className="text-sm font-bold text-slate-800">All Communities ({allSorted.length})</p>
            <button onClick={() => setShowAll(false)} className="text-xs text-[#0F5ED7] font-medium">← Back</button>
          </div>
          <CardList items={allVisible} />
          {hasMore && (
            <div className="px-4 mt-4">
              <button
                onClick={() => setAllPage(p => p + 1)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#0F5ED7] bg-[#EEF4FF] rounded-xl py-2.5"
              >
                <ChevronDown className="w-4 h-4" /> Load more ({allSorted.length - allVisible.length} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Curated home view ── */
        <>
          {/* Trending carousel */}
          {trending.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-3 px-4">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-slate-800">Trending Near You</span>
              </div>
              <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {trending.map(c => {
                  const joined = joinedIds.has(c.id);
                  const loading = joiningId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onViewCommunity(c.id)}
                      className="flex-shrink-0 w-44 bg-white rounded-2xl border border-slate-100 p-3 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <CommunityLogo community={c} size="md" className="mb-2" />
                      <p className="font-bold text-xs text-slate-900 line-clamp-2 mb-0.5">{c.name}</p>
                      <p className="text-[10px] text-slate-400 mb-2">{(c.follower_count || 0).toLocaleString()} members</p>
                      <button
                        onClick={e => { e.stopPropagation(); handleJoin(e, c); }}
                        disabled={loading}
                        className={`w-full text-xs h-7 rounded-lg font-semibold transition-colors ${joined ? 'bg-slate-100 text-slate-600' : 'bg-[#0F5ED7] text-white'}`}
                      >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : joined ? 'Joined' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New this week */}
          {newThisWeek.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-3 px-4">
                <Clock className="w-4 h-4 text-[#0F5ED7]" />
                <span className="text-sm font-bold text-slate-800">New This Week</span>
              </div>
              <CardList items={newThisWeek} />
            </div>
          )}

          {/* All communities preview + "View all" */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3 px-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-slate-800">All Communities</span>
                <span className="text-xs text-slate-400">({allSorted.length})</span>
              </div>
              <button
                onClick={() => { setShowAll(true); setAllPage(1); }}
                className="text-xs font-semibold text-[#0F5ED7]"
              >
                View all →
              </button>
            </div>
            <CardList items={allSorted.slice(0, PAGE_SIZE)} />
            {allSorted.length > PAGE_SIZE && (
              <div className="px-4 mt-3">
                <button
                  onClick={() => { setShowAll(true); setAllPage(1); }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#0F5ED7] bg-[#EEF4FF] rounded-xl py-2.5"
                >
                  <ChevronDown className="w-4 h-4" /> View all {allSorted.length} communities
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}