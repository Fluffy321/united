import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dataService, feedRetentionService, shabbatReminderService, togglePostLike } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { appParams } from '@/lib/app-params';
import { COMMUNITIES_ENABLED } from '@/config/features';
import { toast } from 'sonner';
import NotificationBell from '@/components/notifications/NotificationBell';
import { CalendarDays, Heart, MessageCircle, RefreshCw, Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LOCAL_NETWORKS } from '@/lib/localNetworks';
import DestinationHeader from '@/components/layout/DestinationHeader';
import useFeedData from '@/components/feed/useFeedData';
import FeedFilters, { FeedFilterTrigger } from '@/components/feed/FeedFilters';
import FeedComposer from '@/components/feed/FeedComposer';
import MinyanBoard from '@/components/feed/MinyanBoard';
import JewishCountdown from '@/components/feed/JewishCountdown';
import UpcomingEventsSheet from '@/components/feed/UpcomingEventsSheet';
import CommentsSheet from '@/components/feed/CommentsSheet';
import CommunitiesFeedView from '@/components/feed/CommunitiesFeedView';
import FiveTownsHomeDashboard from '@/components/home/FiveTownsHomeDashboard';
import BriefCategoryLaunchpad from '@/components/feed/BriefCategoryLaunchpad';
import BriefCategorySection from '@/components/feed/BriefCategorySection';
import WidgetBoundary from '@/components/feed/WidgetBoundary';
import FeedPreferenceSetup from '@/components/feed/FeedPreferenceSetup';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import useFiveTownsDaily from '@/hooks/useFiveTownsDaily';

import { filterBlock, filterUnifiedPost, filterUserCommunity, getCommunity, getUnifiedPost } from '@/services/entityServices';
import { FEED_LOAD_TIMEOUT_MS, feedText, getPostLivePriority } from '@/lib/feed/feedRanking';
import { feedPreferenceKeys, postKeys } from '@/lib/queryKeys';
import { DEFAULT_BRIEF_CATEGORY_IDS, getBriefCategory } from '@/lib/feed/briefCategories';
import { classifyBriefCategory, rankBriefItems } from '@/lib/feed/briefRanking';
import {
  closeBriefCategoryParams,
  closeBriefParams,
  openBriefCategoryParams,
  readBriefRouteState,
} from '@/lib/feed/briefRouteState';

export default function Feed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [primaryNetwork, setPrimaryNetwork] = useState(LOCAL_NETWORKS[0]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [userLikes, setUserLikes] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const composerRef = useRef(null);
  const [showEventsSheet, setShowEventsSheet] = useState(false);
  const [showCalendarSheet, setShowCalendarSheet] = useState(false);
  const [showMinyanSheet, setShowMinyanSheet] = useState(false);
  const [replyPost, setReplyPost] = useState(null);
  useEffect(() => {
    const enabled = Boolean(currentUser)
      && currentUser?.notification_settings?.shabbatReminders !== false
      && currentUser?.app_settings?.quietMode !== true;
    shabbatReminderService.start({ enabled });
    return () => shabbatReminderService.stop();
  }, [currentUser?.id, currentUser?.notification_settings?.shabbatReminders, currentUser?.app_settings?.quietMode]);
  const [interestSignals, setInterestSignals] = useState({ types: {}, subtypes: {}, keywords: [] }); // track user interactions
  const [communityGroups, setCommunityGroups] = useState([]);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [publishedBrief, setPublishedBrief] = useState(null);
  const [feedTab, setFeedTab] = useState('general');
  const [activeBriefTab, setActiveBriefTab] = useState('updates');

  useEffect(() => {
    if (!COMMUNITIES_ENABLED && feedTab !== 'general') {
      setFeedTab('general');
    }
  }, [feedTab]);

  const openComposer = useCallback((options) => {
    composerRef.current?.open(options);
  }, []);

  useEffect(() => {
    if (!currentUser?.cityPreset) return;
    const net = LOCAL_NETWORKS.find(n => n.cityPreset === currentUser.cityPreset);
    if (net) setPrimaryNetwork(net);
  }, [currentUser?.cityPreset]);

  useEffect(() => {
    feedRetentionService.getPublishedBrief({
      network: primaryNetwork.cityPreset || 'Five Towns',
    })
      .then(setPublishedBrief)
      .catch(() => setPublishedBrief(null));
  }, [primaryNetwork.cityPreset]);

  const { posts, isLoading, refetch } = useFeedData();
  const dailyInfo = useFiveTownsDaily();
  const { isRefreshing, pullDistance } = usePullToRefresh(refetch);
  const { data: briefPreferences = null, isFetched: briefPreferencesFetched } = useQuery({
    queryKey: feedPreferenceKeys.user(currentUser?.id),
    queryFn: () => feedRetentionService.getPreferences(currentUser.id),
    enabled: Boolean(currentUser?.id && appParams.hasBackendConfig),
    staleTime: 60_000,
  });
  const { data: briefSignalEvents = [] } = useQuery({
    queryKey: feedPreferenceKeys.signals(currentUser?.id),
    queryFn: () => feedRetentionService.getCategorySignals(currentUser.id),
    enabled: Boolean(currentUser?.id && appParams.hasBackendConfig),
    staleTime: 60_000,
  });
  const {
    data: homeEvents = [],
    isLoading: homeEventsLoading,
    isError: homeEventsError,
    refetch: refetchHomeEvents,
  } = useQuery({
    queryKey: ['home-events', primaryNetwork.cityPreset || 'Five Towns'],
    queryFn: () => filterUnifiedPost({ type: 'event' }, '-event_date', 60),
    enabled: appParams.hasBackendConfig,
    staleTime: 60_000,
  });

  const { data: userCommunitiesList, isFetched: communitiesFetched } = useQuery({
    queryKey: ['user-communities', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const memberships = await filterUserCommunity({ user_id: currentUser.id });
      const ids = memberships.map(m => m.community_id).filter(Boolean);
      if (ids.length === 0) return [];
      // Fetch each community individually so a single bad/deleted ID doesn't poison the whole list
      const results = await Promise.allSettled(ids.map(id => getCommunity(id)));
      return results
        .filter(r => r.status === 'fulfilled' && r.value && typeof r.value.id === 'string')
        .map(r => r.value);
    },
    enabled: COMMUNITIES_ENABLED && !!currentUser?.id && appParams.hasBackendConfig,
  });

  const { data: userBlocksList } = useQuery({
    queryKey: ['user-blocks', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      return filterBlock({ blocker_id: currentUser.id });
    },
    enabled: !!currentUser?.id && appParams.hasBackendConfig,
  });

  useEffect(() => {
    if (!userBlocksList) return;
    setBlockedIds(userBlocksList.map(b => b.blocked_id));
  }, [userBlocksList]);

  useEffect(() => {
    if (!COMMUNITIES_ENABLED) {
      setCommunityGroups([]);
      return;
    }
    if (!userCommunitiesList) {
      setCommunityGroups([]);
      return;
    }
    setCommunityGroups(userCommunitiesList.filter(c => c));
  }, [userCommunitiesList]);

  // If the backend hangs, stop showing skeletons and let the preview/empty state render.
  useEffect(() => {
    if (!isLoading) {
      setLoadTimedOut(false);
      return undefined;
    }
    const timer = setTimeout(() => setLoadTimedOut(true), FEED_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const likeMutation = useMutation({
    mutationFn: (postId) => togglePostLike(postId, currentUser.id),
    onSuccess: ({ liked }, postId) => {
      setUserLikes(prev => liked ? [...prev, postId] : prev.filter(id => id !== postId));
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });

  const recordInterest = useCallback((post) => {
    setInterestSignals(prev => ({
      types: { ...prev.types, [post.type]: (prev.types[post.type] || 0) + 1 },
      subtypes: post.post_subtype ? { ...prev.subtypes, [post.post_subtype]: (prev.subtypes[post.post_subtype] || 0) + 1 } : prev.subtypes,
      keywords: [...prev.keywords, ...(post.body || '').toLowerCase().split(/\s+/).slice(0, 5)].slice(-50),
    }));
  }, []);

  // postsRef keeps the latest posts array accessible inside the stable handleLike callback
  // without adding `posts` to its dependency array (which would make it unstable).
  const postsRef = React.useRef(posts);
  postsRef.current = posts;

  const handleLike = useCallback((postId) => {
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    const post = postsRef.current.find(p => p.id === postId);
    if (post) recordInterest(post);
    if (!appParams.hasBackendConfig) {
      setUserLikes(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
      return;
    }
    likeMutation.mutate(postId);
  }, [currentUser, appParams, recordInterest, likeMutation]);

  useEffect(() => {
    const postId = searchParams.get('postId');
    const shouldOpenReply = searchParams.get('reply') === '1' || searchParams.get('comments') === '1';
    if (!postId || !shouldOpenReply || replyPost?.id === postId) return;

    const existingPost = postsRef.current.find(p => p.id === postId);
    if (existingPost) {
      setReplyPost(existingPost);
      return;
    }

    if (!appParams.hasBackendConfig) return;
    getUnifiedPost(postId)
      .then(post => {
        if (post) setReplyPost(post);
      })
      .catch(() => toast.error('Could not open that post'));
  }, [searchParams, replyPost?.id, appParams.hasBackendConfig]);

  const handleNetworkSelect = useCallback(async (net) => {
    setPrimaryNetwork(net);
    setSelectedNeighborhood('All');
    if (appParams.hasBackendConfig) {
      try { await dataService.auth.updateMe({ cityPreset: net.cityPreset }); } catch {}
    }
  }, [appParams]);

  const handlePreferenceSetupSave = useCallback(async (patch) => {
    const saved = await feedRetentionService.savePreferences(currentUser.id, patch);
    queryClient.setQueryData(feedPreferenceKeys.user(currentUser.id), saved);
    await queryClient.invalidateQueries({ queryKey: feedPreferenceKeys.signals(currentUser.id) });
  }, [currentUser?.id, queryClient]);

  const handlePreferenceSetupSkip = useCallback(async (patch) => {
    await handlePreferenceSetupSave(patch);
  }, [handlePreferenceSetupSave]);

  const FEED_TTL = 14 * 24 * 3_600_000; // posts older than 14 days are hidden from feed
  const visiblePosts = posts.filter(p => {
    if (p.type === 'dating') return false;
    if (p.type === 'prompt') return false;
    if (p.type === 'daily_greeting') return false;
    // Sold/closed marketplace listings leave the feed (they stay on /Marketplace with a Sold badge)
    if ((p.activity_kind === 'marketplace_listing' || p.type === 'marketplace')
      && p.listing_status && p.listing_status !== 'available') return false;
    if (blockedIds.includes(p.user_id)) return false;
    // Age gate — hide posts older than 14 days
    const ts = p.updated_date || p.created_date;
    if (ts && Date.now() - new Date(ts).getTime() > FEED_TTL) return false;
    // Sub-neighborhood filter within the selected network
    if (selectedNeighborhood !== 'All') {
      const loc = (p.location_text || p.city || '').toLowerCase();
      if (loc && !loc.includes(selectedNeighborhood.toLowerCase())) return false;
    }
    return true;
  });

  const joinedCommunityIds = useMemo(() => new Set(communityGroups.map(c => c.id)), [communityGroups]);

  const isPreferenceOverridePost = (post) => (
    post.post_subtype === 'alert'
    || post.category === 'safety'
    || post.urgency === 'emergency'
    || post.user_id === currentUser?.id
    || post.moderation_notice
    || post.is_moderation_notice
    || post.legal_notice
    || post.is_legally_required
  );

  const preferenceVisiblePosts = visiblePosts.filter((post) => {
    const categoryId = classifyBriefCategory(post);
    const hidden = briefPreferences?.category_preferences?.[categoryId] === 'hide';
    return !hidden || isPreferenceOverridePost(post);
  });

  const engagementScore = (p) => feedRetentionService.scorePost(p, {
    joinedCommunityIds,
    primaryNetwork,
    userInterests: currentUser?.interests || [],
    interestSignals,
    currentUserId: currentUser?.id,
    preferences: briefPreferences,
  });

  const feedPosts = (() => {
    const sorted = [...preferenceVisiblePosts].sort((a, b) => {
      const liveDelta = getPostLivePriority(b) - getPostLivePriority(a);
      if (liveDelta !== 0) return liveDelta;
      return engagementScore(b) - engagementScore(a);
    });

    const engagementLimit = {
      quiet: 20,
      balanced: 35,
      active: 50,
      all_in: 60,
    }[briefPreferences?.engagement_level || 'balanced'];
    return sorted.slice(0, engagementLimit);
  })();

  const dailyBrief = useMemo(() => feedRetentionService.buildBrief({
    posts: feedPosts,
    communityGroups,
    networkLabel: primaryNetwork.shortLabel || primaryNetwork.cityPreset || 'Five Towns',
    curatedBrief: publishedBrief,
  }), [communityGroups, feedPosts, primaryNetwork.cityPreset, primaryNetwork.shortLabel, publishedBrief]);

  const curatedItems = useMemo(() => (
    (dailyBrief.topLocalUpdates || []).map((item, index) => ({
      ...item,
      id: item.id || `${publishedBrief?.id || 'daily-brief'}-${index}`,
      provenance: 'editor',
      verified: true,
      created_at: publishedBrief?.updated_at || publishedBrief?.created_at,
    }))
  ), [dailyBrief.topLocalUpdates, publishedBrief?.created_at, publishedBrief?.id, publishedBrief?.updated_at]);

  const rankedBriefItems = useMemo(() => {
    return rankBriefItems({
      items: [...curatedItems, ...feedPosts],
      selectedCategoryIds: briefPreferences?.interests || DEFAULT_BRIEF_CATEGORY_IDS,
      events: briefSignalEvents,
      primaryNetwork,
      limit: curatedItems.length + feedPosts.length,
    });
  }, [briefPreferences?.interests, briefSignalEvents, curatedItems, feedPosts, primaryNetwork]);

  const { isBriefOpen, categoryId } = readBriefRouteState(searchParams);
  const selectedBriefCategory = getBriefCategory(categoryId);

  useEffect(() => {
    setActiveBriefTab('updates');
  }, [categoryId]);

  const handleCloseBrief = useCallback(() => {
    setSearchParams(closeBriefParams(searchParams));
  }, [searchParams, setSearchParams]);

  const handleOpenBriefCategory = useCallback((nextCategoryId) => {
    setSearchParams(openBriefCategoryParams(searchParams, nextCategoryId));
    if (!currentUser?.id) return;
    feedRetentionService.recordEvent({
      userId: currentUser.id,
      eventType: 'category_open',
      metadata: { category_id: nextCategoryId, source: 'brief' },
    }).catch(() => {});
  }, [currentUser?.id, searchParams, setSearchParams]);

  const handleCloseBriefCategory = useCallback(() => {
    setSearchParams(closeBriefCategoryParams(searchParams));
  }, [searchParams, setSearchParams]);

  const handleBriefAction = useCallback((action) => {
    if (action.composer) {
      openComposer(action.composer);
      return;
    }
    if (action.destination === 'events_sheet') {
      setShowEventsSheet(true);
      return;
    }
    if (action.destination === 'minyan_sheet') {
      setShowMinyanSheet(true);
      return;
    }
    if (action.destination === '/Zmanim') {
      setShowCalendarSheet(true);
      return;
    }
    if (action.destination) navigate(action.destination);
  }, [navigate, openComposer]);

  const handleCardReply = useCallback((post) => {
    recordInterest(post);
    if (currentUser?.id) {
      feedRetentionService.recordEvent({
        userId: currentUser.id,
        post,
        eventType: 'reply',
        metadata: { category_id: classifyBriefCategory(post), source: 'feed' },
      }).catch(() => {}).finally(() => queryClient.invalidateQueries({
        queryKey: feedPreferenceKeys.signals(currentUser.id),
      }));
    }
    setReplyPost(post);
  }, [currentUser?.id, queryClient, recordInterest]);

  const handleCardOpen = useCallback((post) => {
    recordInterest(post);
    if (post.source_url) {
      try {
        const sourceUrl = new URL(post.source_url);
        if (sourceUrl.protocol === 'https:') {
          window.open(post.source_url, '_blank', 'noopener,noreferrer');
          return;
        }
      } catch {
        // Invalid or unsafe source URLs fall through to normal post behavior.
      }
    }
    if (post.type === 'help') {
      navigate('/MitzvahCircle');
      return;
    }
    if (post.type === 'event') {
      openComposer({
        type: 'event',
        subtype: 'local_event',
        initialBody: `Following up on: ${feedText(post)}`,
      });
      return;
    }
    openComposer({
      type: 'feed',
      subtype: 'discussion',
      initialBody: '',
    });
  }, [navigate, openComposer, recordInterest]);

  const shouldShowPreferenceSetup = Boolean(
    currentUser?.id
    && appParams.hasBackendConfig
    && briefPreferencesFetched
    && briefPreferences
    && !briefPreferences.preference_setup_completed_at,
  );

  if (shouldShowPreferenceSetup) {
    return (
      <FeedPreferenceSetup
        initialPreferences={briefPreferences}
        networkLabel={primaryNetwork.shortLabel || primaryNetwork.cityPreset || 'your area'}
        onSave={handlePreferenceSetupSave}
        onSkip={handlePreferenceSetupSkip}
      />
    );
  }

  return (
    <div className="app-page relative">
      {pullDistance > 0 && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[40] pointer-events-none">
          <div className={`transition-all ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }}>
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      )}

      {(isBriefOpen || feedTab !== 'general') && <DestinationHeader
        leading={(
          <FeedFilterTrigger
            primaryNetwork={primaryNetwork}
            isOpen={showLocationPicker}
            onToggle={() => setShowLocationPicker(v => !v)}
          />
        )}
        actions={(
          <>
            <button onClick={() => setShowCalendarSheet(true)} className="app-icon-button surface-tile-hover touch-manipulation" aria-label="Jewish Calendar">
              <CalendarDays className="h-[18px] w-[18px] text-blue-500" />
            </button>
            <button onClick={() => navigate('/SupportJUnited')} className="app-icon-button surface-tile-hover touch-manipulation" aria-label="Donate">
              <Heart className="h-[18px] w-[18px] text-rose-400" />
            </button>
            <button onClick={() => navigate('/Messages')} className="app-icon-button surface-tile-hover touch-manipulation" aria-label="Messages">
              <MessageCircle className="h-[18px] w-[18px] text-slate-500" />
            </button>
            <button onClick={() => navigate('/search')} className="app-icon-button surface-tile-hover touch-manipulation" aria-label="Search">
              <Search className="h-[18px] w-[18px] text-slate-500" />
            </button>
            <NotificationBell userId={currentUser?.id} />
          </>
        )}
      />}

      <FeedFilters
        isOpen={showLocationPicker}
        primaryNetwork={primaryNetwork}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNetwork={handleNetworkSelect}
        onSelectNeighborhood={setSelectedNeighborhood}
        onClose={() => setShowLocationPicker(false)}
      />


      {feedTab === 'general' ? (
        <div className={isBriefOpen ? 'mobile-page mobile-safe-bottom min-h-screen space-y-2.5 bg-[#F0EEE8] px-3 pt-3' : 'min-h-screen bg-[#F5F7FB]'}>
          {isBriefOpen ? (
            <WidgetBoundary>
              {selectedBriefCategory ? (
                <BriefCategorySection
                  category={selectedBriefCategory}
                  posts={feedPosts}
                  activeTab={activeBriefTab}
                  onTabChange={setActiveBriefTab}
                  onBack={handleCloseBriefCategory}
                  onOpenPost={handleCardOpen}
                  onOpenDirectory={() => navigate('/Map')}
                  onAction={handleBriefAction}
                />
              ) : (
                <BriefCategoryLaunchpad
                  onSelectCategory={handleOpenBriefCategory}
                  onClose={handleCloseBrief}
                />
              )}
            </WidgetBoundary>
          ) : (
            <FiveTownsHomeDashboard
              currentUser={currentUser}
              posts={rankedBriefItems}
              communityGroups={communityGroups}
              events={homeEvents}
              isLoading={isLoading && !loadTimedOut}
              eventsLoading={homeEventsLoading}
              eventsError={homeEventsError}
              onRetryEvents={refetchHomeEvents}
              onOpenEvent={(event) => setReplyPost(event)}
              onOpenEvents={() => setShowEventsSheet(true)}
              onAddEvent={() => navigate('/Publish?type=event')}
              onOpenLocation={() => setShowLocationPicker(true)}
              onNavigate={navigate}
              onOpenCalendar={() => setShowCalendarSheet(true)}
              onOpenMessages={() => navigate('/Messages')}
              onOpenNotifications={() => navigate('/Notifications')}
              onTuneHome={() => navigate('/Settings?section=notifications')}
              onReportCorrection={() => toast.message('Use Send feedback in Me to report a directory correction.')}
              dailyInfo={dailyInfo}
            />
          )}
        </div>
      ) : (
        <CommunitiesFeedView
          communityGroups={communityGroups}
          feedPosts={feedPosts}
          communitiesFetched={communitiesFetched}
          navigate={navigate}
          likedPostIds={userLikes}
          onLike={handleLike}
          onReply={handleCardReply}
        />
      )}

      <FeedComposer
        ref={composerRef}
        currentUser={currentUser}
        userCommunities={communityGroups}
        onPostCreated={() => queryClient.invalidateQueries({ queryKey: postKeys.all })}
      />

      {/* Jewish Calendar popup */}
      {showCalendarSheet && (
        <div className="fixed inset-0 z-[60] flex items-end" onClick={() => setShowCalendarSheet(false)}>
          <div className="w-full rounded-t-[28px] bg-white pb-safe shadow-[0_-4px_40px_rgba(0,0,0,0.15)] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
              <p className="text-[16px] font-black text-slate-950">Jewish Calendar</p>
              <button onClick={() => setShowCalendarSheet(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <JewishCountdown />
            </div>
          </div>
        </div>
      )}

      {/* Minyan Times popup */}
      {showMinyanSheet && (
        <div className="fixed inset-0 z-[60] flex items-end" onClick={() => setShowMinyanSheet(false)}>
          <div className="w-full rounded-t-[28px] bg-white pb-safe shadow-[0_-4px_40px_rgba(0,0,0,0.15)] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
              <p className="text-[16px] font-black text-slate-950">Minyan Times</p>
              <button onClick={() => setShowMinyanSheet(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <MinyanBoard compact />
            </div>
          </div>
        </div>
      )}

      {showEventsSheet && (
        <WidgetBoundary>
          <UpcomingEventsSheet
            open={showEventsSheet}
            onOpenChange={setShowEventsSheet}
            currentUser={currentUser}
            joinedCommunityIds={COMMUNITIES_ENABLED ? communityGroups.map(c => c.id) : []}
            onOpenEvent={(event) => setReplyPost(event)}
          />
        </WidgetBoundary>
      )}

      {replyPost && (
        <WidgetBoundary>
          <CommentsSheet
            open={Boolean(replyPost)}
            onOpenChange={(open) => {
              if (open) return;
              setReplyPost(null);
              if (searchParams.get('postId') || searchParams.get('reply') || searchParams.get('comments')) {
                const next = new URLSearchParams(searchParams);
                next.delete('postId');
                next.delete('reply');
                next.delete('comments');
                setSearchParams(next, { replace: true });
              }
            }}
            post={replyPost}
            currentUser={currentUser}
            blockedIds={blockedIds}
            onCommentAdded={() => queryClient.invalidateQueries({ queryKey: postKeys.all })}
          />
        </WidgetBoundary>
      )}
    </div>
  );
}
