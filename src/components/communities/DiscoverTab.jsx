import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { dataService, incrementCounter } from '@/services';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import CommunityListCard from './CommunityListCard';

export default function DiscoverTab({ communities, isLoading, currentUser, joinedIds, onJoinChange, onViewCommunity }) {
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const queryClient = useQueryClient();

  const handleJoin = async (e, community) => {
    e.stopPropagation();
    const isJoined = joinedIds.has(community.id);
    setJoiningId(community.id);
    try {
      if (isJoined) {
        const records = await dataService.entities.UserCommunity.filter({ user_id: currentUser.id, community_id: community.id });
        if (records[0]) await dataService.entities.UserCommunity.delete(records[0].id);
        await incrementCounter('communities', 'follower_count', community.id, -1);
        toast.success('Left community');
      } else {
        await dataService.entities.UserCommunity.create({ user_id: currentUser.id, community_id: community.id, role: 'Member' });
        await incrementCounter('communities', 'follower_count', community.id, 1);
        toast.success('Joined!');
      }
      onJoinChange();
      queryClient.invalidateQueries({ queryKey: ['communities-list'] });
    } catch {
      toast.error('Something went wrong');
    }
    setJoiningId(null);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return communities;
    const q = search.toLowerCase();
    return communities.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.neighborhood?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  }, [communities, search]);

  return (
    <div className="pt-4 pb-28">
      {/* Search */}
      <div className="relative mb-4 px-4">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search shuls…"
          className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-[#E8ECF4] rounded-[12px] outline-none focus:border-[#2563EB] transition-colors placeholder:text-[#6B7280]"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
        />
      </div>

      {isLoading ? (
        <div className="px-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-[16px] p-3.5 flex items-center gap-3" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-36 rounded" />
                <div className="skeleton h-2.5 w-24 rounded" />
              </div>
              <div className="skeleton h-8 w-14 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-slate-500 text-sm">No shuls found</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {filtered.map(c => (
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
      )}
    </div>
  );
}