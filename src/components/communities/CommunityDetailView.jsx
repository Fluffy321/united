import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { dataService, incrementCounter } from '@/services';
import postsService from '@/services/postsService';
import {
  getCommunityNavConfig,
  getCommunityTabLabel,
  getCommunityTypeConfig,
  getSupportedCommunityTabs,
} from '@/lib/communityTypes';
import {
  canUseCommunityChat,
  canUseCommunityEvents,
  canUseCommunityMarketplace,
  canUseCommunityResources,
} from '@/lib/communityPlans';
import { supabase } from '@/api/supabaseClient';
import { postKeys } from '@/lib/queryKeys';
import QueryError from '@/components/common/QueryError';
import CommunityHero from './CommunityHero';
import ClaimModal from './ClaimModal';
import CommunityEventsTab from './CommunityEventsTab';
import CommunityGroupsTab from './CommunityGroupsTab';
import CommunityFormsTab from './CommunityFormsTab';
import CommunityResourceLibrary from './CommunityResourceLibrary';
import CommunityStoreTab from './CommunityStoreTab';
import GroupChatSection from './GroupChatSection';
import CommunityInviteModal from './CommunityInviteModal';
import CommunityAdminCenter from './CommunityAdminCenter';
import AppealSubmitModal from './admin/AppealSubmitModal';
import { useSwipeableTabs } from '@/hooks/useSwipeableTabs';
import {
  CommunityMemberDirectory,
} from './CommunityOperatingSystem';
import { createUserCommunity, deleteUserCommunity, filterCommunity, filterCommunityEvent, filterCommunityResource, filterMitzvahRequest, filterUnifiedPost, filterUserCommunity, getCommunity } from '@/services/entityServices';
import { matchesTab } from './detail/shared';
import CommunityAppBar from './detail/CommunityAppBar';
import CommunityNavDrawer from './detail/CommunityNavDrawer';
import RoutedCommunityHome from './detail/RoutedCommunityHome';
import RoutedPostsTab from './detail/RoutedPostsTab';
import RoutedOpenNeedsTab from './detail/RoutedOpenNeedsTab';
import AboutTab from './detail/AboutTab';

const OPEN_NEED_STATUSES = new Set(['open', 'offered', 'accepted', 'in_progress', 'volunteer_offered']);

function getPostTypeForTab(tab, typeKey) {
  if (tab === 'announcements') return 'announcement';
  if (tab === 'questions' || typeKey === 'parents') return 'question';
  if (tab === 'discussions' || typeKey === 'learning') return 'discussion';
  if (typeKey === 'chesed') return 'chesed';
  return 'post';
}

export default function CommunityDetailView({ communityId, currentUser, onBack, fallbackCommunity }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(requestedTab || 'home');
  const [highlightEventId, setHighlightEventId] = useState(null);
  const [showClaim, setShowClaim] = useState(false);
  const [showAdminCenter, setShowAdminCenter] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState('overview');
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const queryClient = useQueryClient();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      if (fallbackCommunity) return fallbackCommunity;
      try {
        const result = await getCommunity(communityId);
        if (result) return result;
      } catch {}
      const results = await filterCommunity({ id: communityId });
      return results[0] || null;
    },
    enabled: !!communityId,
  });

  const typeConfig = getCommunityTypeConfig(community || fallbackCommunity || {});

  const { data: membershipRecord = [] } = useQuery({
    queryKey: ['community-membership', communityId, currentUser?.id],
    queryFn: () => filterUserCommunity({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser && !!communityId,
  });

  const { data: posts = [], isLoading: postsLoading, isError: postsError, refetch: refetchPosts } = useQuery({
    queryKey: postKeys.community(communityId),
    queryFn: () => filterUnifiedPost({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => filterUserCommunity({ community_id: communityId }, '-created_date', 100),
    enabled: !!communityId,
  });

  // Check if the current (non-member) user was removed and can appeal
  const { data: myRemoval = null } = useQuery({
    queryKey: ['my-community-removal', communityId, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_member_removals')
        .select('id, reason_code, removed_at, appeal_allowed, appeal:community_member_appeals(id, status)')
        .eq('community_id', communityId)
        .eq('removed_user_id', currentUser.id)
        .order('removed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!currentUser && !!communityId
      && membershipRecord.length === 0
      && community?.created_by_user_id !== currentUser?.id,
  });

  const { data: openNeeds = [] } = useQuery({
    queryKey: ['community-open-needs', communityId],
    queryFn: () => filterMitzvahRequest({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId && typeConfig.key === 'chesed',
  });

  const membershipRole = String(membershipRecord[0]?.role || '').toLowerCase();
  const isCreator = Boolean(currentUser?.id && community?.created_by_user_id === currentUser.id);
  const isFollowing = membershipRecord.length > 0 || isCreator;
  const isAdmin = currentUser?.role === 'admin' || isCreator || ['admin', 'moderator', 'owner'].includes(membershipRole);
  const canPost = isAdmin || (community?.posting_mode || 'open') === 'open';
  const actualMemberCount = members.length;
  const activeNeeds = openNeeds.filter((need) => OPEN_NEED_STATUSES.has(String(need.status || 'open')));
  const featureCapabilities = {
    events: canUseCommunityEvents(community),
    resources: canUseCommunityResources(community),
    chat: canUseCommunityChat(community),
    listings: Boolean(canUseCommunityMarketplace(community) && (community?.allow_member_listings || typeConfig.key === 'marketplace')),
    groups: true,
    forms: Boolean(community?.allow_forms),
  };
  const visibleTabs = getSupportedCommunityTabs(community || fallbackCommunity || {}, featureCapabilities);
  const navConfig = getCommunityNavConfig(community || fallbackCommunity || {}, featureCapabilities);
  const defaultTab = !requestedTab && isFollowing && featureCapabilities.chat ? 'chat' : 'home';

  useEffect(() => {
    if (isLoading) return;
    // A deep-linked ?tab= that isn't offered here (disabled module, typo)
    // would otherwise render a blank content area — setTab only guards clicks.
    if (requestedTab) {
      if (!visibleTabs.includes(activeTab)) setActiveTab(visibleTabs[0] || 'home');
      return;
    }
    const nextTab = visibleTabs.includes(defaultTab) ? defaultTab : (visibleTabs[0] || 'home');
    setActiveTab((current) => (current === nextTab ? current : nextTab));
  }, [activeTab, defaultTab, isLoading, requestedTab, visibleTabs]);

  const setTab = (tab) => {
    const nextTab = visibleTabs.includes(tab) ? tab : (visibleTabs[0] || 'home');
    setActiveTab(nextTab);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', nextTab);
      return next;
    }, { replace: true });
  };

  const openAdminCenter = (tab = 'overview') => {
    setAdminInitialTab(tab);
    setShowAdminCenter(true);
  };

  // Tab button refs for scrolling active pill into view after swipe
  const heroRef = useRef(null);
  const tabButtonRefs = useRef({});
  useEffect(() => {
    tabButtonRefs.current[activeTab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  const swipeHandlers = useSwipeableTabs({ tabs: visibleTabs, activeTab, onTabChange: setTab, disabled: activeTab === 'home' });

  const { data: events = [] } = useQuery({
    queryKey: ['community-events', communityId],
    queryFn: () => filterCommunityEvent({ community_id: communityId }, 'start_date', 50),
    enabled: !!communityId && featureCapabilities.events,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['community-resources', communityId],
    queryFn: () => filterCommunityResource({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId && featureCapabilities.resources,
  });

  const { data: lastVisit = null } = useQuery({
    queryKey: ['community-last-visit', communityId, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_last_visits')
        .select('visited_at')
        .eq('user_id', currentUser.id)
        .eq('community_id', communityId)
        .maybeSingle();
      return data;
    },
    enabled: Boolean(currentUser?.id && communityId && isFollowing),
    staleTime: 60000,
  });

  const visitTimerRef = useRef(null);
  useEffect(() => {
    if (!currentUser?.id || !communityId || !isFollowing) return;
    visitTimerRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('community_last_visits')
          .upsert(
            { user_id: currentUser.id, community_id: communityId, visited_at: new Date().toISOString() },
            { onConflict: 'user_id,community_id' }
          );
      } catch {} // fire-and-forget
    }, 4000);
    return () => clearTimeout(visitTimerRef.current);
  }, [communityId, currentUser?.id, isFollowing]);

  const accentHex = community?.settings?.branding?.accentColor
    || (community || fallbackCommunity)?.featured_accent_color
    || typeConfig.accentHex
    || '#2563EB';

  useEffect(() => {
    document.documentElement.style.setProperty('--community-accent', accentHex);
    return () => document.documentElement.style.removeProperty('--community-accent');
  }, [accentHex]);

  const handleShare = async () => {
    if (!currentUser) {
      dataService.auth.redirectToLogin(`${window.location.pathname}${window.location.search || ''}`);
      return;
    }
    setShowInviteModal(true);
  };

  const handleFollow = async () => {
    if (!currentUser) {
      dataService.auth.redirectToLogin();
      return;
    }

    try {
      if (isFollowing) {
        if (isCreator) {
          toast.info('Community owners manage their community instead of leaving it.');
          return;
        }
        await deleteUserCommunity(membershipRecord[0].id);
        if (community) await incrementCounter('communities', 'follower_count', communityId, -1);
        toast.success('Left community');
      } else {
        await createUserCommunity({ user_id: currentUser.id, community_id: communityId, role: 'member' });
        if (community) await incrementCounter('communities', 'follower_count', communityId, 1);
        toast.success('Joined!');
      }
    queryClient.invalidateQueries({ queryKey: ['community-membership', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community', communityId] });
    queryClient.invalidateQueries({ queryKey: ['user-communities', currentUser?.id] });
    } catch {
      toast.error('Could not update membership');
    }
  };

  const submitPost = async () => {
    const text = composeText.trim();
    if (!text) return;
    if (!currentUser) {
      dataService.auth.redirectToLogin();
      return;
    }

    setPosting(true);
    try {
      if (activeTab === 'announcements' && !isAdmin) {
        toast.error('Only community managers can post official announcements.');
        return;
      }
      await postsService.createCommunityPost({
        user_id: currentUser.id,
        community_id: communityId,
        type: getPostTypeForTab(activeTab, typeConfig.key),
        title: text.length > 72 ? text.slice(0, 72) : undefined,
        content: text,
      });
      setComposeText('');
      queryClient.invalidateQueries({ queryKey: postKeys.community(communityId) });
      toast.success('Posted');
    } catch {
      toast.error('Could not post right now');
    } finally {
      setPosting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">JU</div>
        <h2 className="text-xl font-bold text-slate-800">Community not found</h2>
        <p className="text-slate-500 text-sm">This community may have been removed or the link is invalid.</p>
        <button onClick={onBack} className="mt-2 bg-blue-600 text-white rounded-full px-6 py-2.5 font-semibold text-sm active:scale-95 transition-all">
          Back to Communities
        </button>
      </div>
    );
  }

  const tabsWithCounts = visibleTabs.map((key) => ({
    key,
    label: getCommunityTabLabel(key),
    count: key === 'announcements'
      ? posts.filter((post) => matchesTab(post, 'announcements')).length
      : key === 'openNeeds'
        ? activeNeeds.length
        : key === 'events'
          ? events.length
        : 0,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col">
      {/* Wrapper gives CommunityAppBar a real element to observe (non-zero area) */}
      <div ref={heroRef}>
        <CommunityHero
          community={community}
          isFollowing={isFollowing}
          isAdmin={isAdmin}
          isCreator={isCreator}
          onFollow={handleFollow}
          onManage={() => openAdminCenter('overview')}
          onClaim={() => setShowClaim(true)}
          onBack={onBack}
          onOpenDrawer={() => setShowDrawer(true)}
          actualMemberCount={actualMemberCount}
          members={members}
          currentUser={currentUser}
          onTabChange={setTab}
          typeConfig={typeConfig}
          inAppShell
        />
      </div>
      {/* key=communityId forces remount on navigation — prevents stale visible state */}
      <CommunityAppBar
        key={communityId}
        heroRef={heroRef}
        community={community}
        typeConfig={typeConfig}
        isAdmin={isAdmin}
        accentHex={accentHex}
        onBack={onBack}
        onManage={() => openAdminCenter('overview')}
        onShare={handleShare}
        onOpenDrawer={() => setShowDrawer(true)}
      />

      {/* Appeal banner — shown when user was removed and hasn't yet appealed */}
      {myRemoval && !isFollowing && (() => {
        const appealEntry = myRemoval.appeal?.[0];
        const appealStatus = appealEntry?.status ?? null;
        if (appealStatus === 'approved') return null;
        return (
          <div className={`border-b px-4 py-3 ${
            appealStatus === 'pending'
              ? 'bg-amber-50 border-amber-200'
              : appealStatus === 'denied'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="max-w-2xl mx-auto flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-slate-800">
                  {appealStatus === 'pending'
                    ? 'Your appeal is under review.'
                    : appealStatus === 'denied'
                    ? 'Your appeal was not approved.'
                    : 'You were removed from this community.'}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {appealStatus === 'pending'
                    ? 'The community admin will review your appeal.'
                    : appealStatus === 'denied'
                    ? 'Contact the community admin if you have questions.'
                    : 'You may submit an appeal if you believe this was in error.'}
                </p>
              </div>
              {!appealStatus && myRemoval.appeal_allowed && (
                <button
                  type="button"
                  onClick={() => setShowAppealModal(true)}
                  className="flex-shrink-0 rounded-xl bg-[#2563EB] px-3 py-1.5 text-[12px] font-black text-white"
                >
                  Appeal
                </button>
              )}
            </div>
          </div>
        );
      })()}

      <div className="max-w-2xl mx-auto w-full px-4 pb-8" {...swipeHandlers}>
        {activeTab !== 'home' && (
          <button
            type="button"
            onClick={() => setTab('home')}
            className="flex items-center gap-1 pt-3 pb-1 text-[13px] font-bold text-slate-400 active:text-slate-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
        )}
        {activeTab === 'home' && (
          <RoutedCommunityHome
            posts={posts}
            activeNeeds={activeNeeds}
            composeText={composeText}
            setComposeText={setComposeText}
            submitPost={submitPost}
            posting={posting}
            onTabChange={setTab}
            canPost={canPost}
            community={community}
            typeConfig={typeConfig}
            members={members}
            events={events}
            resources={resources}
            isAdmin={isAdmin}
            isCreator={isCreator}
            isFollowing={isFollowing}
            lastVisitedAt={lastVisit?.visited_at}
            currentUser={currentUser}
            onFollow={handleFollow}
            onManage={() => openAdminCenter('content')}
            openAdminCenter={openAdminCenter}
            onOpenEvent={(event) => { setHighlightEventId(event.id); setTab('events'); }}
            visibleTabs={visibleTabs}
          />
        )}

        {activeTab === 'about' && (
          <AboutTab community={community} typeConfig={typeConfig} onClaim={() => setShowClaim(true)} />
        )}

        {activeTab === 'members' && (
          <CommunityMemberDirectory
            community={community}
            members={members}
            memberCount={actualMemberCount || community.follower_count || 0}
          />
        )}

        {['posts', 'questions', 'discussions', 'announcements'].includes(activeTab) && postsError && posts.length === 0 && (
          <div className="px-4 py-3">
            <QueryError message="Posts could not load." onRetry={refetchPosts} />
          </div>
        )}
        {['posts', 'questions', 'discussions', 'announcements'].includes(activeTab) && !(postsError && posts.length === 0) && (
          <RoutedPostsTab
            posts={posts}
            isLoading={postsLoading}
            activeTab={activeTab}
            typeConfig={typeConfig}
            composeText={composeText}
            setComposeText={setComposeText}
            submitPost={submitPost}
            posting={posting}
            canPost={activeTab === 'announcements' ? isAdmin : canPost}
          />
        )}

        {activeTab === 'openNeeds' && (
          <RoutedOpenNeedsTab activeNeeds={activeNeeds} typeConfig={typeConfig} />
        )}

        {activeTab === 'events' && featureCapabilities.events && (
          <CommunityEventsTab
            events={events}
            community={community}
            currentUser={currentUser}
            communityId={communityId}
            isAdmin={isAdmin}
            highlightEventId={highlightEventId}
            typeConfig={typeConfig}
          />
        )}

        {activeTab === 'resources' && featureCapabilities.resources && (
          <CommunityResourceLibrary
            communityId={communityId}
            community={community}
            currentUser={currentUser}
            isAdmin={isAdmin}
            typeConfig={typeConfig}
          />
        )}

        {activeTab === 'listings' && featureCapabilities.listings && (
          <CommunityStoreTab
            communityId={communityId}
            community={community}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'groups' && (
          <CommunityGroupsTab
            communityId={communityId}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'forms' && featureCapabilities.forms && (
          <CommunityFormsTab
            communityId={communityId}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'chat' && featureCapabilities.chat && (
          <div className="mt-4 h-[60vh] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <GroupChatSection communityId={communityId} currentUser={currentUser} onInvite={handleShare} />
          </div>
        )}
      </div>

      {showDrawer && community && (
        <CommunityNavDrawer
          community={community}
          visibleTabs={visibleTabs}
          activeTab={activeTab}
          tabsWithCounts={tabsWithCounts}
          onTabChange={(tab) => { setTab(tab); setShowDrawer(false); }}
          onClose={() => setShowDrawer(false)}
          accentHex={accentHex}
          isAdmin={isAdmin}
          onManage={() => { setShowDrawer(false); openAdminCenter('overview'); }}
        />
      )}

      <ClaimModal
        open={showClaim}
        onOpenChange={setShowClaim}
        community={community}
        currentUser={currentUser}
      />
      <CommunityAdminCenter
        community={community}
        currentUser={currentUser}
        open={showAdminCenter}
        onClose={() => setShowAdminCenter(false)}
        onCommunityUpdated={(updated) => {
          if (updated) {
            // Immediately update the cache so tabs/flags reflect without waiting for a refetch.
            queryClient.setQueryData(['community', communityId], updated);
          }
          queryClient.invalidateQueries({ queryKey: ['community', communityId] });
          queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
          queryClient.invalidateQueries({ queryKey: ['communities-list'] });
          queryClient.invalidateQueries({ queryKey: postKeys.communityPinned(communityId) });
        }}
        initialTab={adminInitialTab}
        onDeleted={() => {
          setShowAdminCenter(false);
          onBack?.();
        }}
      />
      <CommunityInviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        community={community}
        currentUser={currentUser}
        typeConfig={typeConfig}
      />
      {showAppealModal && myRemoval && (
        <AppealSubmitModal
          removal={myRemoval}
          communityName={community?.name}
          onClose={() => setShowAppealModal(false)}
          onSubmitted={() => {
            setShowAppealModal(false);
            queryClient.invalidateQueries({ queryKey: ['my-community-removal', communityId, currentUser?.id] });
          }}
        />
      )}
    </div>
  );
}

