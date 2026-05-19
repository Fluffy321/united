import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  EyeOff,
  Lock,
  MapPin,
  MessageCircle,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dataService } from '@/services';
import { supabase } from '@/api/supabaseClient';
import { getCommunityTabLabel, getCommunityTypeConfig, getSupportedCommunityTabs } from '@/lib/communityTypes';
import {
  canUseCommunityChat,
  canUseCommunityEvents,
  canUseCommunityMarketplace,
  canUseCommunityResources,
} from '@/lib/communityPlans';
import CommunityAdminCenter from './CommunityAdminCenter';
import { useSwipeableTabs } from '@/hooks/useSwipeableTabs';
import CommunityEventsTab from './CommunityEventsTab';
import CommunityGroupsTab from './CommunityGroupsTab';
import CommunityResourceLibrary from './CommunityResourceLibrary';
import GroupChatSection from './GroupChatSection';
import {
  CommunityAdminQuickActions,
  CommunityFeaturedSection,
  CommunityMemberDirectory,
  CommunityPostPreview,
  CommunityWelcomeHub,
} from './CommunityOperatingSystem';
import CommunityPersonalizationHub from './CommunityPersonalizationHub';

function getPostTypeForTab(activeTab, typeKey) {
  if (activeTab === 'announcements') return 'announcement';
  if (activeTab === 'questions' || typeKey === 'parents') return 'question';
  if (activeTab === 'discussions' || typeKey === 'learning') return 'discussion';
  if (typeKey === 'chesed') return 'chesed';
  return 'post';
}

function matchesPostFilter(post, filter) {
  if (!filter) return true;
  const type = String(post.type || post.post_type || post.category || '').toLowerCase();
  const text = `${post.title || ''} ${post.body || ''} ${post.content || ''}`.toLowerCase();
  if (filter === 'question') return ['question', 'ask'].includes(type) || text.includes('?');
  if (filter === 'discussion') return ['discussion', 'learning'].includes(type);
  if (filter === 'announcement') return ['announcement', 'pinned'].includes(type);
  return type === filter;
}

export default function CommunityHubDetail({
  community,
  currentUser,
  initialComposePrompt = '',
  onInitialComposeConsumed,
  initialTab = 'home',
  onBack,
  onToggleJoin,
  onTabChange,
  joiningId,
}) {
  const typeConfig = getCommunityTypeConfig(community);
  const Icon = typeConfig.icon;
  const tabs = getSupportedCommunityTabs(community, {
    events: canUseCommunityEvents(community),
    resources: canUseCommunityResources(community),
    chat: Boolean(canUseCommunityChat(community) && community?.allow_group_chat),
    listings: Boolean(canUseCommunityMarketplace(community) && community?.allow_member_listings),
    groups: true,
  });
  const [activeTab, setActiveTab] = useState(tabs.includes(initialTab) ? initialTab : (tabs[0] || 'home'));
  const [highlightEventId, setHighlightEventId] = useState(null);
  const [composeText, setComposeText] = useState('');
  const [composePlaceholder, setComposePlaceholder] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(
    Boolean(community.supportsAnonymousPosting && (community.joinedIncognito || community.hideMembership))
  );
  const [showAdminCenter, setShowAdminCenter] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState('overview');
  const queryClient = useQueryClient();
  const accent = typeConfig.accent;
  const prompts = community.quickActions || typeConfig.prompts;
  const isJoining = joiningId === community.id;
  const isSensitive = community.communityType === 'support' || typeConfig.key === 'chesed';
  const isSeedCommunity = String(community.id || '').startsWith('seed-');
  const isDailyTorahCommunity = community.id === 'seed-daily-torah';

  const { data: membershipRecord = [] } = useQuery({
    queryKey: ['community-hub-membership', community.id, currentUser?.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: community.id, user_id: currentUser.id }),
    enabled: Boolean(currentUser?.id && community.id) && !isSeedCommunity,
    staleTime: 30000,
  });

  const membershipRole = String(membershipRecord[0]?.role || '').toLowerCase();
  const isCreator = Boolean(currentUser?.id && community.created_by_user_id === currentUser.id);
  const isCommunityManager = Boolean(
    isCreator
    || currentUser?.role === 'admin'
    || ['owner', 'admin', 'moderator'].includes(membershipRole)
  );
  const isJoined = Boolean(community.joined || membershipRecord.length > 0 || isCreator);

  const setTab = (tab) => {
    const nextTab = tabs.includes(tab) ? tab : (tabs[0] || 'home');
    setActiveTab(nextTab);
    onTabChange?.(nextTab);
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

  const swipeHandlers = useSwipeableTabs({ tabs, activeTab, onTabChange: setTab });

  useEffect(() => {
    if (!initialComposePrompt) return;
    setComposeText('');
    setComposePlaceholder(initialComposePrompt);
    setShowCompose(true);
    onInitialComposeConsumed?.();
  }, [initialComposePrompt, community.id, onInitialComposeConsumed]);

  useEffect(() => {
    setPostAnonymously(Boolean(community.supportsAnonymousPosting && (community.joinedIncognito || community.hideMembership)));
  }, [community.id, community.hideMembership, community.joinedIncognito, community.supportsAnonymousPosting]);

  useEffect(() => {
    if (!tabs.includes(activeTab)) setTab(tabs[0] || 'home');
  }, [activeTab, tabs]);

  useEffect(() => {
    if (initialTab && tabs.includes(initialTab) && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [activeTab, initialTab, tabs]);

  const { data: realPosts = [] } = useQuery({
    queryKey: ['community-hub-posts', community.id],
    queryFn: () => dataService.entities.UnifiedPost.filter({ community_id: community.id }, '-created_date', 50),
    enabled: Boolean(community.id) && (!isSeedCommunity || isDailyTorahCommunity),
    staleTime: 30000,
  });

  useEffect(() => {
    if (!isDailyTorahCommunity) return;
    let cancelled = false;
    dataService.functions.invoke('publishDailyTorah', { communityId: community.id })
      .then(() => {
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: ['community-hub-posts', community.id] });
        }
      })
      .catch((error) => {
        console.warn('Daily Torah publisher unavailable:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [community.id, isDailyTorahCommunity, queryClient]);

  const { data: openNeeds = [] } = useQuery({
    queryKey: ['community-hub-open-needs', community.id],
    queryFn: () => dataService.entities.MitzvahRequest.filter({ community_id: community.id }, '-created_date', 30),
    enabled: Boolean(community.id) && !isSeedCommunity && typeConfig.key === 'chesed',
    staleTime: 30000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['community-hub-events', community.id],
    queryFn: () => dataService.entities.CommunityEvent.filter({ community_id: community.id }, 'start_date', 50),
    enabled: Boolean(community.id) && !isSeedCommunity,
    staleTime: 30000,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['community-hub-resources', community.id],
    queryFn: () => dataService.entities.CommunityResource.filter({ community_id: community.id }, '-created_date', 50),
    enabled: Boolean(community.id) && !isSeedCommunity && canUseCommunityResources(community),
    staleTime: 30000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community-hub-members', community.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: community.id }, '-created_date', 100),
    enabled: Boolean(community.id) && !isSeedCommunity,
    staleTime: 30000,
  });

  const { data: lastVisit = null } = useQuery({
    queryKey: ['community-last-visit', community.id, currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_last_visits')
        .select('visited_at')
        .eq('user_id', currentUser.id)
        .eq('community_id', community.id)
        .maybeSingle();
      return data;
    },
    enabled: Boolean(currentUser?.id && community.id && isJoined && !isSeedCommunity),
    staleTime: 60000,
  });

  const visitTimerRef = useRef(null);
  useEffect(() => {
    if (!currentUser?.id || !community.id || !isJoined || isSeedCommunity) return;
    visitTimerRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('community_last_visits')
          .upsert(
            { user_id: currentUser.id, community_id: community.id, visited_at: new Date().toISOString() },
            { onConflict: 'user_id,community_id' }
          );
      } catch {} // fire-and-forget
    }, 4000);
    return () => clearTimeout(visitTimerRef.current);
  }, [community.id, currentUser?.id, isJoined, isSeedCommunity]);

  const visiblePosts = useMemo(() => {
    if (realPosts.length > 0) return realPosts;
    return isSeedCommunity ? (community.posts || []) : [];
  }, [community.posts, isSeedCommunity, realPosts]);

  const openCompose = (prefill = '') => {
    setComposeText('');
    setComposePlaceholder(prefill || typeConfig.prompts[0] || 'Share something with the community...');
    setShowCompose(true);
  };

  const submitPost = async () => {
    const text = composeText.trim();
    if (!text) return;
    if (!currentUser) {
      dataService.auth.redirectToLogin();
      return;
    }
    if (isSeedCommunity) {
      toast.info('Preview communities show sample content only. Open a real community to post.');
      setComposePlaceholder('');
      setShowCompose(false);
      return;
    }
    if (activeTab === 'announcements' && !isCommunityManager) {
      toast.error('Only community managers can post official announcements.');
      return;
    }

    try {
      await dataService.entities.UnifiedPost.create({
        user_id: currentUser.id,
        community_id: community.id,
        type: getPostTypeForTab(activeTab, typeConfig.key),
        title: text.length > 72 ? text.slice(0, 72) : undefined,
        content: text,
        is_anonymous: Boolean(community.supportsAnonymousPosting && postAnonymously),
      });
      await queryClient.invalidateQueries({ queryKey: ['community-hub-posts', community.id] });
      setComposeText('');
      setComposePlaceholder('');
      setShowCompose(false);
      toast.success('Posted');
    } catch {
      toast.error('Could not post right now');
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 pb-8 sm:px-4 sm:pt-4">
        <button
          onClick={onBack}
          className="mb-3 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Communities
        </button>

        {/* Header card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Cover / gradient banner — compact for joined members */}
          <div
            className={`relative bg-gradient-to-br ${accent} ${isJoined ? 'h-14' : 'h-24'}`}
            style={
              community.cover_url
                ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: typeConfig.coverPattern }
            }
          >
            {community.cover_url && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />}
            {!community.cover_url && (
              <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
                <Icon className="h-6 w-6" />
              </div>
            )}
            {/* Avatar overlapping banner */}
            <div
              className={`absolute -bottom-5 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-[14px] font-black text-white shadow-md ring-2 ring-white`}
            >
              {community.logo_url ? (
                <img src={community.logo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <Icon className="h-6 w-6" />
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black leading-tight text-slate-950">{community.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {community.category && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${typeConfig.badgeClass}`}>
                    <Icon className="h-3 w-3" />
                    {typeConfig.label}
                  </span>
                )}
                {community.location && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="h-3 w-3" />
                    {community.location}
                  </span>
                )}
                {community.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    <BadgeCheck className="h-3 w-3" />
                    Official
                  </span>
                )}
                {community.trending && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                if (isCreator) {
                  openAdminCenter('overview');
                  return;
                }
                onToggleJoin?.(isSensitive ? { incognito: true } : {});
              }}
              disabled={isJoining}
              className={`h-10 shrink-0 rounded-xl px-4 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 ${
                isCreator
                  ? 'bg-slate-950 text-white hover:bg-slate-800'
                  : isJoined
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isJoining ? '...' : isCreator ? 'Admin Center' : isJoined ? 'Leave' : isSensitive ? 'Join Incognito' : 'Join'}
            </button>
          </div>

          {!isJoined && (
            <div className="px-4 pb-4">
              <p className="text-sm font-semibold leading-relaxed text-slate-600">
                {community.valueHook || community.description || typeConfig.cardFallback}
              </p>
              {community.description && community.valueHook && (
                <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-500">{community.description}</p>
              )}
              <div className={`mt-3 rounded-2xl border px-3 py-2 ${typeConfig.softClass}`}>
                <p className="text-[11px] font-black uppercase tracking-wide opacity-80">This space is for</p>
                <p className="mt-0.5 text-[13px] font-bold leading-5 text-slate-800">{typeConfig.tagline}</p>
              </div>
            </div>
          )}

          {/* Stats bar */}
          <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-3 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              {(community.memberCount || 0).toLocaleString()} members
            </span>
            {community.postsToday > 0 && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600">
                <TrendingUp className="h-3.5 w-3.5" />
                {community.postsToday} posts today
              </span>
            )}
            {community.joined && !isCreator && !isCommunityManager && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                <Shield className="h-3.5 w-3.5" />
                You're a member
              </span>
            )}
              {isCommunityManager && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                {isCreator ? 'Owner' : 'Admin'}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              {community.privacy || 'Public'}
            </span>
          </div>

          {/* Tabs — pill style */}
          <div className="mobile-scroll-x flex gap-1 border-t border-slate-100 px-2 py-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                ref={(el) => { tabButtonRefs.current[tab] = el; }}
                onClick={() => setTab(tab)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-bold transition ${
                  activeTab === tab
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {getCommunityTabLabel(tab)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content — swipeable */}
        <div className="mt-3" {...swipeHandlers}>
          {activeTab === 'home' && (
            <HomeTab
              community={community}
              typeConfig={typeConfig}
              posts={visiblePosts}
              openNeeds={openNeeds}
              events={events}
              resources={resources}
              members={members}
              prompts={prompts}
              onCompose={openCompose}
              onTabChange={setTab}
              isCommunityManager={isCommunityManager}
              onManage={() => openAdminCenter('content')}
              isJoined={isJoined}
              lastVisitedAt={lastVisit?.visited_at}
              currentUser={currentUser}
              onOpenEvent={(event) => { setHighlightEventId(event.id); setTab('events'); }}
            />
          )}
          {activeTab === 'openNeeds' && (
            <OpenNeedsTab openNeeds={openNeeds} typeConfig={typeConfig} onCompose={openCompose} />
          )}
          {activeTab === 'questions' && (
            <PostsTab community={community} typeConfig={typeConfig} prompts={prompts} posts={visiblePosts} onCompose={openCompose} filter="question" />
          )}
          {activeTab === 'discussions' && (
            <PostsTab community={community} typeConfig={typeConfig} prompts={prompts} posts={visiblePosts} onCompose={openCompose} filter="discussion" />
          )}
          {activeTab === 'announcements' && (
            <PostsTab
              community={community}
              typeConfig={typeConfig}
              prompts={prompts}
              posts={visiblePosts}
              onCompose={openCompose}
              filter="announcement"
              canCompose={isCommunityManager}
            />
          )}
          {activeTab === 'posts' && (
            <PostsTab community={community} typeConfig={typeConfig} prompts={prompts} posts={visiblePosts} onCompose={openCompose} canCompose />
          )}
          {activeTab === 'about' && (
            <AboutTab community={community} typeConfig={typeConfig} />
          )}
          {activeTab === 'members' && (
            <CommunityMemberDirectory
              community={community}
              members={members}
              memberCount={community.memberCount || members.length || 0}
            />
          )}
          {activeTab === 'events' && (
            <CommunityEventsTab
              events={events}
              community={community}
              currentUser={currentUser}
              communityId={community.id}
              isAdmin={isCommunityManager}
              highlightEventId={highlightEventId}
            />
          )}
          {activeTab === 'resources' && (
            <CommunityResourceLibrary
              communityId={community.id}
              community={community}
              currentUser={currentUser}
              isAdmin={isCommunityManager}
            />
          )}
          {activeTab === 'groups' && (
            <CommunityGroupsTab
              communityId={community.id}
              currentUser={currentUser}
              isAdmin={isCommunityManager}
            />
          )}
          {activeTab === 'chat' && (
            <div className="mt-3 h-[60vh] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <GroupChatSection communityId={community.id} currentUser={currentUser} />
            </div>
          )}
        </div>
      </section>

      {isCommunityManager && (
        <div className="fixed bottom-24 right-4 z-40 sm:hidden">
          <button
            onClick={() => setShowAdminCenter(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl shadow-slate-950/25"
            aria-label="Admin center"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      )}

      {showCompose && (
        <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/40 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{typeConfig.primaryCta} in {community.name}</h3>
              <button
                onClick={() => {
                  setShowCompose(false);
                  setComposePlaceholder('');
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              autoFocus
              rows={4}
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              placeholder={composePlaceholder || typeConfig.prompts[0] || 'Share something with the community...'}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-colors placeholder:text-slate-400"
            />
            {community.supportsAnonymousPosting && (
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={postAnonymously}
                  onChange={(event) => setPostAnonymously(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[13px] font-black text-violet-800">
                    <EyeOff className="h-4 w-4" />
                    Post anonymously
                  </span>
                  <span className="mt-0.5 block text-[12px] font-semibold leading-5 text-violet-700">
                    Your name stays off this post inside the community.
                  </span>
                </span>
              </label>
            )}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowCompose(false);
                  setComposePlaceholder('');
                }}
                className="h-9 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPost}
                disabled={!composeText.trim()}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-40 active:scale-[0.98]"
              >
                <Send className="h-3.5 w-3.5" />
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      <CommunityAdminCenter
        community={community}
        currentUser={currentUser}
        open={showAdminCenter}
        onClose={() => setShowAdminCenter(false)}
        onCommunityUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['communities-list'] });
          queryClient.invalidateQueries({ queryKey: ['community-hub-membership', community.id, currentUser?.id] });
          queryClient.invalidateQueries({ queryKey: ['community-hub-posts', community.id] });
          queryClient.invalidateQueries({ queryKey: ['community-hub-members', community.id] });
          queryClient.invalidateQueries({ queryKey: ['community-hub-resources', community.id] });
        }}
        initialTab={adminInitialTab}
        onDeleted={() => {
          setShowAdminCenter(false);
          onBack?.();
        }}
      />
    </main>
  );
}

function HomeTab({
  community,
  typeConfig,
  posts,
  openNeeds,
  events,
  resources,
  members,
  prompts,
  onCompose,
  onTabChange,
  isCommunityManager,
  onManage,
  isJoined,
  lastVisitedAt,
  currentUser,
  onOpenEvent,
}) {
  const featuredPosts = posts.slice(0, 3);

  if (!isJoined) {
    // ── Visitor landing page ─────────────────────────────────────────────────
    return (
      <div className="space-y-3">
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
          onCompose={onCompose}
        />
        <CommunityFeaturedSection
          typeConfig={typeConfig}
          posts={posts}
          events={events}
          resources={resources}
          onTabChange={onTabChange}
        />
        <PostsTab
          community={community}
          typeConfig={typeConfig}
          prompts={prompts}
          posts={featuredPosts}
          onCompose={onCompose}
          canCompose={false}
          compact
        />
      </div>
    );
  }

  // ── Joined member: community dashboard ──────────────────────────────────────
  return (
    <div className="space-y-3">
      {isCommunityManager && (
        <CommunityAdminQuickActions
          onAnnouncement={() => { onTabChange('announcements'); onCompose(''); }}
          onEvent={() => onTabChange('events')}
          onResource={() => onTabChange('resources')}
          onAdminCenter={onManage}
        />
      )}

      <CommunityWelcomeHub
        community={community}
        typeConfig={typeConfig}
        posts={posts}
        events={events}
        resources={resources}
        members={members}
        isCommunityManager={isCommunityManager}
        isFollowing={true}
        lastVisitedAt={lastVisitedAt}
        onTabChange={onTabChange}
        onManage={onManage}
        onCompose={onCompose}
      />

      <CommunityPersonalizationHub
        communityId={community.id}
        currentUser={currentUser}
        events={events}
        typeConfig={typeConfig}
        onTabChange={onTabChange}
        onOpenEvent={onOpenEvent}
      />

      <CommunityFeaturedSection
        typeConfig={typeConfig}
        posts={posts}
        events={events}
        resources={resources}
        onTabChange={onTabChange}
      />

      {typeConfig.key === 'chesed' && (
        <OpenNeedsPreview openNeeds={openNeeds} onTabChange={() => onTabChange('openNeeds')} />
      )}

      <PostsTab
        community={community}
        typeConfig={typeConfig}
        prompts={prompts}
        posts={featuredPosts}
        onCompose={onCompose}
        canCompose
        compact
      />
    </div>
  );
}

function OpenNeedsPreview({ openNeeds, onTabChange }) {
  const activeNeeds = (openNeeds || []).filter((need) => ['open', 'offered', 'accepted', 'in_progress'].includes(String(need.status || 'open')));

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">Open chesed needs</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">
            {activeNeeds.length > 0 ? `${activeNeeds.length} request${activeNeeds.length === 1 ? '' : 's'} connected to this community.` : 'No open needs are connected here yet.'}
          </p>
        </div>
        <button onClick={onTabChange} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
          View
        </button>
      </div>
    </div>
  );
}

function OpenNeedsTab({ openNeeds, typeConfig, onCompose }) {
  const activeNeeds = (openNeeds || []).filter((need) => ['open', 'offered', 'accepted', 'in_progress'].includes(String(need.status || 'open')));

  if (activeNeeds.length === 0) {
    return (
      <TypeEmptyState
        typeConfig={typeConfig}
        onCompose={() => onCompose(typeConfig.prompts[0] || '')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {activeNeeds.map((need) => (
        <article key={need.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{need.category || 'Chesed'}</span>
            <span className="text-[11px] font-semibold text-slate-400">{need.status || 'open'}</span>
          </div>
          <h3 className="text-[15px] font-black text-slate-950">{need.title}</h3>
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

function TypeEmptyState({ typeConfig, onCompose }) {
  const Icon = typeConfig.icon;
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.accent} text-white shadow-sm`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-black text-slate-900">{typeConfig.emptyTitle}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-500">{typeConfig.emptyBody}</p>
      <button
        onClick={onCompose}
        className={`motion-press mt-4 rounded-xl bg-gradient-to-br ${typeConfig.accent} px-4 py-2 text-xs font-black text-white`}
      >
        {typeConfig.primaryCta}
      </button>
    </div>
  );
}

function PostsTab({ community, typeConfig, prompts, posts, onCompose, filter, compact = false, canCompose = true }) {
  const isOfficial = community.communityType === 'official';
  const isPublic = (community.privacy || 'Public') === 'Public';
  const shouldHideFeed = !community.joined && !isOfficial && !isPublic;
  const filteredPosts = (posts || []).filter((post) => matchesPostFilter(post, filter));

  if (shouldHideFeed) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <MessageCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
        <h3 className="text-base font-bold text-slate-800">Join to see posts</h3>
        <p className="mt-1 text-sm text-slate-500">Members can post, comment, and participate in this community.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!community.joined && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
          {isOfficial
            ? 'Official feed is open to read. Join to personalize replies, saves, and follow-up activity.'
            : 'This public feed is open to read. Join to participate and keep it in your identity stack.'}
        </div>
      )}

      {canCompose ? (
        <>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-blue-700">
              <Sparkles className="h-4 w-4" />
              Suggested prompt
            </div>
            <h3 className="mt-2 text-lg font-black leading-6 text-slate-950">
              {community.dailyPrompt || prompts[0] || typeConfig.primaryCta}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <button
              onClick={() => onCompose('')}
              className="flex w-full items-center gap-3 pb-4 border-b border-slate-100 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MessageCircle className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-slate-400">{typeConfig.primaryCta}...</p>
            </button>
            <div className="mt-4 space-y-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onCompose(prompt)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-[13px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 active:scale-[0.99]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-black text-amber-950">Official announcements are manager-only</p>
          <p className="mt-1 text-[13px] font-semibold leading-5 text-amber-700">
            Members can read community announcements here. Owners, admins, and moderators can create them from the Admin Center.
          </p>
        </div>
      )}

      {(community.announcements?.length > 0 || community.updates?.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {community.announcements?.length > 0 && (
            <InfoPanel title="Pinned updates" items={community.announcements} />
          )}
          {community.updates?.length > 0 && (
            <InfoPanel title="Live pulse" items={community.updates} />
          )}
        </div>
      )}

      {filteredPosts.map((seedPost) => (
        <div key={seedPost.id}>
          <CommunityPostPreview post={seedPost} typeConfig={typeConfig} />
          {(seedPost.source_url || seedPost.link_url || seedPost.url) && (
            <a
              href={seedPost.source_url || seedPost.link_url || seedPost.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
            >
              Open source
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ))}

      {filteredPosts.length === 0 && !compact && (
        <TypeEmptyState typeConfig={typeConfig} onCompose={() => onCompose(prompts[0] || '')} />
      )}
    </div>
  );
}

function AboutTab({ community, typeConfig }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-black text-slate-900">About this {typeConfig.label.toLowerCase()}</h3>
        <p className="text-sm leading-relaxed text-slate-600">{community.description || typeConfig.cardFallback}</p>
      </div>

      {community.resources?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-black text-slate-900">Useful resources</h3>
          <div className="flex flex-wrap gap-2">
            {community.resources.map((resource) => (
              <span key={resource} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                {resource}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-slate-900">Details</h3>
        <div className="space-y-2.5">
          {community.category && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Type</span>
              <span className="font-semibold text-slate-700">{typeConfig.label}</span>
            </div>
          )}
          {community.location && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Location</span>
              <span className="font-semibold text-slate-700">{community.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Privacy</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              {community.privacy || 'Public'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Identity</span>
            <span className="font-semibold text-slate-700">{community.communityType || 'user-created'}</span>
          </div>
          {community.supportsAnonymousPosting && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Anon</span>
              <span className="inline-flex items-center gap-1 font-semibold text-violet-700">
                <EyeOff className="h-3.5 w-3.5" />
                Anonymous posting enabled
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">Members</span>
            <span className="font-semibold text-slate-700">{(community.memberCount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ title, items }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-black text-slate-900">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-[13px] font-semibold leading-5 text-slate-700">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
