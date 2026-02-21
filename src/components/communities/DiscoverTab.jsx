import React, { useState, useMemo } from 'react';
import { Search, Users, MapPin, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const TYPE_COLORS = {
  Shul:     'bg-blue-100 text-blue-700',
  School:   'bg-green-100 text-green-700',
  Yeshiva:  'bg-purple-100 text-purple-700',
  Seminary: 'bg-pink-100 text-pink-700',
  Camp:     'bg-orange-100 text-orange-700',
  Other:    'bg-slate-100 text-slate-600',
};

const FILTERS = ['All', 'Shuls', 'Schools', 'Organizations'];
const FILTER_MAP = { 'All': null, 'Shuls': 'Shul', 'Schools': 'School', 'Organizations': 'Other' };

export default function DiscoverTab({ communities, isLoading, currentUser, joinedIds, onJoinChange, onViewCommunity }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [joiningId, setJoiningId] = useState(null);
  const queryClient = useQueryClient();

  const filtered = useMemo(() => {
    let list = communities;
    const typeFilter = FILTER_MAP[activeFilter];
    if (typeFilter) list = list.filter(c => c.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.neighborhood?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [communities, search, activeFilter]);

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

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, city, type..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0F5ED7] transition-colors"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
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

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">No communities found</p>
        </div>
      ) : (
        <div className="space-y-3 mt-1">
          {filtered.map(community => {
            const joined = joinedIds.has(community.id);
            const loading = joiningId === community.id;
            return (
              <div
                key={community.id}
                onClick={() => onViewCommunity(community.id)}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
              >
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-[#EEF4FF] flex items-center justify-center overflow-hidden border border-slate-100">
                  {community.logo_url
                    ? <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[#0F5ED7] font-bold text-lg">{community.name?.charAt(0)}</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-slate-900 text-sm truncate">{community.name}</span>
                    {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                    {community.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge className={`${TYPE_COLORS[community.type] || TYPE_COLORS.Other} border-0 text-[10px] font-semibold px-1.5 py-0`}>
                      {community.type}
                    </Badge>
                    {community.neighborhood && (
                      <span className="flex items-center gap-0.5 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />{community.neighborhood}
                      </span>
                    )}
                  </div>
                  {community.description_short && (
                    <p className="text-xs text-slate-500 line-clamp-1">{community.description_short}</p>
                  )}
                </div>

                {/* Join button */}
                <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant={joined ? 'outline' : 'default'}
                    disabled={loading}
                    onClick={e => handleJoin(e, community)}
                    className={`text-xs h-8 px-3 ${joined ? 'border-slate-200 text-slate-600' : 'bg-[#0F5ED7] hover:bg-[#0D4EB8]'}`}
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : joined ? 'Joined' : 'Join'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}