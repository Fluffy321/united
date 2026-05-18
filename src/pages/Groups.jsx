import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService, incrementCounter } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'Torah Learning', 'Shabbat', 'Chesed', 'Events', 'Youth', 'Families', 'Seniors', 'General'];

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

  const { data: groups = [], refetch } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => dataService.entities.CommunityGroup.list('-created_date', 100),
    staleTime: 60000,
    enabled: !!currentUser
  });

  const handleJoin = async (group) => {
    try {
      await dataService.entities.GroupMember.create({
        group_id: group.id,
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.display_name,
        role: 'member'
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-[17px] text-[#0F1C2E]">Groups</span>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[13px] font-bold active:scale-95 transition-all"
            style={{ background: 'var(--primary)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Group
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 bg-[#f1f5f9] rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-[#94a3b8]" />
            <input
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#94a3b8]"
              placeholder="Search groups…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide max-w-2xl mx-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-all"
              style={activeCategory === cat
                ? { background: 'var(--accent)', color: 'white' }
                : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-6">
        {/* My Groups */}
        {myGroups.length > 0 && (
          <section>
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">My Groups</p>
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
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">
            {myGroups.length > 0 ? 'Discover More' : 'All Groups'}
          </p>
          {discoverGroups.length === 0 ? (
            <div className="text-center py-12 text-[#94a3b8] text-[13px]">
              {search ? 'No groups match your search.' : 'No groups yet. Create the first one!'}
            </div>
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
