import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProfileSetup from '@/components/profile/ProfileSetup';
import DiscoverTab from '@/components/communities/DiscoverTab';
import MyCommunitiesTab from '@/components/communities/MyCommunitiesTab';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = ['Discover', 'My Communities'];

export default function Communities() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: communities = [], isLoading: communitiesLoading, refetch: refetchCommunities } = useQuery({
    queryKey: ['communities-list'],
    queryFn: () => base44.entities.Community.list('-follower_count', 2000),
    enabled: !!currentUser,
    staleTime: 300000,
    refetchOnWindowFocus: false,
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

  const handleSeedDone = () => {
    refetchCommunities();
    refetchMemberships();
  };

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
                  onSeedDone={handleSeedDone}
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