import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Globe, Heart, Loader2, Lock, MapPin, MessageCircle, Phone, Send, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { dataService, incrementCounter } from '@/services';
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
import CommunityHero from './CommunityHero';
import ClaimModal from './ClaimModal';
import CommunityEventsTab from './CommunityEventsTab';
import CommunityGroupsTab from './CommunityGroupsTab';
import CommunityResourceLibrary from './CommunityResourceLibrary';
import CommunityStoreTab from './CommunityStoreTab';
import GroupChatSection from './GroupChatSection';
import CommunityAdminCenter, { AppealSubmitModal } from './CommunityAdminCenter';
import { useSwipeableTabs } from '@/hooks/useSwipeableTabs';
import {
  CommunityAdminQuickActions,
  CommunityFeaturedSection,
  CommunityImportantStrip,
  CommunityMemberDirectory,
  CommunityPostPreview,
  CommunityWelcomeHub,
  SinceLastVisitDigest,
} from './CommunityOperatingSystem';
import CommunityPersonalizationHub from './CommunityPersonalizationHub';
import CommunityPostLaunchPanel from './CommunityPostLaunchPanel';

const CLAIM_COPY = {
  School: { question: 'Is this your school?', cta: 'Claim this school' },
  Shul: { question: 'Is this your shul?', cta: 'Claim this shul' },
  Yeshiva: { question: 'Is this your yeshiva?', cta: 'Claim this yeshiva' },
  Seminary: { question: 'Is this your seminary?', cta: 'Claim this seminary' },
  Organization: { question: 'Is this your organization?', cta: 'Claim this organization' },
  Camp: { question: 'Is this your camp?', cta: 'Claim this camp' },
};

const OPEN_NEED_STATUSES = new Set(['open', 'offered', 'accepted', 'in_progress', 'volunteer_offered']);

function getPostTypeForTab(tab, typeKey) {
  if (tab === 'announcements') return 'announcement';
  if (tab === 'questions' || typeKey === 'parents') return 'question';
  if (tab === 'discussions' || typeKey === 'learning') return 'discussion';
  if (typeKey === 'chesed') return 'chesed';
  return 'post';
}

function matchesTab(post, tab) {
  const type = String(post.type || post.post_type || post.category || '').toLowerCase();
  const content = `${post.title || ''} ${post.body || ''} ${post.content || ''}`.toLowerCase();
  if (tab === 'announcements') return type === 'announcement';
  if (tab === 'questions') return type === 'question' || type === 'ask' || content.includes('?');
  if (tab === 'discussions') return type === 'discussion' || type === 'learning';
  return true;
}

export default function CommunityDetailView({ communityId, currentUser, onBack, fallbackCommunity }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [highlightEventId, setHighlightEventId] = useState(null);
  const [showClaim, setShowClaim] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showAdminCenter, setShowAdminCenter] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState('overview');
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [posting, setPosting] = useState(false);
  const queryClient = useQueryClient();

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      if (fallbackCommunity) return fallbackCommunity;
      try {
        const result = await dataService.entities.Community.get(communityId);
        if (result) return result;
      } catch {}
      const results = await dataService.entities.Community.filter({ id: communityId });
      return results[0] || null;
    },
    enabled: !!communityId,
  });

  const typeConfig = getCommunityTypeConfig(community || fallbackCommunity || {});

  const { data: membershipRecord = [] } = useQuery({
    queryKey: ['community-membership', communityId, currentUser?.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser && !!communityId,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', communityId],
    queryFn: () => dataService.entities.UnifiedPost.filter({ community_id: communityId }, '-created_date', 50),
    enabled: !!communityId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community-members', communityId],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId }, '-created_date', 100),
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
    queryFn: () => dataService.entities.MitzvahRequest.filter({ community_id: communityId }, '-created_date', 50),
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
    chat: Boolean(canUseCommunityChat(community) && community?.allow_group_chat),
    listings: Boolean(canUseCommunityMarketplace(community) && (community?.allow_member_listings || typeConfig.key === 'marketplace')),
    groups: true,
  };
  const visibleTabs = getSupportedCommunityTabs(community || fallbackCommunity || {}, featureCapabilities);
  const navConfig = getCommunityNavConfig(community || fallbackCommunity || {}, featureCapabilities);
  const setTab = (tab) => {
    const nextTab = visibleTabs.includes(tab) ? tab : (visibleTabs[0] || 'home');
    setActiveTab(nextTab);
    setShowMore(false);
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
  const tabButtonRefs = useRef({});
  useEffect(() => {
    tabButtonRefs.current[activeTab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  const swipeHandlers = useSwipeableTabs({ tabs: visibleTabs, activeTab, onTabChange: setTab });

  const { data: events = [] } = useQuery({
    queryKey: ['community-events', communityId],
    queryFn: () => dataService.entities.CommunityEvent.filter({ community_id: communityId }, 'start_date', 50),
    enabled: !!communityId && featureCapabilities.events,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['community-resources', communityId],
    queryFn: () => dataService.entities.CommunityResource.filter({ community_id: communityId }, '-created_date', 50),
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
        await dataService.entities.UserCommunity.delete(membershipRecord[0].id);
        if (community) await incrementCounter('communities', 'follower_count', communityId, -1);
        toast.success('Left community');
      } else {
        await dataService.entities.UserCommunity.create({ user_id: currentUser.id, community_id: communityId, role: 'member' });
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
      await dataService.entities.UnifiedPost.create({
        user_id: currentUser.id,
        community_id: communityId,
        type: getPostTypeForTab(activeTab, typeConfig.key),
        title: text.length > 72 ? text.slice(0, 72) : undefined,
        content: text,
      });
      setComposeText('');
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
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
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
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
      <CommunityHero
        community={community}
        isFollowing={isFollowing}
        isAdmin={isAdmin}
        isCreator={isCreator}
        onFollow={handleFollow}
        onManage={() => openAdminCenter('overview')}
        onClaim={() => setShowClaim(true)}
        onBack={onBack}
        actualMemberCount={actualMemberCount}
        members={members}
        currentUser={currentUser}
        onTabChange={setTab}
        typeConfig={typeConfig}
      />

      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <div className="flex gap-1 px-3 py-2">
            {/* Primary tabs */}
            {navConfig.primary.map((tabKey) => {
              const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
              if (!tabInfo) return null;
              return (
                <button
                  key={tabKey}
                  ref={(el) => { tabButtonRefs.current[tabKey] = el; }}
                  onClick={() => setTab(tabKey)}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors ${
                    activeTab === tabKey
                      ? 'bg-blue-50 text-[#0F5ED7] ring-1 ring-blue-200/80'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {tabInfo.label}
                  {tabInfo.count > 0 && (
                    <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-700">
                      {tabInfo.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More button — only if there are overflow tabs */}
            {navConfig.more.length > 0 && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowMore((v) => !v)}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors ${
                    navConfig.more.includes(activeTab)
                      ? 'bg-blue-50 text-[#0F5ED7] ring-1 ring-blue-200/80'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  More
                  {navConfig.more.includes(activeTab) && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[#0F5ED7] align-middle" />
                  )}
                </button>

                {/* More dropdown */}
                {showMore && (
                  <>
                    {/* Backdrop to close */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMore(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-2xl border border-slate-100 bg-white shadow-xl py-1">
                      {navConfig.more.map((tabKey) => {
                        const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
                        if (!tabInfo) return null;
                        return (
                          <button
                            key={tabKey}
                            onClick={() => { setTab(tabKey); setShowMore(false); }}
                            className={`w-full px-4 py-2.5 text-left text-[13px] font-semibold transition-colors flex items-center justify-between ${
                              activeTab === tabKey
                                ? 'text-[#0F5ED7] bg-blue-50'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{tabInfo.label}</span>
                            {tabInfo.count > 0 && (
                              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-700">
                                {tabInfo.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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

      <div className="max-w-2xl mx-auto w-full px-4 pb-28" {...swipeHandlers}>
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
            onManage={() => openAdminCenter('content')}
            openAdminCenter={openAdminCenter}
            onOpenEvent={(event) => { setHighlightEventId(event.id); setTab('events'); }}
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

        {['posts', 'questions', 'discussions', 'announcements'].includes(activeTab) && (
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

        {activeTab === 'chat' && featureCapabilities.chat && (
          <div className="mt-4 h-[60vh] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <GroupChatSection communityId={communityId} currentUser={currentUser} />
          </div>
        )}
      </div>

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
          queryClient.invalidateQueries({ queryKey: ['community-pinned-post', communityId] });
        }}
        initialTab={adminInitialTab}
        onDeleted={() => {
          setShowAdminCenter(false);
          onBack?.();
        }}
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

function ComposerBox({ typeConfig, composeText, setComposeText, submitPost, posting }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-950">{typeConfig.primaryCta}</p>
          <p className="text-[11px] font-semibold text-slate-500">{typeConfig.tagline}</p>
        </div>
      </div>
      <textarea
        value={composeText}
        onChange={(event) => setComposeText(event.target.value)}
        rows={3}
        placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
      />
      <div className="mt-3 flex justify-end">
        <button
          onClick={submitPost}
          disabled={posting || !composeText.trim()}
          className={`motion-press inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 text-xs font-black text-white disabled:opacity-50`}
        >
          <Send className="h-3.5 w-3.5" />
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}

function TypeAwareComposer({ typeConfig, composeText, setComposeText, submitPost, posting, mode }) {
  const [expanded, setExpanded] = useState(false);
  const composerMode = mode || typeConfig.composerMode || 'post';

  // Chesed mode: two action buttons → expand to form below
  if (composerMode === 'chesed') {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
        {!expanded ? (
          <div className="flex gap-2 p-3">
            <button
              type="button"
              onClick={() => setExpanded('request')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 py-2.5 text-[13px] font-black text-emerald-700 active:scale-95 transition-all"
            >
              🙏 Request Help
            </button>
            <button
              type="button"
              onClick={() => setExpanded('offer')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 py-2.5 text-[13px] font-black text-blue-700 active:scale-95 transition-all"
            >
              💚 Offer Help
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${expanded === 'request' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {expanded === 'request' ? '🙏 Requesting help' : '💚 Offering help'}
              </span>
              <button type="button" onClick={() => { setExpanded(false); setComposeText(''); }} className="ml-auto text-[12px] font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              rows={3}
              autoFocus
              placeholder={expanded === 'request' ? 'Describe what you need — meal, ride, errand, or something else...' : 'Describe what you can offer or how you can help...'}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={submitPost}
                disabled={posting || !composeText.trim()}
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-black text-white disabled:opacity-50 ${expanded === 'request' ? 'bg-emerald-600' : 'bg-blue-600'}`}
              >
                <Send className="h-3.5 w-3.5" />
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Message mode: single-line that expands on focus
  if (composerMode === 'message') {
    return (
      <div className={`rounded-2xl border bg-white shadow-sm transition-all ${expanded ? 'border-blue-300' : 'border-slate-100'}`}>
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
              <MessageCircle className="h-3.5 w-3.5" />
            </div>
            <span className="text-[13px] font-semibold text-slate-400">{typeConfig.prompts[0] || 'Share something with the community...'}</span>
          </button>
        ) : (
          <div className="p-4">
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              rows={3}
              autoFocus
              placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={() => { setExpanded(false); setComposeText(''); }} className="text-[12px] font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
              <button onClick={submitPost} disabled={posting || !composeText.trim()} className={`inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 text-xs font-black text-white disabled:opacity-50`}>
                <Send className="h-3.5 w-3.5" />
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Official mode (admin-only composer for shul/org)
  if (composerMode === 'official') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-wide text-amber-700 flex items-center gap-1">
            📢 Post Announcement
          </span>
        </div>
        <textarea
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          rows={3}
          placeholder="Share an official update with the community..."
          className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-400"
        />
        <div className="mt-2 flex justify-end">
          <button onClick={submitPost} disabled={posting || !composeText.trim()} className="inline-flex h-9 items-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-black text-white disabled:opacity-50">
            <Send className="h-3.5 w-3.5" />
            {posting ? 'Posting...' : 'Post Update'}
          </button>
        </div>
      </div>
    );
  }

  // Post mode (default): standard textarea
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
          <MessageCircle className="h-3.5 w-3.5" />
        </div>
        <p className="text-sm font-black text-slate-950">{typeConfig.primaryCta}</p>
      </div>
      <textarea
        value={composeText}
        onChange={(e) => setComposeText(e.target.value)}
        rows={3}
        placeholder={typeConfig.prompts[0] || 'Share something with the community...'}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
      />
      <div className="mt-2 flex justify-end">
        <button onClick={submitPost} disabled={posting || !composeText.trim()} className={`inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 text-xs font-black text-white disabled:opacity-50`}>
          <Send className="h-3.5 w-3.5" />
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}

const POST_LAUNCH_DISMISS_KEY = (id) => `post_launch_dismissed_${id}`;

function RoutedCommunityHome({
  community,
  typeConfig,
  posts,
  activeNeeds,
  composeText,
  setComposeText,
  submitPost,
  posting,
  onTabChange,
  canPost,
  members,
  events,
  resources,
  isAdmin,
  isCreator,
  isFollowing,
  lastVisitedAt,
  currentUser,
  onManage,
  openAdminCenter,
  onOpenEvent,
}) {
  const [panelDismissed, setPanelDismissed] = React.useState(
    () => Boolean(localStorage.getItem(POST_LAUNCH_DISMISS_KEY(community?.id)))
  );

  const handleDismissPanel = () => {
    try { localStorage.setItem(POST_LAUNCH_DISMISS_KEY(community.id), '1'); } catch {}
    setPanelDismissed(true);
  };

  const communityCreatedAt = community?.created_at || community?.created_date;
  const ageMs = communityCreatedAt ? Date.now() - new Date(communityCreatedAt).getTime() : 0;
  const isRecent = !communityCreatedAt || ageMs < 14 * 24 * 60 * 60 * 1000;
  const showPanel = isFollowing && isCreator && !panelDismissed && isRecent;
  if (!isFollowing) {
    // ── Visitor landing page ───────────────────────────────────────────────────
    return (
      <div className="space-y-3 pt-3">
        <CommunityWelcomeHub
          community={community}
          typeConfig={typeConfig}
          posts={posts}
          events={events}
          resources={resources}
          members={members}
          isCommunityManager={false}
          isFollowing={false}
          onTabChange={onTabChange}
          onManage={onManage}
          onCompose={() => {}}
        />
        <CommunityFeaturedSection
          typeConfig={typeConfig}
          posts={posts}
          events={events}
          resources={resources}
          onTabChange={onTabChange}
        />
        <RoutedPostsList posts={posts.slice(0, 4)} typeConfig={typeConfig} emptyCompact />
      </div>
    );
  }

  // ── Joined member: feed-first layout — respects community.settings.layout ──
  const layoutSettings = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.layout || {})
    : {};
  const hiddenSections = new Set(layoutSettings.hiddenSections || []);
  const sectionOrder = layoutSettings.homeSections?.length
    ? layoutSettings.homeSections
    : ['digest', 'importantNow', 'adminTools', 'personalization', 'composer', 'feed'];
  const effectiveComposerMode = layoutSettings.composerMode || undefined;

  const sectionMap = {
    digest: (
      <SinceLastVisitDigest
        posts={posts}
        events={events}
        lastVisitedAt={lastVisitedAt}
        onTabChange={onTabChange}
      />
    ),
    importantNow: (
      <CommunityImportantStrip
        posts={posts}
        events={events}
        activeNeeds={activeNeeds}
        resources={resources}
        typeConfig={typeConfig}
        onTabChange={onTabChange}
      />
    ),
    adminTools: isAdmin ? (
      <CommunityAdminQuickActions
        onAnnouncement={() => onTabChange('announcements')}
        onEvent={() => onTabChange('events')}
        onResource={() => onTabChange('resources')}
        onAdminCenter={() => openAdminCenter?.('overview') ?? onManage?.()}
      />
    ) : null,
    personalization: (
      <CommunityPersonalizationHub
        communityId={community.id}
        currentUser={currentUser}
        events={events}
        typeConfig={typeConfig}
        onTabChange={onTabChange}
        onOpenEvent={onOpenEvent}
      />
    ),
    composer: canPost ? (
      <TypeAwareComposer
        typeConfig={typeConfig}
        composeText={composeText}
        setComposeText={setComposeText}
        submitPost={submitPost}
        posting={posting}
        mode={effectiveComposerMode}
      />
    ) : (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Lock className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <p className="text-[13px] font-semibold text-slate-500">Posting is restricted to community admins.</p>
      </div>
    ),
    feed: (
      <HomeFeedSection
        posts={posts}
        typeConfig={typeConfig}
        activeNeeds={typeConfig.key === 'chesed' ? activeNeeds : []}
        onTabChange={onTabChange}
      />
    ),
  };

  const orderedSections = sectionOrder
    .filter((key) => !hiddenSections.has(key))
    .map((key) => ({ key, component: sectionMap[key] }))
    .filter(({ component }) => component != null);

  return (
    <div className="space-y-3 pt-3">
      {showPanel && (
        <CommunityPostLaunchPanel
          community={community}
          typeConfig={typeConfig}
          posts={posts}
          events={events}
          resources={resources}
          activeNeeds={activeNeeds}
          members={members}
          currentUser={currentUser}
          onTabChange={onTabChange}
          onDismiss={handleDismissPanel}
        />
      )}
      {orderedSections.map(({ key, component }) => (
        <React.Fragment key={key}>{component}</React.Fragment>
      ))}
    </div>
  );
}

const TAB_EMPTY_COPY = {
  events: {
    neighborhood: { title: 'No local events yet', body: 'Add a neighborhood meetup, school event, or community gathering.' },
    shul: { title: 'No upcoming events', body: 'Add a Shabbos event, holiday program, or community gathering.' },
    chesed: { title: 'No volunteer events yet', body: 'Add a volunteer day, chesed gathering, or community help event.' },
    learning: { title: 'No learning events yet', body: 'Schedule a shiur, chavrusa session, or learning event.' },
    parents: { title: 'No family events yet', body: 'Share a school event, camp activity, or family gathering.' },
    events: { title: 'No events posted yet', body: 'Create the first event — gatherings, programs, and socials start here.' },
  },
  resources: {
    neighborhood: { title: 'No local resources yet', body: 'Share guides, community contacts, neighborhood alerts, or helpful local links.' },
    shul: { title: 'No resources shared yet', body: 'Share schedules, forms, weekly guides, or member resources here.' },
    learning: { title: 'No learning resources yet', body: 'Share shiur recordings, source sheets, or useful learning links.' },
    chesed: { title: 'No resources yet', body: 'Add contact lists, volunteer guides, or chesed organization links.' },
    parents: { title: 'No resources yet', body: 'Share school guides, camp info, local recommendations, or family forms.' },
  },
  openNeeds: {
    chesed: { title: 'No open needs right now', body: 'Post a request or invite someone to offer help. Needs coordinated here.' },
  },
  discussions: {
    learning: { title: 'No discussions yet', body: 'Start a Torah question, share a thought, or begin a chavrusa-style thread.' },
  },
  questions: {
    parents: { title: 'No questions yet', body: 'Ask for a school recommendation, babysitter tip, or local parenting help.' },
  },
};

function getTabEmptyState(typeKey, tabKey) {
  const tabMap = TAB_EMPTY_COPY[tabKey] || {};
  return tabMap[typeKey] || null;
}

function CompactEmptyState({ typeConfig, tabKey }) {
  const Icon = typeConfig?.icon;
  const custom = getTabEmptyState(typeConfig?.key, tabKey);
  const title = custom?.title || typeConfig?.emptyTitle || 'Nothing here yet';
  const body = custom?.body || typeConfig?.emptyBody || 'Be the first to post.';
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
      {Icon && (
        <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-[14px] font-black text-slate-900">{title}</p>
      <p className="mt-1 text-[12px] font-semibold text-slate-400 leading-5">{body}</p>
    </div>
  );
}

function HomeFeedSection({ posts, typeConfig, activeNeeds = [], onTabChange }) {
  if (!posts.length && !activeNeeds.length) {
    return <CompactEmptyState typeConfig={typeConfig} tabKey="home" />;
  }

  return (
    <div className="space-y-2.5">
      {posts.map((post) => (
        <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} />
      ))}
      {activeNeeds.map((need) => (
        <article key={need.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{need.status || 'open'}</span>
          <h3 className="mt-2 text-[14px] font-black text-slate-950">{need.title}</h3>
          {need.description && <p className="mt-1 text-sm leading-5 text-slate-600 line-clamp-2">{need.description}</p>}
        </article>
      ))}
    </div>
  );
}

function RoutedPostsTab({ posts, isLoading, activeTab, typeConfig, composeText, setComposeText, submitPost, posting, canPost }) {
  const filteredPosts = posts.filter((post) => matchesTab(post, activeTab));
  return (
    <div className="space-y-4 pt-4">
      {canPost ? (
        <ComposerBox
          typeConfig={typeConfig}
          composeText={composeText}
          setComposeText={setComposeText}
          submitPost={submitPost}
          posting={posting}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <p className="text-[13px] font-semibold text-slate-500">Posting is restricted to community admins.</p>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      ) : (
        <RoutedPostsList posts={filteredPosts} typeConfig={typeConfig} tabKey={activeTab} />
      )}
    </div>
  );
}

function RoutedPostsList({ posts, typeConfig, emptyCompact = false, tabKey }) {
  if (!posts.length) {
    if (emptyCompact) return null;
    return <CompactEmptyState typeConfig={typeConfig} tabKey={tabKey} />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} />
      ))}
    </div>
  );
}

function RoutedOpenNeedsTab({ activeNeeds, typeConfig }) {
  if (!activeNeeds.length) {
    return (
      <div className="pt-4">
        <CompactEmptyState typeConfig={typeConfig} tabKey="openNeeds" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {activeNeeds.map((need) => (
        <article key={need.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{need.status || 'open'}</span>
          <h3 className="mt-3 text-[15px] font-black text-slate-950">{need.title}</h3>
          {need.description && <p className="mt-1 text-sm leading-6 text-slate-600">{need.description}</p>}
          {(need.location_label || need.neighborhood) && (
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {need.location_label || need.neighborhood}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function AboutTab({ community, typeConfig, onClaim }) {
  const type = community.type || community.verified_type || typeConfig.label;
  const claim = CLAIM_COPY[type] || { question: 'Is this your community?', cta: 'Claim this page' };

  return (
    <div className="space-y-3 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> About this {typeConfig.label.toLowerCase()}
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{community.description_long || community.description_short || community.description || typeConfig.cardFallback}</p>
      </div>

      {(community.address || community.phone || community.website) && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
          {community.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(community.address)}`} target="_blank" rel="noreferrer"
              className="flex items-start gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{community.address}</span>
            </a>
          )}
          {community.phone && (
            <a href={`tel:${community.phone}`} className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{community.phone}</span>
            </a>
          )}
          {community.website && (
            <a href={community.website?.startsWith('http') ? community.website : `https://${community.website}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
              <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="break-all">{community.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </a>
          )}
        </div>
      )}

      {community.rules && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Community Guidelines
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{community.rules}</p>
        </div>
      )}

      {community.donation_url && (
        <a
          href={community.donation_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-[14px] active:scale-95 transition-all"
        >
          <Heart className="w-4 h-4 fill-white" />
          Donate to {community.name}
        </a>
      )}

      {community.verified_plan && community.verified_plan !== 'none' && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-[13px] text-blue-700 font-medium">
          <Shield className="w-4 h-4 flex-shrink-0" />
          Verified {community.type || 'Community'} on JUnited
        </div>
      )}

      {!community.is_claimed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-amber-800 mb-1">{claim.question}</p>
          <p className="text-xs text-amber-700 mb-2">Manage announcements, posts, and your community hub.</p>
          <button onClick={onClaim} className="text-xs font-bold text-[#0F5ED7] underline">
            {claim.cta} →
          </button>
        </div>
      )}
    </div>
  );
}
