import React, { useState, useMemo } from 'react';
import { Search, Loader2, Sparkles, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import CommunityListCard from './CommunityListCard';
import TrendingCarousel from './TrendingCarousel';

const FILTERS = ['All', 'Shuls', 'Schools', 'Yeshivas', 'Organizations'];
const FILTER_MAP = { 'All': null, 'Shuls': 'Shul', 'Schools': 'School', 'Yeshivas': 'Yeshiva', 'Organizations': 'Other' };

export default function DiscoverTab({ communities, isLoading, currentUser, joinedIds, onJoinChange, onViewCommunity }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [joiningId, setJoiningId] = useState(null);
  const queryClient = useQueryClient();

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

  const isSearching = search.trim() || activeFilter !== 'All';

  const filtered = useMemo(() => {
    let list = communities;
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
  }, [communities, search, activeFilter]);

  // Sections for non-search state
  const newThisWeek = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return communities
      .filter(c => c.created_date >= cutoff)
      .sort((a, b) => b.created_date?.localeCompare(a.created_date))
      .slice(0, 6);
  }, [communities]);

  const recommended = useMemo(() => {
    return communities
      .filter(c => !joinedIds.has(c.id))
      .sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0))
      .slice(0, 20);
  }, [communities, joinedIds]);

  return (
    <div className="pt-4 pb-28">
      {/* Search */}
      <div className="relative mb-3 px-4">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, city, type..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0F5ED7] transition-colors"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide px-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
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
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>
      ) : isSearching ? (
        /* ── Search results ── */
        <div className="px-4 space-y-3 mt-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No communities found</p>
            </div>
          ) : filtered.map(c => (
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
      ) : (
        /* ── Curated sections ── */
        <>
          {/* Trending carousel */}
          <TrendingCarousel
            communities={communities}
            joinedIds={joinedIds}
            joiningId={joiningId}
            onJoin={handleJoin}
            onView={onViewCommunity}
          />

          {/* New this week */}
          {newThisWeek.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-3 px-4">
                <Clock className="w-4 h-4 text-[#0F5ED7]" />
                <span className="text-sm font-bold text-slate-800">New This Week</span>
              </div>
              <div className="px-4 space-y-3">
                {newThisWeek.map(c => (
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
            </div>
          )}

          {/* Recommended / All */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-3 px-4">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-bold text-slate-800">Recommended for You</span>
            </div>
            <div className="px-4 space-y-3">
              {recommended.map(c => (
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
          </div>
        </>
      )}
    </div>
  );
}