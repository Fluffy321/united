import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProfileSetup from '@/components/profile/ProfileSetup';
import DiscoverTab from '@/components/communities/DiscoverTab';
import MyCommunitiesTab from '@/components/communities/MyCommunitiesTab';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import GroupCard from '@/components/groups/GroupCard';
import GroupDetailSheet from '@/components/groups/GroupDetailSheet';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const TABS = ['Shuls', 'Groups', 'My Communities'];
const GROUP_CATEGORIES = ['All', 'Torah Learning', 'Shabbat', 'Chesed', 'Events', 'Youth', 'Families', 'Seniors', 'General'];

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [membershipSet, setMembershipSet] = useState(new Set());
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupCategory, setGroupCategory] = useState('All');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      base44.entities.GroupMember.filter({ user_id: user.id }).then(memberships => {
        setMembershipSet(new Set(memberships.map(m => m.group_id)));
      });
    });
  }, []);

const CORE_TEN_NAMES = [
  'Young Israel of Lawrence-Cedarhurst',
  'Congregation Beth Sholom',
  'Congregation Sons of Israel',
  'Aish Kodesh',
  'Khal Bnei Torah',
  'Beis Tefilah of Woodmere',
  'Chabad of Woodmere',
  'Ohr Torah of Woodmere',
  'Shaaray Tefila of Lawrence',
  'Congregation Bais Tefilah',
];

  const { data: allCommunities = [], isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities-list'],
    queryFn: () => base44.entities.Community.list('-follower_count', 3000),
    enabled: !!currentUser,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const communities = allCommunities.filter(c => c.type === 'Shul');

  const { data: groups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => base44.entities.CommunityGroup.list('-created_date', 100),
    staleTime: 60000,
    enabled: !!currentUser
  });

  const { data: userMemberships = [], isLoading: membershipsLoading, refetch: refetchMemberships } = useQuery({
    queryKey: ['user-communities', currentUser?.id],
    queryFn: () => base44.entities.UserCommunity.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={() => base44.auth.me().then(setCurrentUser)} />;
  }

  if (selectedCommunityId) {
    return (
      <CommunityDetailView
        communityId={selectedCommunityId}
        currentUser={currentUser}
        onBack={() => setSelectedCommunityId(null)}
      />
    );
  }

  const joinedIds = new Set(userMemberships.map(m => m.community_id));
  const joinedCommunities = communities.filter(c => joinedIds.has(c.id));

  const handleJoinChange = () => {
    refetchMemberships();
    queryClient.invalidateQueries({ queryKey: ['communities-list'] });
  };

  const handleGroupJoin = async (group) => {
    await base44.entities.GroupMember.create({ group_id: group.id, user_id: currentUser.id, user_name: currentUser.full_name, role: 'member' });
    await base44.entities.CommunityGroup.update(group.id, { member_count: (group.member_count || 0) + 1 });
    setMembershipSet(prev => new Set([...prev, group.id]));
    queryClient.invalidateQueries({ queryKey: ['community-groups'] });
    toast.success(`Joined ${group.name}!`);
  };

  const handleGroupLeave = async (group) => {
    const memberships = await base44.entities.GroupMember.filter({ group_id: group.id, user_id: currentUser.id });
    if (memberships[0]) await base44.entities.GroupMember.delete(memberships[0].id);
    await base44.entities.CommunityGroup.update(group.id, { member_count: Math.max(0, (group.member_count || 1) - 1) });
    setMembershipSet(prev => { const s = new Set(prev); s.delete(group.id); return s; });
    queryClient.invalidateQueries({ queryKey: ['community-groups'] });
    toast.success(`Left ${group.name}`);
  };

  const filteredGroups = groups.filter(g => {
    const matchCat = groupCategory === 'All' || g.category === groupCategory;
    const matchSearch = !groupSearch || g.name.toLowerCase().includes(groupSearch.toLowerCase()) || g.description?.toLowerCase().includes(groupSearch.toLowerCase());
    return matchCat && matchSearch;
  });
  const myGroups = filteredGroups.filter(g => membershipSet.has(g.id));
  const discoverGroups = filteredGroups.filter(g => !membershipSet.has(g.id));

  return (
    <div className="flex flex-col h-full bg-[#F8FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-base">Communities</span>
          {activeTab === 1 && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[13px] font-bold active:scale-95 transition-all"
              style={{ background: 'var(--primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Group
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto flex border-b border-slate-100 relative">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === idx ? 'text-[#0F5ED7]' : 'text-slate-500'
              }`}
            >
              {tab}
              {idx === 2 && joinedIds.size > 0 && (
                <span className="ml-1.5 text-[10px] bg-[#0F5ED7] text-white rounded-full px-1.5 py-0.5">
                  {joinedIds.size}
                </span>
              )}
            </button>
          ))}
          {/* Underline */}
          <div
            className="absolute bottom-0 h-0.5 bg-[#0F5ED7] rounded-full transition-all duration-200"
            style={{ width: '33.33%', left: `${activeTab * 33.33}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} mode="wait">
          {activeTab === 0 && (
            <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <DiscoverTab
                  communities={communities}
                  isLoading={communitiesLoading}
                  currentUser={currentUser}
                  joinedIds={joinedIds}
                  onJoinChange={handleJoinChange}
                  onViewCommunity={setSelectedCommunityId}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 pt-4 pb-28">
                {/* Search */}
                <div className="flex items-center gap-2 bg-white border border-[#E8ECF4] rounded-xl px-3 py-2 mb-3" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                  <Search className="w-4 h-4 text-[#94a3b8]" />
                  <input
                    className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#94a3b8]"
                    placeholder="Search groups…"
                    value={groupSearch}
                    onChange={e => setGroupSearch(e.target.value)}
                  />
                </div>
                {/* Category filter */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
                  {GROUP_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setGroupCategory(cat)}
                      className="flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-all"
                      style={groupCategory === cat ? { background: 'var(--accent)', color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {myGroups.length > 0 && (
                  <section className="mb-5">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">My Groups</p>
                    <div className="grid grid-cols-2 gap-3">
                      {myGroups.map(g => (
                        <GroupCard key={g.id} group={g} isMember={true} onJoin={handleGroupJoin} onLeave={handleGroupLeave} onClick={() => { setSelectedGroup(g); setShowGroupDetail(true); }} />
                      ))}
                    </div>
                  </section>
                )}
                <section>
                  <p className="text-[12px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">
                    {myGroups.length > 0 ? 'Discover More' : 'All Groups'}
                  </p>
                  {discoverGroups.length === 0 ? (
                    <div className="text-center py-12 text-[#94a3b8] text-[13px]">
                      {groupSearch ? 'No groups match your search.' : 'No groups yet. Create the first one!'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {discoverGroups.map(g => (
                        <GroupCard key={g.id} group={g} isMember={false} onJoin={handleGroupJoin} onLeave={handleGroupLeave} onClick={() => { setSelectedGroup(g); setShowGroupDetail(true); }} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <MyCommunitiesTab
                  communities={joinedCommunities}
                  isLoading={membershipsLoading}
                  onViewCommunity={setSelectedCommunityId}
                  onBrowse={() => setActiveTab(0)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <GroupDetailSheet
        group={selectedGroup}
        open={showGroupDetail}
        onOpenChange={setShowGroupDetail}
        currentUser={currentUser}
        isMember={selectedGroup ? membershipSet.has(selectedGroup.id) : false}
        onJoin={handleGroupJoin}
        onLeave={handleGroupLeave}
      />

      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        currentUser={currentUser}
        onCreated={refetchGroups}
      />
    </div>
  );
}