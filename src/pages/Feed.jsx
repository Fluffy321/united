import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dataService, feedRetentionService, shabbatReminderService, storageService, togglePostLike } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { appParams } from '@/lib/app-params';
import { COMMUNITIES_ENABLED } from '@/config/features';
import { toast } from 'sonner';
import ReportModal from '@/components/common/ReportModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ArrowRight, CalendarDays, Heart, MessageCircle, RefreshCw, Search, Sparkles, Users, X } from 'lucide-react';
import SkeletonCard from '@/components/common/SkeletonCard';
import QueryError from '@/components/common/QueryError';
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
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import CommunitiesFeedView from '@/components/feed/CommunitiesFeedView';
import FiveTownsBrief from '@/components/feed/FiveTownsBrief';
import FeedIntentionRail from '@/components/feed/FeedIntentionRail';
import BriefCategoryLaunchpad from '@/components/feed/BriefCategoryLaunchpad';
import BriefCategorySection from '@/components/feed/BriefCategorySection';
import WidgetBoundary from '@/components/feed/WidgetBoundary';
import { usePullToRefresh } from '@/lib/usePullToRefresh';

import { DEMO_POSTS } from '@/lib/feed/demoPosts';
import { createBlock, deleteComment, deleteUnifiedPost, filterBlock, filterComment, filterUserCommunity, getCommunity, getUnifiedPost } from '@/services/entityServices';
import { FEED_LOAD_TIMEOUT_MS, feedText, getPostLivePriority } from '@/lib/feed/feedRanking';
import { feedPreferenceKeys, postKeys } from '@/lib/queryKeys';
import { DEFAULT_BRIEF_CATEGORY_IDS, getBriefCategory } from '@/lib/feed/briefCategories';
import { classifyBriefCategory, rankBriefItems } from '@/lib/feed/briefRanking';
import {
  closeBriefCategoryParams,
  closeBriefParams,
  openBriefCategoryParams,
  openBriefParams,
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
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
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
  const [showNetworkBanner, setShowNetworkBanner] = useState(() => !storageService.getItem('junited_network_banner_v2_dismissed'));
  const [feedTab, setFeedTab] = useState('general');
  const [activeBriefTab, setActiveBriefTab] = useState('updates');
  const canShowPreviewContent = !import.meta.env.PROD;

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

  const { posts, fetchNextPage, hasNextPage, isLoading, isError, refetch } = useFeedData();
  const { isRefreshing, pullDistance } = usePullToRefresh(refetch);
  const { data: briefPreferences = null } = useQuery({
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
      if (!appParams.hasBackendConfig) {
        setCommunityGroups([{ id: 'demo-community', name: 'Five Towns', type: 'Neighborhood' }]);
      }
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

  const deleteMutation = useMutation({
    mutationFn: async (postId) => {
      await deleteUnifiedPost(postId);
      await deleteComment(await filterComment({ post_id: postId }).then(c => c.map(x => x.id)));
    },
    onSuccess: () => {
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

  const handleBlock = useCallback(async (userId) => {
    if (!currentUser) return;
    if (!appParams.hasBackendConfig) {
      setBlockedIds(prev => [...prev, userId]);
      toast.success('User blocked locally for this demo session');
      return;
    }
    try {
      await createBlock({ blocker_id: currentUser.id, blocked_id: userId });
      setBlockedIds(prev => [...prev, userId]);
      toast.success('User blocked');
    } catch { toast.error('Could not block user'); }
  }, [currentUser, appParams]);

  const handleReport = useCallback((contentId, contentType) => {
    setReportTarget({ id: contentId, type: contentType });
    setShowReport(true);
  }, []);

  const handleCommunityClick = useCallback((communityId) => {
    if (!communityId) return;
    navigate(`/communities/${communityId}`);
  }, [navigate]);

  const handleComment = useCallback((p) => {
    recordInterest(p);
  }, [recordInterest]);

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

  const handleDelete = useCallback((id) => deleteMutation.mutate(id), [deleteMutation.mutate]);

  const handleNetworkSelect = useCallback(async (net) => {
    setPrimaryNetwork(net);
    setSelectedNeighborhood('All');
    if (appParams.hasBackendConfig) {
      try { await dataService.auth.updateMe({ cityPreset: net.cityPreset }); } catch {}
    }
  }, [appParams]);

  const feedCanRender = !isLoading || loadTimedOut;
  const isPreviewContent = canShowPreviewContent && feedCanRender && posts.length === 0;
  const feedSourcePosts = isPreviewContent ? DEMO_POSTS : posts;

  const FEED_TTL = 14 * 24 * 3_600_000; // posts older than 14 days are hidden from feed
  const visiblePosts = feedSourcePosts.filter(p => {
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

  const engagementScore = (p) => feedRetentionService.scorePost(p, {
    joinedCommunityIds,
    primaryNetwork,
    userInterests: currentUser?.interests || [],
    interestSignals,
  });

  const feedPosts = (() => {
    const sorted = [...visiblePosts].sort((a, b) => {
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

  const rankedBriefItems = useMemo(() => {
    const curatedItems = (dailyBrief.topLocalUpdates || []).map((item, index) => ({
      ...item,
      id: item.id || `${publishedBrief?.id || 'daily-brief'}-${index}`,
      provenance: 'editor',
      verified: true,
      created_at: publishedBrief?.updated_at || publishedBrief?.created_at,
    }));
    return rankBriefItems({
      items: [...curatedItems, ...feedPosts],
      selectedCategoryIds: briefPreferences?.interests || DEFAULT_BRIEF_CATEGORY_IDS,
      events: briefSignalEvents,
      primaryNetwork,
    });
  }, [briefPreferences?.interests, briefSignalEvents, dailyBrief.topLocalUpdates, feedPosts, primaryNetwork, publishedBrief?.created_at, publishedBrief?.id, publishedBrief?.updated_at]);

  const { isBriefOpen, categoryId } = readBriefRouteState(searchParams);
  const selectedBriefCategory = getBriefCategory(categoryId);

  useEffect(() => {
    setActiveBriefTab('updates');
  }, [categoryId]);

  const handleOpenBrief = useCallback(() => {
    setSearchParams(openBriefParams(searchParams));
  }, [searchParams, setSearchParams]);

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

  return (
    <div className="app-page relative">
      {pullDistance > 0 && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[40] pointer-events-none">
          <div className={`transition-all ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }}>
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      )}

      <DestinationHeader
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
      />

      <FeedFilters
        isOpen={showLocationPicker}
        primaryNetwork={primaryNetwork}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNetwork={handleNetworkSelect}
        onSelectNeighborhood={setSelectedNeighborhood}
        onClose={() => setShowLocationPicker(false)}
      />


      {feedTab === 'general' ? (
        <div className="mobile-page min-h-screen space-y-2.5 bg-[#F0EEE8] px-3 pb-6 pt-3">
          {/* One-time network banner */}
          {showNetworkBanner && (
            <div className="graphic-stripes flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-4 py-3 text-white text-[12px] font-medium shadow-[0_14px_30px_rgba(37,99,235,0.18)]">
              <span className="text-lg">{primaryNetwork.emoji}</span>
              <span className="flex-1">You're viewing <strong>{primaryNetwork.shortLabel}</strong> — tap the chip above to switch networks.</span>
              <button onClick={() => { setShowNetworkBanner(false); storageService.setItem('junited_network_banner_v2_dismissed', '1'); }} className="text-white/70 hover:text-white text-lg leading-none font-bold flex-shrink-0">×</button>
            </div>
          )}

          {isPreviewContent && (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
              <div className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="text-[12px] font-black uppercase tracking-wide">Preview content</p>
                  <p className="mt-0.5 text-[12px] font-semibold leading-snug text-amber-800">
                    Showing sample Five Towns posts because no Supabase posts loaded in this non-production preview.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isBriefOpen ? (
            <WidgetBoundary>
              {selectedBriefCategory ? (
                <BriefCategorySection
                  category={selectedBriefCategory}
                  posts={feedPosts}
                  activeTab={activeBriefTab}
                  onTabChange={setActiveBriefTab}
                  onBack={handleCloseBriefCategory}
                  onOpenPost={(post) => navigate(`/PostDetail?id=${post.id}`)}
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
            <>
              {COMMUNITIES_ENABLED && appParams.hasBackendConfig && communitiesFetched && communityGroups.length === 0 && (
                <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-black text-slate-900">Join your first community</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-slate-500">Your feed gets better once you follow a shul, neighborhood, chesed group, or local community.</p>
                      <button
                        onClick={() => navigate('/Communities')}
                        className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-[13px] font-bold text-white transition-transform active:scale-95"
                      >
                        Find communities <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <WidgetBoundary>
                <FiveTownsBrief
                  items={rankedBriefItems}
                  networkLabel={primaryNetwork.shortLabel || primaryNetwork.cityPreset || 'Your community'}
                  onOpenBrief={handleOpenBrief}
                  onOpenItem={(post) => navigate(`/PostDetail?id=${post.id}`)}
                />
              </WidgetBoundary>

              <FeedIntentionRail onSelect={(intention) => openComposer(intention.composer)} />

              <section aria-labelledby="from-your-community-heading" className="space-y-2.5">
                <div className="flex items-end justify-between px-1 pt-1">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#315B8A]">Live and local</p>
                    <h2 id="from-your-community-heading" className="mt-0.5 text-[17px] font-black tracking-[-0.02em] text-[#0F1C2E]">
                      From your community
                    </h2>
                  </div>
                </div>

                {isLoading && !loadTimedOut && (
                  <div className="motion-stagger space-y-2.5 tab-fade-in">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                )}

                {isError && !isLoading && feedPosts.length === 0 && (
                  <QueryError message="The feed could not load." onRetry={refetch} />
                )}

                {feedCanRender && !isError && feedPosts.length === 0 && (
                  <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-5">
                    <p className="text-[13px] font-black text-[#0F1C2E]">Nothing has been shared here yet</p>
                    <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">
                      Use Ask, Share, Need, Offer, or Plan to start something useful.
                    </p>
                  </div>
                )}

                {feedCanRender && feedPosts.length > 0 && (
                  <div className="motion-stagger tab-fade-in space-y-2.5">
                    {isError && (
                      <p className="px-4 py-2 text-center text-[12px] text-slate-400">Showing cached posts — pull down to refresh.</p>
                    )}
                    {feedPosts.map((post) => (
                      <UnifiedPostCard
                        variant="compact"
                        key={post.id}
                        post={post}
                        liked={userLikes.includes(post.id)}
                        onLike={handleLike}
                        onReply={handleCardReply}
                        onOpen={handleCardOpen}
                        onMap={() => navigate('/Map')}
                      />
                    ))}
                    {hasNextPage && (
                      <div className="pb-4 text-center">
                        <button
                          onClick={() => fetchNextPage()}
                          disabled={isLoading}
                          className="motion-press min-h-11 rounded-full bg-white px-6 text-[13px] font-semibold text-slate-700 shadow-sm disabled:opacity-50"
                        >
                          {isLoading ? 'Loading…' : 'Load more posts'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
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

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
        currentUser={currentUser}
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
