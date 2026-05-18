import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService, incrementCounter } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Users } from 'lucide-react';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'Torah Learning', 'Shabbat', 'Chesed', 'Events', 'Youth', 'Families', 'Seniors', 'General'];

function GroupsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="j-card overflow-hidden">
          <div className="skeleton h-[72px] rounded-none" />
          <div className="p-3 space-y-2">
            <div className="skeleton h-3.5 w-3/4 rounded" />
            <div className="skeleton h-2.5 w-full rounded" />
            <div className="skeleton h-2.5 w-1/2 rounded" />
            <div className="skeleton h-7 w-full rounded-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyGroupsState({ search, onCreateClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-blue-600 text-white shadow-md">
        <Users className="h-7 w-7" />
      </div>
      <p className="text-[15px] font-bold text-slate-900">
        {search ? 'No matching groups' : 'No groups yet'}
      </p>
      <p className="mt-1.5 text-[13px] text-slate-500 leading-5 max-w-[220px]">
        {search
          ? 'Try a different search or browse all categories.'
          : 'Be the first to create a group for your community.'}
      </p>
      {!search && (
        <button
          onClick={onCreateClick}
          className="mt-4 flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-full text-[13px] font-bold active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Create a Group
        </button>
      )}
    </div>
  );
}

export default function Groups() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [membershipSet, setMembershipSet] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser) return;
    dataService.entities.GroupMember.filter({ user_id: currentUser.id }).then(memberships => {
      setMembershipSet(new Set(memberships.map(m => m.group_id)));
    });
  }, [currentUser?.id]);

  const { data: groups = [], isLoading, refetch } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => dataService.entities.CommunityGroup.list('-created_date', 100),
    staleTime: 60000,
    enabled: !!currentUser,
  });

  const handleJoin = async (group) => {
    try {
      await dataService.entities.GroupMember.create({
        group_id: group.id,
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.display_name,
        role: 'member',
      });
      await incrementCounter('community_groups', 'member_count', group.id, 1);
      setMembershipSet(prev => new Set([...prev, group.id]));
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      toast.success(`Joined ${group.name}!`);
    } catch {
      toast.error('Could not join group');
    }
  };

  const handleLeave = async (group) => {
    try {
      const memberships = await dataService.entities.GroupMember.filter({ group_id: group.id, user_id: currentUser.id });
      if (memberships[0]) await dataService.entities.GroupMember.delete(memberships[0].id);
      await incrementCounter('community_groups', 'member_count', group.id, -1);
      setMembershipSet(prev => { const s = new Set(prev); s.delete(group.id); return s; });
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      toast.success(`Left ${group.name}`);
    } catch {
      toast.error('Could not leave group');
    }
  };

  const filtered = groups.filter(g => {
    const matchCat = activeCategory === 'All' || g.category === activeCategory;
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const myGroups = filtered.filter(g => membershipSet.has(g.id));
  const discoverGroups = filtered.filter(g => !membershipSet.has(g.id));

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="mobile-page px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-[17px] text-slate-900">Groups</span>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-[13px] font-bold active:scale-95 transition-all hover:bg-blue-500"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Group
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 mobile-page">
          <label className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400 text-slate-900"
              placeholder="Search groups…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search groups"
            />
          </label>
        </div>

        {/* Category filter */}
        <div className="mobile-scroll-x flex gap-1.5 px-4 pb-3 mobile-page">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mobile-page px-4 pt-4 mobile-safe-bottom space-y-6">
        {isLoading ? (
          <>
            <div>
              <p className="j-text-meta mb-3">My Groups</p>
              <GroupsLoadingSkeleton />
            </div>
          </>
        ) : (
          <>
            {/* My Groups */}
            {myGroups.length > 0 && (
              <section>
                <p className="j-text-meta mb-3">My Groups</p>
                <div className="grid grid-cols-2 gap-3">
                  {myGroups.map(g => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      isMember={true}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      onClick={() => navigate(`/groups/${g.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Discover */}
            <section>
              <p className="j-text-meta mb-3">
                {myGroups.length > 0 ? 'Discover More' : 'All Groups'}
              </p>
              {discoverGroups.length === 0 ? (
                <EmptyGroupsState search={search} onCreateClick={() => setShowCreate(true)} />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {discoverGroups.map(g => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      isMember={false}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      onClick={() => navigate(`/groups/${g.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <CreateGroupModal
        open={showCreate}
        onOpenChange={setShowCreate}
        currentUser={currentUser}
        onCreated={refetch}
      />
    </div>
  );
}
