import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CommunityHero from './CommunityHero';
import ClaimModal from './ClaimModal';
import BasicInfoSection from './BasicInfoSection';
import CommunityHomepage from './CommunityHomepage';
import CommunityFeedTab from './CommunityFeedTab';
import CommunityAnnouncementsTab from './CommunityAnnouncementsTab';
import CommunityEventsTab from './CommunityEventsTab';
import CommunityMitzvahTab from './CommunityMitzvahTab';
import MembersListTab from './MembersListTab';
import GroupChatSection from './GroupChatSection';
import CommunityResourceLibrary from './CommunityResourceLibrary';
import CommunityPaymentButton from './CommunityPaymentButton';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About' },
  { key: 'members', label: 'Members' },
  { key: 'feed', label: 'Feed' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'events', label: 'Events' },
  { key: 'mitzvah', label: 'Mitzvah' },
  { key: 'chat', label: 'Chat' },
  { key: 'resources', label: 'Resources' },
];

export default function CommunityDetailView({ communityId, currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showClaim, setShowClaim] = useState(false);
  const queryClient = useQueryClient();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => base44.entities.Community.filter({ id: communityId }).then(r => r[0]),
    enabled: !!communityId
  });

  const { data: followRecord = [] } = useQuery({
    queryKey: ['community-follow', communityId, currentUser?.id],
    queryFn: () => base44.entities.CommunityFollow.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', communityId],
    queryFn: () => base44.entities.CommunityPost.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['community-events', communityId],
    queryFn: () => base44.entities.CommunityEvent.filter({ community_id: communityId }, 'start_date', 50),
    enabled: !!communityId
  });

  const { data: opportunities = [], isLoading: oppsLoading } = useQuery({
    queryKey: ['community-opportunities', communityId],
    queryFn: () => base44.entities.MitzvahOpportunity.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId
  });

  const { data: communityStats } = useQuery({
    queryKey: ['community-stats', communityId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getCommunityImpact', { community_id: communityId });
      return res.data;
    },
    enabled: !!communityId
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => base44.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 100),
    enabled: !!communityId
  });

  const isFollowing = followRecord.length > 0;
  const isAdmin = currentUser?.role === 'admin';
  const actualMemberCount = members.length;

  const handleFollow = async () => {
    if (isFollowing) {
      await base44.entities.CommunityFollow.delete(followRecord[0].id);
      const memberships = await base44.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id });
      for (const m of memberships) await base44.entities.UserCommunity.delete(m.id);
      if (community) {
        await base44.entities.Community.update(communityId, {
          follower_count: Math.max(0, (community.follower_count || 0) - 1)
        });
      }
      toast.success('Unfollowed');
    } else {
      await base44.entities.CommunityFollow.create({ community_id: communityId, user_id: currentUser.id });
      const existing = await base44.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id });
      if (existing.length === 0) {
        await base44.entities.UserCommunity.create({ user_id: currentUser.id, community_id: communityId, role: 'Member' });
      }
      if (community) {
        await base44.entities.Community.update(communityId, {
          follower_count: (community.follower_count || 0) + 1
        });
      }
      toast.success('Joined!');
    }
    queryClient.invalidateQueries({ queryKey: ['community-follow', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community', communityId] });
    queryClient.invalidateQueries({ queryKey: ['user-communities', currentUser?.id] });
  };

  if (isLoading || !community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  const announcementCount = posts.filter(p => p.type === 'announcement').length;
  const eventCount = events.length;
  const mitzvahCount = opportunities.filter(o => o.is_active !== false).length;

  const tabsWithCounts = TABS.map(t => ({
    ...t,
    count: t.key === 'announcements' ? announcementCount
         : t.key === 'events' ? eventCount
         : t.key === 'mitzvah' ? mitzvahCount
         : 0
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col">
      <CommunityHero
        community={community}
        isFollowing={isFollowing}
        isAdmin={isAdmin}
        onFollow={handleFollow}
        onClaim={() => setShowClaim(true)}
        onBack={onBack}
        eventCount={events.length}
        mitzvahCount={opportunities.filter(o => o.is_active !== false).length}
        actualMemberCount={actualMemberCount}
      />

      {/* Payment strip */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <p className="text-[13px] text-slate-600">
            {community.is_verified ? '✅ Verified community' : '🏘️ Community page'} · Support {community.name}
          </p>
          <CommunityPaymentButton community={community} />
        </div>
      </div>

      {/* Scrollable tabs */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {tabsWithCounts.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === t.key ? 'text-[#0F5ED7]' : 'text-slate-500'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-1 text-[10px] bg-[#E0EDFF] text-[#2563EB] rounded-full px-1.5 py-0.5 font-bold">
                    {t.count}
                  </span>
                )}
                {activeTab === t.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F5ED7] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pb-28">
        {activeTab === 'home' && (
          <CommunityHomepage
            community={community}
            posts={posts}
            events={events}
            opportunities={opportunities}
            onTabChange={setActiveTab}
            stats={communityStats}
            members={members}
          />
        )}

        {activeTab === 'about' && (
          <div className="space-y-3 pt-4">
            <BasicInfoSection community={community} />
            {!community.is_claimed && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm font-semibold text-amber-800 mb-1">Is this your shul?</p>
                <p className="text-xs text-amber-700 mb-2">This is your official community hub. Manage announcements, events, and mitzvah opportunities — free.</p>
                <button onClick={() => setShowClaim(true)} className="text-xs font-bold text-[#0F5ED7] underline">
                  Claim this page →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <MembersListTab communityId={communityId} />
        )}

        {activeTab === 'feed' && (
          <CommunityFeedTab posts={posts} isLoading={postsLoading} />
        )}

        {activeTab === 'announcements' && (
          <CommunityAnnouncementsTab posts={posts} isLoading={postsLoading} />
        )}

        {activeTab === 'events' && (
          <CommunityEventsTab events={events} isLoading={eventsLoading} />
        )}

        {activeTab === 'mitzvah' && (
          <CommunityMitzvahTab opportunities={opportunities} isLoading={oppsLoading} />
        )}

        {activeTab === 'chat' && (
          <div className="pt-4 h-[600px]">
            <GroupChatSection communityId={communityId} currentUser={currentUser} />
          </div>
        )}

        {activeTab === 'resources' && (
          <CommunityResourceLibrary communityId={communityId} currentUser={currentUser} isAdmin={isAdmin} />
        )}
      </div>

      <ClaimModal
        open={showClaim}
        onOpenChange={setShowClaim}
        community={community}
        currentUser={currentUser}
      />
    </div>
  );
}