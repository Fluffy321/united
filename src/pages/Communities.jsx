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
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center">
          <span className="font-bold text-slate-900 text-base">Communities</span>
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
              {idx === 1 && joinedIds.size > 0 && (
                <span className="ml-1.5 text-[10px] bg-[#0F5ED7] text-white rounded-full px-1.5 py-0.5">
                  {joinedIds.size}
                </span>
              )}
            </button>
          ))}
          {/* Underline */}
          <div
            className="absolute bottom-0 h-0.5 bg-[#0F5ED7] rounded-full transition-all duration-200"
            style={{ width: '50%', left: `${activeTab * 50}%` }}
          />
        </div>
      </div>

      {/* Swipeable content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} mode="wait">
          {activeTab === 0 ? (
            <motion.div
              key="discover"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 overflow-y-auto"
            >
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
          ) : (
            <motion.div
              key="mine"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 30, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 overflow-y-auto"
            >
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
    </div>
  );
}