import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, CalendarDays, ChevronLeft, ChevronRight, Globe, Hash, Heart,
  HeartHandshake, HelpCircle, Home, Info, Loader2, Lock, MapPin,
  Megaphone, MessageCircle, MoreHorizontal, Phone, Send, Settings, Share2,
  Shield, ShoppingBag, Sparkles, Users,
} from 'lucide-react';
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
import CommunityFormsTab from './CommunityFormsTab';
import CommunityResourceLibrary from './CommunityResourceLibrary';
import CommunityStoreTab from './CommunityStoreTab';
import GroupChatSection from './GroupChatSection';
import CommunityAdminCenter, { AppealSubmitModal } from './CommunityAdminCenter';
import { useSwipeableTabs } from '@/hooks/useSwipeableTabs';
import {
  CommunityAdminQuickActions,
  CommunityFeaturedSection,
  CommunityMemberDirectory,
  CommunityPostPreview,
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

const TAB_ICON_MAP = {
  home:          Home,
  about:         Info,
  members:       Users,
  posts:         Hash,
  questions:     HelpCircle,
  discussions:   MessageCircle,
  announcements: Megaphone,
  openNeeds:     HeartHandshake,
  events:        CalendarDays,
  resources:     BookOpen,
  listings:      ShoppingBag,
  groups:        Globe,
  chat:          MessageCircle,
};

const LAUNCHPAD_TAB_DESC = {
  posts:         'Updates and conversations',
  questions:     'Ask and get answers',
  discussions:   'Torah and learning threads',
  announcements: 'Official updates',
  openNeeds:     'Help requests and offers',
  events:        'Programs and gatherings',
  resources:     'Files, links, and guides',
  members:       'Directory and leadership',
  chat:          'Group chat',
  listings:      'Items and exchange',
  groups:        'Subgroups and circles',
  about:         'Community info and contact',
  forms:         'Forms and surveys',
};

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

function getFeaturedTab(typeConfig, cardTabs) {
  const emphasisMap = {
    announcements: 'announcements',
    events: 'events',
    chesed: 'openNeeds',
    resources: 'resources',
    feed: 'posts',
  };
  const preferred = emphasisMap[typeConfig.homeEmphasis];
  if (preferred && cardTabs.includes(preferred)) return preferred;
  const first = typeConfig.primaryTabs?.find((t) => t !== 'home' && cardTabs.includes(t));
  return first || cardTabs[0] || 'posts';
}

function getCardData(tab, { posts, events, activeNeeds, resources, memberCount }) {
  const upcomingEvents = events
    .filter((e) => new Date(e.start_date || e.event_date) >= new Date())
    .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date));

  if (tab === 'events') {
    if (upcomingEvents.length === 0) return { empty: true, emptyCta: 'No upcoming events' };
    const next = upcomingEvents[0];
    const eventDate = new Date(next.start_date || next.event_date);
    const days = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
    const dateLabel = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return { stat: `${upcomingEvents.length} upcoming`, preview: `${next.title || next.name || 'Event'} · ${dateLabel}` };
  }

  if (tab === 'announcements') {
    const latest = posts.find((p) => String(p.type || p.post_type || '').toLowerCase() === 'announcement');
    if (!latest) return { empty: true, emptyCta: 'No announcements yet' };
    const raw = latest.content || latest.body || latest.title || '';
    return { stat: 'Latest update', preview: raw.length > 70 ? `${raw.slice(0, 70)}…` : raw };
  }

  if (tab === 'posts') {
    const nonAnn = posts.filter((p) => String(p.type || p.post_type || '').toLowerCase() !== 'announcement');
    const latest = nonAnn[0];
    if (!latest) return { empty: true, emptyCta: 'No posts yet' };
    const raw = latest.content || latest.body || latest.title || '';
    return { stat: `${nonAnn.length} post${nonAnn.length !== 1 ? 's' : ''}`, preview: raw.length > 70 ? `${raw.slice(0, 70)}…` : raw };
  }

  if (tab === 'openNeeds') {
    if (activeNeeds.length === 0) return { empty: true, emptyCta: 'No open needs' };
    const first = activeNeeds[0];
    return { stat: `${activeNeeds.length} open need${activeNeeds.length !== 1 ? 's' : ''}`, preview: first.title || first.description?.slice(0, 70) || 'Community request' };
  }

  if (tab === 'resources') {
    if (resources.length === 0) return { empty: true, emptyCta: 'No resources yet' };
    const first = resources.find((r) => r.is_pinned) || resources[0];
    return { stat: `${resources.length} resource${resources.length !== 1 ? 's' : ''}`, preview: first.title || 'Community resource' };
  }

  if (tab === 'members') {
    return memberCount > 0 ? { stat: `${memberCount.toLocaleString()} member${memberCount !== 1 ? 's' : ''}` } : { empty: true, emptyCta: 'No members yet' };
  }

  return {};
}

export default function CommunityDetailView({ communityId, currentUser, onBack, fallbackCommunity }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [highlightEventId, setHighlightEventId] = useState(null);
  const [showClaim, setShowClaim] = useState(false);
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
    forms: Boolean(community?.allow_forms),
  };
  const visibleTabs = getSupportedCommunityTabs(community || fallbackCommunity || {}, featureCapabilities);
  const navConfig = getCommunityNavConfig(community || fallbackCommunity || {}, featureCapabilities);
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
  const tabButtonRefs = useRef({});
  useEffect(() => {
    tabButtonRefs.current[activeTab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  const swipeHandlers = useSwipeableTabs({ tabs: visibleTabs, activeTab, onTabChange: setTab, disabled: activeTab === 'home' });

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

  const accentHex = community?.settings?.branding?.accentColor
    || (community || fallbackCommunity)?.featured_accent_color
    || typeConfig.accentHex
    || '#2563EB';

  useEffect(() => {
    document.documentElement.style.setProperty('--community-accent', accentHex);
    return () => document.documentElement.style.removeProperty('--community-accent');
  }, [accentHex]);

  const handleShare = async () => {
    const url = `${window.location.origin}/communities/${communityId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: community?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      }
    } catch {}
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
      <CommunityAppBar
        community={community}
        typeConfig={typeConfig}
        isAdmin={isAdmin}
        accentHex={accentHex}
        onBack={onBack}
        onManage={() => openAdminCenter('overview')}
        onShare={handleShare}
      />
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
        inAppShell
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

        {activeTab === 'forms' && featureCapabilities.forms && (
          <CommunityFormsTab
            communityId={communityId}
            currentUser={currentUser}
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

function CommunityAppBar({ community, typeConfig, isAdmin, accentHex, onBack, onManage, onShare }) {
  const TypeIcon = typeConfig.icon;
  return (
    <div className="sticky top-0 z-40 h-12 bg-white/95 backdrop-blur-sm border-b border-slate-100 flex items-center gap-2 px-3 shadow-sm">
      <button
        onClick={onBack}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all flex-shrink-0"
      >
        <ChevronLeft className="w-5 h-5 text-slate-700" />
      </button>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accentHex }}
        >
          <TypeIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="font-bold text-slate-900 text-[14px] truncate">{community.name}</p>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isAdmin && (
          <button
            onClick={onManage}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Admin center"
          >
            <Settings className="w-4 h-4 text-slate-500" />
          </button>
        )}
        <button
          onClick={onShare}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}

function CommunityBottomNav({ navConfig, activeTab, tabsWithCounts, onTabChange, onMoreClick, accentHex }) {
  const moreIsActive = navConfig.more.includes(activeTab);
  return createPortal(
    <nav className="app-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4">
      <div className="glass-toolbar mobile-page pointer-events-auto relative overflow-hidden rounded-[28px] px-2 py-1.5">
        <div className="flex items-center justify-around px-1 py-1.5">
          {navConfig.primary.map((tabKey) => {
            const TabIcon = TAB_ICON_MAP[tabKey] || Home;
            const isActive = activeTab === tabKey;
            const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
            return (
              <button
                key={tabKey}
                onClick={() => onTabChange(tabKey)}
                className={`motion-press relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-[20px] py-[7px] touch-manipulation ${
                  isActive ? 'bg-white shadow-[0_12px_24px_rgba(37,99,235,0.14)] ring-1 ring-blue-100' : 'text-slate-500 hover:bg-white/70 active:bg-slate-100/60'
                }`}
              >
                {isActive && (
                  <span className="nav-active-pill absolute inset-1 rounded-[16px]" style={{ background: `${accentHex}18` }} />
                )}
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <div className="relative">
                    <TabIcon
                      className="h-[22px] w-[22px] transition-colors"
                      style={{ color: isActive ? accentHex : '#94a3b8' }}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                    {tabInfo?.count > 0 && !isActive && (
                      <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center px-0.5">
                        {tabInfo.count > 99 ? '99+' : tabInfo.count}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold leading-none transition-colors"
                    style={{ color: isActive ? accentHex : '#94a3b8' }}
                  >
                    {getCommunityTabLabel(tabKey)}
                  </span>
                </div>
              </button>
            );
          })}
          {navConfig.more.length > 0 && (
            <button
              onClick={onMoreClick}
              className={`motion-press relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-[20px] py-[7px] touch-manipulation ${
                moreIsActive ? 'bg-white shadow-[0_12px_24px_rgba(37,99,235,0.14)] ring-1 ring-blue-100' : 'text-slate-500 hover:bg-white/70 active:bg-slate-100/60'
              }`}
            >
              {moreIsActive && (
                <span className="nav-active-pill absolute inset-1 rounded-[16px]" style={{ background: `${accentHex}18` }} />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <MoreHorizontal
                  className="h-[22px] w-[22px] transition-colors"
                  style={{ color: moreIsActive ? accentHex : '#94a3b8' }}
                  strokeWidth={moreIsActive ? 2.5 : 1.75}
                />
                <span
                  className="text-[10px] font-semibold leading-none transition-colors"
                  style={{ color: moreIsActive ? accentHex : '#94a3b8' }}
                >
                  More
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </nav>,
    document.body
  );
}

function CommunityMoreSheet({ navConfig, activeTab, tabsWithCounts, onTabChange, onClose, accentHex }) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-[15px] font-black text-slate-900">More</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 rotate-[-90deg]" />
          </button>
        </div>
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
          {navConfig.more.map((tabKey) => {
            const TabIcon = TAB_ICON_MAP[tabKey] || Home;
            const isActive = activeTab === tabKey;
            const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
            return (
              <button
                key={tabKey}
                onClick={() => onTabChange(tabKey)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95"
                style={
                  isActive
                    ? { background: `${accentHex}15`, borderColor: `${accentHex}40` }
                    : { background: '#f8fafc', borderColor: '#e2e8f0' }
                }
              >
                <div className="relative">
                  <TabIcon
                    className="w-6 h-6"
                    style={{ color: isActive ? accentHex : '#64748b' }}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  {tabInfo?.count > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center px-0.5">
                      {tabInfo.count > 99 ? '99+' : tabInfo.count}
                    </span>
                  )}
                </div>
                <span
                  className="text-[11px] font-bold leading-none text-center"
                  style={{ color: isActive ? accentHex : '#64748b' }}
                >
                  {tabInfo?.label || getCommunityTabLabel(tabKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
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

  // Post mode (default): collapsed pill → expands on tap
  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all ${expanded ? 'border-blue-200' : 'border-slate-100'}`}>
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
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
              <MessageCircle className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-black text-slate-950">{typeConfig.primaryCta}</p>
            <button type="button" onClick={() => { setExpanded(false); setComposeText(''); }} className="ml-auto text-[12px] font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <textarea
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            rows={3}
            autoFocus
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
      )}
    </div>
  );
}

const POST_LAUNCH_DISMISS_KEY = (id) => `post_launch_dismissed_${id}`;

function isAnn(post) {
  return String(post.type || post.post_type || post.category || '').toLowerCase() === 'announcement';
}

function RightNowBanner({ posts, events, activeNeeds, resources, typeConfig, lastVisitedAt, onTabChange }) {
  const since = lastVisitedAt ? new Date(lastVisitedAt) : null;
  const newAnn = since ? posts.filter((p) => isAnn(p) && new Date(p.created_at || p.created_date) > since).length : 0;
  const newPosts = since ? posts.filter((p) => !isAnn(p) && new Date(p.created_at || p.created_date) > since).length : 0;
  const newEvents = since ? events.filter((e) => new Date(e.created_at) > since).length : 0;
  const totalNew = newAnn + newPosts + newEvents;

  if (totalNew > 0) {
    const primaryCount = newAnn > 0 ? newAnn : newPosts > 0 ? newPosts : newEvents;
    const primaryLabel = newAnn > 0
      ? `${newAnn} new ${newAnn === 1 ? 'announcement' : 'announcements'}`
      : newPosts > 0
        ? `${newPosts} new ${newPosts === 1 ? 'post' : 'posts'}`
        : `${newEvents} new ${newEvents === 1 ? 'event' : 'events'}`;
    const action = () => onTabChange(newAnn > 0 ? 'announcements' : newPosts > 0 ? 'posts' : 'events');
    const extra = totalNew - primaryCount;
    return (
      <button
        type="button"
        onClick={action}
        className="w-full flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 text-left active:opacity-80 transition-opacity"
      >
        <Sparkles className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        <span className="flex-1 text-[13px] font-bold text-slate-800">{primaryLabel}</span>
        {extra > 0 && (
          <span className="text-[11px] font-black text-blue-600 flex-shrink-0">+{extra} more</span>
        )}
        <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
      </button>
    );
  }

  // Fall back to the single most important community item
  const typeKey = typeConfig?.key || 'general';
  const pinnedAnn = posts.find((p) => p.is_pinned && isAnn(p)) || posts.find(isAnn);
  const upcomingEvent = events
    .filter((e) => new Date(e.start_date || e.event_date) >= new Date())
    .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date))[0];
  const urgentNeed = typeKey === 'chesed' ? activeNeeds[0] : null;
  const featuredResource = resources.find((r) => r.is_pinned) || resources[0];

  let item = null;
  if (urgentNeed) {
    item = { icon: '🙏', label: 'Open need', text: urgentNeed.title || 'Community chesed request', action: () => onTabChange('openNeeds'), colorClass: 'border-emerald-100 bg-emerald-50/80', labelClass: 'text-emerald-700' };
  } else if (pinnedAnn) {
    const raw = pinnedAnn.content || pinnedAnn.body || pinnedAnn.title || '';
    item = { icon: '📢', label: 'Latest update', text: raw.length > 80 ? `${raw.slice(0, 80)}…` : raw, action: () => onTabChange('announcements'), colorClass: 'border-amber-100 bg-amber-50/80', labelClass: 'text-amber-700' };
  } else if (upcomingEvent) {
    item = { icon: '📅', label: 'Coming up', text: upcomingEvent.title || upcomingEvent.name || '', action: () => onTabChange('events'), colorClass: 'border-blue-100 bg-blue-50/80', labelClass: 'text-blue-700' };
  } else if (featuredResource) {
    item = { icon: '📎', label: 'Resource', text: featuredResource.title || '', action: () => onTabChange('resources'), colorClass: 'border-violet-100 bg-violet-50/80', labelClass: 'text-violet-700' };
  }

  if (!item) return null;

  return (
    <button
      type="button"
      onClick={item.action}
      className={`w-full flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left active:opacity-80 transition-opacity ${item.colorClass}`}
    >
      <span className="text-sm leading-none flex-shrink-0">{item.icon}</span>
      <div className="min-w-0 flex-1">
        <span className={`block text-[10px] font-black uppercase tracking-wide ${item.labelClass}`}>{item.label}</span>
        <span className="block text-[13px] font-bold text-slate-900 leading-snug mt-0.5 line-clamp-1">{item.text}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
    </button>
  );
}

function VisitorLanding({ community, typeConfig, posts, events, resources, members, onFollow, onTabChange }) {
  const description = community?.settings?.welcome_message
    || community?.welcome_message
    || community?.description_long
    || community?.description
    || typeConfig.cardFallback;
  const memberCount = Math.max(members.length, community?.follower_count || 0);
  const pinnedPost = posts.find((p) => p.is_pinned) || posts.find(isAnn);
  const upcomingEvent = events
    .filter((e) => new Date(e.start_date || e.event_date) >= new Date())
    .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date))[0];
  const featuredResource = resources.find((r) => r.is_pinned) || resources[0];
  const hasFeatured = pinnedPost || upcomingEvent || featuredResource;
  const previewPosts = posts.slice(0, 2);
  const lockedCount = Math.max(0, posts.length - previewPosts.length);
  const Icon = typeConfig.icon;

  return (
    <div className="space-y-3 pt-3">
      {/* Value proposition + join CTA */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">{typeConfig.label}</span>
            {memberCount > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[12px] font-bold text-slate-500">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {memberCount.toLocaleString()}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[14px] font-semibold text-slate-700 leading-relaxed mb-5">{description}</p>
          )}
          <button
            type="button"
            onClick={onFollow}
            className={`w-full h-11 rounded-2xl bg-gradient-to-r ${typeConfig.accent} text-white font-black text-[15px] active:scale-[0.98] transition-all shadow-sm`}
          >
            Join {community.name}
          </button>
        </div>
      </div>

      {/* Featured pinned post / next event / top resource */}
      {hasFeatured && (
        <CommunityFeaturedSection
          typeConfig={typeConfig}
          posts={posts}
          events={events}
          resources={resources}
          onTabChange={onTabChange}
        />
      )}

      {/* Preview posts with join gate */}
      {previewPosts.length > 0 && (
        <div>
          <p className="app-section-label px-1 mb-2">
            Community posts
          </p>
          <div className="space-y-2.5">
            {previewPosts.map((post) => (
              <CommunityPostPreview key={post.id} post={post} typeConfig={typeConfig} />
            ))}
          </div>
          {lockedCount > 0 && (
            <div className="mt-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 px-5 py-6 text-center">
              <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
                <Lock className="h-5 w-5" />
              </div>
              <p className="text-[15px] font-black text-slate-900 mb-1">
                {lockedCount} more {lockedCount === 1 ? 'post' : 'posts'} in this community
              </p>
              <p className="text-[12px] font-semibold text-slate-500 mb-4">
                Join to read, reply, and participate
              </p>
              <button
                type="button"
                onClick={onFollow}
                className={`h-10 px-6 rounded-full bg-gradient-to-r ${typeConfig.accent} text-white font-black text-[13px] active:scale-95 transition-all`}
              >
                Join for free
              </button>
            </div>
          )}
        </div>
      )}

      {/* Brand-new community — no posts yet */}
      {posts.length === 0 && (
        <div className="app-empty-state">
          <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="app-empty-state-title mb-1">{typeConfig.emptyTitle || 'Be the first to join'}</p>
          <p className="app-empty-state-body">{typeConfig.tagline}</p>
        </div>
      )}
    </div>
  );
}

function FeaturedLaunchpadCard({ tabKey, typeConfig, onTabChange, cardData }) {
  const Icon = TAB_ICON_MAP[tabKey] || Hash;
  const label = getCommunityTabLabel(tabKey);
  return (
    <button
      type="button"
      onClick={() => onTabChange(tabKey)}
      className="w-full flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm active:scale-[0.98] active:bg-slate-50 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-black text-slate-900 leading-tight">{label}</p>
          {cardData.stat && (
            <p className="text-[12px] font-bold text-blue-600 mt-0.5">{cardData.stat}</p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
      </div>
      {cardData.preview && (
        <p className="text-[13px] text-slate-600 leading-snug line-clamp-2 pl-[52px]">{cardData.preview}</p>
      )}
      {cardData.empty && !cardData.preview && (
        <p className="text-[12px] text-slate-400 leading-snug pl-[52px]">{cardData.emptyCta}</p>
      )}
    </button>
  );
}

function SecondaryLaunchpadCard({ tabKey, typeConfig, onTabChange, cardData }) {
  const Icon = TAB_ICON_MAP[tabKey] || Hash;
  const label = getCommunityTabLabel(tabKey);
  const desc = LAUNCHPAD_TAB_DESC[tabKey] || '';
  const hasData = cardData.stat || cardData.preview;
  const subtext = hasData ? (cardData.stat || cardData.preview) : (cardData.empty ? cardData.emptyCta : desc);
  const subtextClass = cardData.stat && !cardData.empty ? 'text-blue-600 font-bold' : 'text-slate-500';
  return (
    <button
      type="button"
      onClick={() => onTabChange(tabKey)}
      className="flex flex-col items-start gap-2 rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm active:scale-[0.97] active:bg-slate-50 transition-all"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white flex-shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 w-full">
        <p className="text-[13px] font-black text-slate-900 leading-tight">{label}</p>
        {subtext && (
          <p className={`mt-0.5 text-[11px] leading-snug line-clamp-2 ${subtextClass}`}>{subtext}</p>
        )}
      </div>
    </button>
  );
}

function CommunityHomeLaunchpad({
  community, typeConfig, posts, activeNeeds, events, resources, members,
  isAdmin, lastVisitedAt, currentUser, onTabChange, openAdminCenter, onManage,
  onOpenEvent, visibleTabs,
}) {
  const layoutSettings = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.layout || {}) : {};
  const hiddenSections = new Set(layoutSettings.hiddenSections || []);

  const cardTabs = visibleTabs.filter((t) => t !== 'home');
  const memberCount = Math.max(members.length, community?.follower_count || 0);
  const featuredTab = getFeaturedTab(typeConfig, cardTabs);
  const secondaryTabs = cardTabs.filter((t) => t !== featuredTab);
  const featuredCardData = getCardData(featuredTab, { posts, events, activeNeeds, resources, memberCount });

  return (
    <div className="space-y-3">
      {/* Right Now compact banner */}
      {!hiddenSections.has('rightNow') && (
        <RightNowBanner
          posts={posts}
          events={events}
          activeNeeds={activeNeeds}
          resources={resources}
          typeConfig={typeConfig}
          lastVisitedAt={lastVisitedAt}
          onTabChange={onTabChange}
        />
      )}

      {/* Featured full-width card — community's primary section */}
      {featuredTab && (
        <FeaturedLaunchpadCard
          tabKey={featuredTab}
          typeConfig={typeConfig}
          onTabChange={onTabChange}
          cardData={featuredCardData}
        />
      )}

      {/* Secondary 2-column grid */}
      {secondaryTabs.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {secondaryTabs.map((tab) => (
            <SecondaryLaunchpadCard
              key={tab}
              tabKey={tab}
              typeConfig={typeConfig}
              onTabChange={onTabChange}
              cardData={getCardData(tab, { posts, events, activeNeeds, resources, memberCount })}
            />
          ))}
        </div>
      )}

      {/* Admin tools */}
      {isAdmin && !hiddenSections.has('adminTools') && (
        <CommunityAdminQuickActions
          onAnnouncement={() => onTabChange('announcements')}
          onEvent={() => onTabChange('events')}
          onResource={() => onTabChange('resources')}
          onAdminCenter={() => openAdminCenter?.('overview') ?? onManage?.()}
        />
      )}

      {/* Personalization hub — user's RSVPs and chesed items */}
      {!hiddenSections.has('personalization') && (
        <CommunityPersonalizationHub
          communityId={community.id}
          currentUser={currentUser}
          events={events}
          typeConfig={typeConfig}
          onTabChange={onTabChange}
          onOpenEvent={onOpenEvent}
        />
      )}
    </div>
  );
}

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
  onFollow,
  onManage,
  openAdminCenter,
  onOpenEvent,
  visibleTabs,
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
    return (
      <VisitorLanding
        community={community}
        typeConfig={typeConfig}
        posts={posts}
        events={events}
        resources={resources}
        members={members}
        onFollow={onFollow}
        onTabChange={onTabChange}
      />
    );
  }

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
      <CommunityHomeLaunchpad
        community={community}
        typeConfig={typeConfig}
        posts={posts}
        activeNeeds={activeNeeds}
        events={events}
        resources={resources}
        members={members}
        isAdmin={isAdmin}
        lastVisitedAt={lastVisitedAt}
        currentUser={currentUser}
        onTabChange={onTabChange}
        openAdminCenter={openAdminCenter}
        onManage={onManage}
        onOpenEvent={onOpenEvent}
        visibleTabs={visibleTabs}
      />
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
    <div className="app-empty-state">
      {Icon && (
        <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.accent} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="app-empty-state-title">{title}</p>
      <p className="app-empty-state-body mt-1">{body}</p>
    </div>
  );
}

function HomeFeedSection({ posts, typeConfig, activeNeeds = [], onTabChange }) {
  if (!posts.length && !activeNeeds.length) {
    return <CompactEmptyState typeConfig={typeConfig} tabKey="home" />;
  }

  return (
    <div className="space-y-2.5">
      <p className="app-section-label px-0.5">Latest</p>
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
