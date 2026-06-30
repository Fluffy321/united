import React, { useEffect, useState, useCallback, useMemo, useRef, Component } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dataService, feedRetentionService, shabbatReminderService, storageService, togglePostLike } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { appParams } from '@/lib/app-params';
import { COMMUNITIES_ENABLED } from '@/config/features';
import { toast } from 'sonner';
import ReportModal from '@/components/common/ReportModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ArrowRight, CalendarDays, Car, Handshake, Heart, MapPin, MessageCircle, Plus, RefreshCw, Search, Sparkles, Store, Users } from 'lucide-react';
import SkeletonCard from '@/components/common/SkeletonCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LOCAL_NETWORKS } from '@/lib/localNetworks';
import { useFloatingActions } from '@/components/layout/FloatingActionsContext';
import DestinationHeader from '@/components/layout/DestinationHeader';
import useFeedData from '@/components/feed/useFeedData';
import FeedFilters, { FeedFilterTrigger } from '@/components/feed/FeedFilters';
import FeedComposer from '@/components/feed/FeedComposer';
import TodayFiveTownsCard from '@/components/feed/TodayFiveTownsCard';
import { getTodayHebrew, getShabbatTimes, getZmanim } from '@/lib/hebrewDate';
import UpcomingEventsSheet from '@/components/feed/UpcomingEventsSheet';
import CommentsSheet from '@/components/feed/CommentsSheet';

import { DEMO_POSTS } from '@/lib/feed/demoPosts';
import { buildFeedSections } from '@/lib/feed/feedSections';
import {
  FEED_LOAD_TIMEOUT_MS,
  feedBody,
  feedText,
  formatPostAge,
  getAliveCue,
  getCardIntent,
  getPostLivePriority,
  matchesText,
  postDate,
  toneClasses,
} from '@/lib/feed/feedRanking';

export default function Feed({ isActive = true }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { registerFloatingAction } = useFloatingActions();
  const [primaryNetwork, setPrimaryNetwork] = useState(LOCAL_NETWORKS[0]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [userLikes, setUserLikes] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const composerRef = useRef(null);
  const [showEventsSheet, setShowEventsSheet] = useState(false);
  const [replyPost, setReplyPost] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  useEffect(() => {
    const enabled = Boolean(currentUser)
      && currentUser?.notification_settings?.shabbatReminders !== false
      && currentUser?.app_settings?.quietMode !== true;
    shabbatReminderService.start({ enabled });
    return () => shabbatReminderService.stop();
  }, [currentUser?.notification_settings?.shabbatReminders, currentUser?.app_settings?.quietMode]);
  const [interestSignals, setInterestSignals] = useState({ types: {}, subtypes: {}, keywords: [] }); // track user interactions
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState(null);
  const [publishedBrief, setPublishedBrief] = useState(null);
  const [showNetworkBanner, setShowNetworkBanner] = useState(() => !storageService.getItem('junited_network_banner_v2_dismissed'));
  const [feedTab, setFeedTab] = useState('general');
  const canShowPreviewContent = !import.meta.env.PROD;

  useEffect(() => {
    if (!COMMUNITIES_ENABLED && feedTab !== 'general') {
      setFeedTab('general');
    }
  }, [feedTab]);

  const openComposer = useCallback((options) => {
    composerRef.current?.open(options);
  }, []);

  const openCreatePost = useCallback(() => openComposer({
    type: 'feed',
    subtype: null,
    initialBody: '',
  }), [openComposer]);

  useEffect(() => {
    if (!isActive || !currentUser) return undefined;

    return registerFloatingAction('feed-create-post', {
      order: 100,
      render: () => (
        <button
          onClick={openCreatePost}
          className="app-fab app-floating-action flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-200 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}
          aria-label="Create post"
        >
          <Plus className="h-6 w-6" />
        </button>
      ),
    });
  }, [currentUser, isActive, openCreatePost, registerFloatingAction]);

  useEffect(() => {
    if (!currentUser?.cityPreset) return;
    const net = LOCAL_NETWORKS.find(n => n.cityPreset === currentUser.cityPreset);
    if (net) setPrimaryNetwork(net);
  }, [currentUser?.cityPreset]);

  useEffect(() => {
    feedRetentionService.getDailyPrompt({
      network: primaryNetwork.cityPreset || 'Five Towns',
      userId: currentUser?.id,
    })
      .then(setDailyPrompt)
      .catch(() => setDailyPrompt(null));
  }, [currentUser?.id, primaryNetwork.cityPreset]);

  useEffect(() => {
    feedRetentionService.getPublishedBrief({
      network: primaryNetwork.cityPreset || 'Five Towns',
    })
      .then(setPublishedBrief)
      .catch(() => setPublishedBrief(null));
  }, [primaryNetwork.cityPreset]);

  const { posts, fetchNextPage, hasNextPage, isLoading, isError } = useFeedData();

  const { data: userCommunitiesList, isFetched: communitiesFetched } = useQuery({
    queryKey: ['user-communities', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const memberships = await dataService.entities.UserCommunity.filter({ user_id: currentUser.id });
      const ids = memberships.map(m => m.community_id).filter(Boolean);
      if (ids.length === 0) return [];
      // Fetch each community individually so a single bad/deleted ID doesn't poison the whole list
      const results = await Promise.allSettled(ids.map(id => dataService.entities.Community.get(id)));
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
      return dataService.entities.Block.filter({ blocker_id: currentUser.id });
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
      queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId) => {
      await dataService.entities.UnifiedPost.delete(postId);
      await dataService.entities.Comment.delete(await dataService.entities.Comment.filter({ post_id: postId }).then(c => c.map(x => x.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
    },
  });

  const recordInterest = useCallback((post) => {
    setInterestSignals(prev => ({
      types: { ...prev.types, [post.type]: (prev.types[post.type] || 0) + 1 },
      subtypes: post.post_subtype ? { ...prev.subtypes, [post.post_subtype]: (prev.subtypes[post.post_subtype] || 0) + 1 } : prev.subtypes,
      keywords: [...prev.keywords, ...(post.body || '').toLowerCase().split(/\s+/).slice(0, 5)].slice(-50),
    }));
    feedRetentionService.recordEvent({
      userId: currentUser?.id,
      post,
      eventType: 'engaged',
      metadata: { source: 'feed' },
    }).catch(() => {});
  }, [currentUser?.id]);

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
      await dataService.entities.Block.create({ blocker_id: currentUser.id, blocked_id: userId });
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
    dataService.entities.UnifiedPost.get(postId)
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

  const visiblePosts = feedSourcePosts.filter(p => {
    if (p.type === 'dating') return false;
    if (p.type === 'prompt') return false;
    if (p.type === 'daily_greeting') return false; // shown via FiveTownsConversationHub, not individual cards
    if (blockedIds.includes(p.user_id)) return false;
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

    return sorted.slice(0, 60);
  })();

  const dailyBrief = useMemo(() => feedRetentionService.buildBrief({
    posts: feedPosts,
    communityGroups,
    networkLabel: primaryNetwork.shortLabel || primaryNetwork.cityPreset || 'Five Towns',
    curatedBrief: publishedBrief,
  }), [communityGroups, feedPosts, primaryNetwork.cityPreset, primaryNetwork.shortLabel, publishedBrief]);

  const feedMomentum = useMemo(() => ({
    activeThreads: feedPosts.filter((post) => Number(post.comments_count || 0) >= 8).length,
    joinedPosts: feedPosts.filter((post) => post.community_id && joinedCommunityIds.has(post.community_id)).length,
    localEvents: feedPosts.filter((post) => post.type === 'event').length,
  }), [feedPosts, joinedCommunityIds]);

  const feedSections = useMemo(() => buildFeedSections(feedPosts), [feedPosts]);

  const handleCardReply = useCallback((post) => {
    recordInterest(post);
    setReplyPost(post);
  }, [recordInterest]);

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

      {COMMUNITIES_ENABLED && (
        <div className="sticky top-[56px] z-[50] bg-white/95 backdrop-blur-sm border-b border-slate-100 px-3 py-2">
          <div className="mobile-page">
            <div className="flex bg-[#E4E1D9] rounded-full p-[3px]">
              <button
                type="button"
                onClick={() => setFeedTab('general')}
                className={`flex-1 py-2 rounded-full text-[14px] transition-all ${
                  feedTab === 'general'
                    ? 'bg-white text-slate-950 font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.14),0_0_0_0.5px_rgba(0,0,0,0.06)]'
                    : 'text-slate-400 font-normal'
                }`}
              >
                Feed
              </button>
              <button
                type="button"
                onClick={() => setFeedTab('communities')}
                className={`flex-1 py-2 rounded-full text-[14px] transition-all ${
                  feedTab === 'communities'
                    ? 'bg-white text-slate-950 font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.14),0_0_0_0.5px_rgba(0,0,0,0.06)]'
                    : 'text-slate-400 font-normal'
                }`}
              >
                Communities
              </button>
            </div>
          </div>
        </div>
      )}

      {feedTab === 'general' ? (
        <div className="mobile-page px-3 pt-3 mobile-safe-bottom space-y-2.5 bg-[#F0EEE8] min-h-screen">
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
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-bold text-white active:scale-95 transition-transform"
                  >
                    Find communities <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <WidgetBoundary>
            <FiveTownsBrief
              brief={dailyBrief}
              momentum={feedMomentum}
              posts={feedPosts}
              joinedCommunityIds={joinedCommunityIds}
              communitiesEnabled={COMMUNITIES_ENABLED}
              prompt={dailyPrompt}
              onOpenMap={() => navigate('/Map')}
              onOpenCommunities={() => navigate('/Communities')}
              onCreate={(type, subtype, body) => openComposer({ type, subtype, initialBody: body })}
            />
          </WidgetBoundary>

          {appParams.hasBackendConfig && (
            <WidgetBoundary>
              <TodayFiveTownsCard onCalendarClick={() => setShowEventsSheet(true)} />
            </WidgetBoundary>
          )}

          <WidgetBoundary>
            <FiveTownsConversationHub
              posts={posts}
              networkLabel={primaryNetwork.shortLabel || 'Five Towns'}
              onCreate={(type, subtype, body) => openComposer({ type, subtype, initialBody: body })}
              onOpenMap={() => navigate('/Map')}
              onOpenMitzvah={() => navigate('/MitzvahCircle')}
              onOpenEvents={() => setShowEventsSheet(true)}
              onOpenMarketplace={() => navigate('/Marketplace')}
            />
          </WidgetBoundary>

          {isLoading && !loadTimedOut && (
            <div className="motion-stagger space-y-2.5 tab-fade-in">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {isLoading && loadTimedOut && feedPosts.length === 0 && (
            <div className="rounded-[26px] bg-white px-5 py-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">🌿</div>
              <p className="text-[16px] font-black text-slate-900">Welcome to the Five Towns feed</p>
              <p className="mx-auto mt-1 max-w-sm text-[13px] font-semibold leading-5 text-slate-500">
                Start with something useful: a recommendation, a quick question, or a neighborly update.
              </p>
              <button onClick={openCreatePost} className="motion-press mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-[13px] font-black text-white">
                <Plus className="h-4 w-4" />
                Write the first post
              </button>
            </div>
          )}

          {feedCanRender && feedPosts.length > 0 && (
            <div className="motion-stagger tab-fade-in space-y-2.5">
              {isError && (
                <p className="text-[12px] text-slate-400 text-center px-4 py-2">Showing cached posts — pull down to refresh.</p>
              )}
              {feedPosts.map((post) => (
                <FeedPostCard
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
                    className="motion-press px-6 py-2 rounded-full bg-white text-slate-700 text-[13px] font-semibold shadow-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Loading…' : 'Load more posts'}
                  </button>
                </div>
              )}
            </div>
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
        onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['unified-posts'] })}
      />

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
        currentUser={currentUser}
      />

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
            onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['unified-posts'] })}
          />
        </WidgetBoundary>
      )}
    </div>
  );
}

const AUTHOR_COLORS = ['#1B4FA8', '#2E7D52', '#8B3A8B', '#C45B12', '#1B7A8A', '#8B2030', '#7B6A00', '#0A6B5E'];
function authorColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xFFFFFF;
  return AUTHOR_COLORS[Math.abs(h) % AUTHOR_COLORS.length];
}

function FeedPostCard({ post, liked = false, onLike, onReply, onOpen, onMap }) {
  const intent = getCardIntent(post);
  const tone = toneClasses[intent.tone] || toneClasses.slate;
  const Icon = intent.icon || MessageCircle;
  const title = feedText(post);
  const body = feedBody(post);
  const age = formatPostAge(postDate(post));
  const replies = Number(post.comments_count || 0);
  const reactions = Number(post.likes_count || 0);
  const initials = (post.author_name || 'J').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const avatarBg = authorColor(post.author_id || post.author_name || '');

  return (
    <article className="rounded-[16px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: avatarBg }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-slate-900 leading-tight truncate">{post.author_name || 'Neighbor'}</div>
            <div className="text-[12px] text-slate-400">{age}</div>
          </div>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${tone.pill}`}>
            <Icon className="h-3 w-3 shrink-0" />
            {intent.label}
          </span>
        </div>
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <p className="text-[16px] leading-[1.55] text-slate-900 font-medium">{title}</p>
          {body && body !== title && (
            <p className="mt-1 text-[14px] leading-snug text-slate-500 line-clamp-2">{body}</p>
          )}
        </button>
      </div>
      <div className="flex border-t border-slate-100">
        <button
          type="button"
          onClick={() => onLike(post.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-medium transition-colors ${liked ? 'text-rose-500' : 'text-slate-400'}`}
        >
          <Heart className={`h-[17px] w-[17px] ${liked ? 'fill-rose-500' : ''}`} />
          {reactions > 0 && <span>{reactions}</span>}
        </button>
        <button
          type="button"
          onClick={() => onReply(post)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-medium text-slate-400"
        >
          <MessageCircle className="h-[17px] w-[17px]" />
          {replies > 0 ? <span>{replies}</span> : null}
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center py-3 text-slate-400"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    </article>
  );
}

const COMMUNITY_COLORS = ['#1B4FA8', '#2E7D52', '#8B3A8B', '#C45B12', '#1B7A8A', '#8B2030', '#7B6A00', '#0A6B5E'];
function communityColor(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xFFFFFF;
  return COMMUNITY_COLORS[Math.abs(h) % COMMUNITY_COLORS.length];
}

function CommunitiesFeedView({ communityGroups, feedPosts, communitiesFetched, navigate, onLike, onReply, likedPostIds }) {
  if (!COMMUNITIES_ENABLED || (communitiesFetched && communityGroups.length === 0)) {
    return (
      <div className="mobile-page mobile-safe-bottom px-4 pt-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">🏘️</div>
        <p className="text-[16px] font-black text-slate-900">No communities yet</p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] leading-5 text-slate-500">
          Join a shul, neighborhood group, or chesed organization to see their posts here.
        </p>
        <button
          onClick={() => navigate('/Communities')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-bold text-white"
        >
          Find communities <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (!communitiesFetched) {
    return (
      <div className="mobile-page mobile-safe-bottom px-3 pt-3 space-y-2.5 bg-[#F0EEE8] min-h-screen">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="mobile-page mobile-safe-bottom bg-[#F0EEE8] min-h-screen pt-[1px]">
      {communityGroups.map((community) => {
        const communityPosts = feedPosts.filter(p => p.community_id === community.id).slice(0, 3);
        const color = communityColor(community.id);
        const hasActivity = communityPosts.length > 0;

        return (
          <div key={community.id} className="mb-2">
            <div className={`bg-white ${hasActivity ? '' : 'opacity-40'}`}>
              <button
                type="button"
                onClick={() => navigate(`/communities/${community.id}`)}
                className="w-full flex items-center px-4 py-3 border-b border-slate-100"
              >
                <div className="w-1 h-7 rounded-full mr-3 shrink-0" style={{ background: hasActivity ? color : color, opacity: hasActivity ? 1 : 0.5 }} />
                <span className="flex-1 text-left text-[11px] font-bold tracking-[0.07em] uppercase text-slate-900">
                  {community.name}
                </span>
                {hasActivity ? (
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                ) : (
                  <span className="text-[11px] text-slate-400 italic font-normal">No recent activity</span>
                )}
              </button>
              {communityPosts.map(post => (
                <CommunityCompactPost
                  key={post.id}
                  post={post}
                  liked={likedPostIds.includes(post.id)}
                  onLike={onLike}
                  onReply={onReply}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommunityCompactPost({ post, liked = false, onLike, onReply }) {
  const age = formatPostAge(postDate(post));
  const replies = Number(post.comments_count || 0);
  const reactions = Number(post.likes_count || 0);
  const initials = (post.author_name || 'J').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 bg-white">
      <div
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
        style={{ background: authorColor(post.author_id || post.author_name || '') }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-[13px] font-semibold text-slate-900 truncate">{post.author_name || 'Neighbor'}</span>
          <span className="text-[12px] text-slate-400 shrink-0">· {age}</span>
        </div>
        <p className="text-[14px] leading-snug text-slate-900 line-clamp-3">{feedText(post)}</p>
        <div className="flex items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1 text-[12px] ${liked ? 'text-rose-500' : 'text-slate-400'}`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-rose-500' : ''}`} />
            {reactions > 0 && <span>{reactions}</span>}
          </button>
          <button
            type="button"
            onClick={() => onReply(post)}
            className="flex items-center gap-1 text-[12px] text-slate-400"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {replies > 0 && <span>{replies}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

const BRIEF_SLIDE_GRADIENTS = {
  today:   'from-[#0a1628] via-[#0d1f3c] to-[#152a52]',
  mitzvah: 'from-[#081a10] via-[#0d2e1a] to-[#0f3d20]',
  events:  'from-[#130a28] via-[#1e0d3c] to-[#2a1255]',
  nearby:  'from-[#081a1a] via-[#0d2e2e] to-[#0f3d3d]',
  pulse:   'from-[#0a1628] via-[#0d1a38] to-[#0f2040]',
  shabbos: 'from-[#1a0f05] via-[#2e1a08] to-[#3d2010]',
};

const FIVE_TOWNS_LAT = 40.6198;
const FIVE_TOWNS_LNG = -73.7298;

function FiveTownsBrief({ brief, momentum, posts = [], joinedCommunityIds, communitiesEnabled = true, prompt, onOpenMap, onOpenCommunities, onCreate }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const briefScrollerRef = useRef(null);
  const safeBrief = brief || {};

  const [hebrewDate, setHebrewDate] = useState(null);
  const [candleLighting, setCandleLighting] = useState(null);
  const [zmanOfDay, setZmanOfDay] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [thoughtText, setThoughtText] = useState('');
  const [mitzvahText, setMitzvahText] = useState('');
  const [mitzvahShareTarget, setMitzvahShareTarget] = useState(null);
  const [mitzvahProgress] = useState(() => Math.min(100, Math.max(0, (momentum?.mitzvahs || 0) * 2 + 28)));
  const [streak] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('junited_brief_streak') || '{}');
      const todayStr = new Date().toDateString();
      const yesterdayStr = new Date(Date.now() - 86_400_000).toDateString();
      if (stored.lastOpen === todayStr) return stored.count || 1;
      const newCount = stored.lastOpen === yesterdayStr ? (stored.count || 0) + 1 : 1;
      localStorage.setItem('junited_brief_streak', JSON.stringify({ lastOpen: todayStr, count: newCount }));
      return newCount;
    } catch { return 1; }
  });

  useEffect(() => {
    getTodayHebrew().then(setHebrewDate);
    getShabbatTimes(FIVE_TOWNS_LAT, FIVE_TOWNS_LNG).then((times) => {
      if (times?.candleLighting) {
        const dt = new Date(times.candleLighting);
        if (!isNaN(dt.getTime())) {
          setCandleLighting({
            timeStr: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }),
            date: dt,
            parsha: times.parsha,
          });
        }
      }
    });
    const now = new Date();
    const isWeekday = now.getDay() !== 0 && now.getDay() !== 6;
    if (isWeekday) {
      getZmanim(FIVE_TOWNS_LAT, FIVE_TOWNS_LNG).then((times) => {
        if (!times) return;
        const isAfternoon = now.getHours() >= 13;
        const key = isAfternoon ? 'minchaGedola' : 'sofZmanShma';
        const label = isAfternoon ? 'Mincha from' : 'Latest Shacharis';
        const raw = times[key];
        if (raw) {
          const dt = new Date(raw);
          if (!isNaN(dt.getTime())) {
            setZmanOfDay({
              label,
              timeStr: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }),
            });
          }
        }
      });
    }
  }, []);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const msUntilCandles = candleLighting?.date ? candleLighting.date - today : null;
  const showShabbos = (dayOfWeek === 4 || dayOfWeek === 5) && (msUntilCandles === null || msUntilCandles > 0);
  const hoursUntil = msUntilCandles ? Math.max(0, Math.floor(msUntilCandles / 3_600_000)) : 0;
  const minutesUntil = msUntilCandles ? Math.max(0, Math.floor((msUntilCandles % 3_600_000) / 60_000)) : 0;

  const curatedNewsItems = (safeBrief.topLocalUpdates || []).map((item, index) => ({
    id: item.id || `curated-local-${index}`,
    title: item.title || 'Verified local update',
    community_name: item.source_label || item.source || 'Verified local source',
  }));
  const fallbackNewsItems = posts
    .filter((post) => post.type === 'news' || /update|brief|eruv|traffic|school|notice|local/i.test(`${post.title || ''} ${post.body || ''}`))
    .slice(0, 3);
  const defaultNewsItems = [
    { id: 'n1', title: 'Look for one small way to help a neighbor today.', community_name: 'Daily mitzvah' },
    { id: 'n2', title: 'A Jewish community is built one thoughtful action at a time.', community_name: 'Torah thought' },
    { id: 'n3', title: "Check today's schedule for local times, events, and community moments.", community_name: "Today's schedule" },
  ];
  const newsItems = curatedNewsItems.length ? curatedNewsItems : fallbackNewsItems.length ? fallbackNewsItems : defaultNewsItems;

  const now = new Date();
  const mitzvahNeeds = posts
    .filter((post) => post.type === 'help' || /help|chesed|meal|ride|offer|volunteer/i.test(`${post.title || ''} ${post.body || ''}`))
    .slice(0, 3)
    .map((post) => {
      const expiresAt = post.expires_at ? new Date(post.expires_at) : null;
      const urgent = expiresAt && (expiresAt - now) < 2 * 3_600_000 && expiresAt > now;
      return { ...post, urgent };
    });
  const mitzvahItems = mitzvahNeeds.length ? mitzvahNeeds : [
    { id: 'm1', title: 'Meal needed — Schwartz family', community_name: 'Chesed', location_text: '0.3 mi · Tonight', urgent: false },
    { id: 'm2', title: 'Ride needed — Mrs. Cohen', community_name: 'Chesed', location_text: '1.1 mi · By 2 PM', urgent: true },
  ];

  const communityEvents = posts
    .filter((post) => post.type === 'event')
    .slice(0, 3);
  const eventItems = communityEvents.length ? communityEvents : [
    { id: 'e1', title: 'Shacharis', community_name: 'Young Israel Woodmere', location_text: '7:30 AM' },
    { id: 'e2', title: 'Daf Yomi Shiur', community_name: 'Agudah Lawrence', location_text: '8:00 PM' },
    { id: 'e3', title: 'Community Board Meeting', community_name: 'Cedarhurst', location_text: '9:00 PM' },
  ];

  const trendingMoments = [...posts]
    .sort((a, b) => ((b.comments_count || 0) * 2 + (b.likes_count || 0)) - ((a.comments_count || 0) * 2 + (a.likes_count || 0)))
    .filter((p) => (p.comments_count || 0) + (p.likes_count || 0) > 0)
    .slice(0, 3)
    .map((p) => ({ emoji: '🔥', text: `Most discussed: ${p.title || p.body || 'Community thread'}` }));
  const pulseStats = [
    ...(trendingMoments.length ? trendingMoments : [
      { emoji: '🔥', text: 'Most discussed: Hatzalah fundraiser in Cedarhurst' },
      { emoji: '🔥', text: 'Hot thread: Eruv status update — Lawrence' },
    ]),
    { emoji: '🍲', text: `${Math.max(1, momentum?.mitzvahs || 3)} meal requests open` },
    { emoji: '📋', text: `${Math.max(1, momentum?.joinedPosts || 7)} new community posts` },
  ].slice(0, 4);

  const slideKeys = ['today', 'mitzvah', 'events', 'nearby', 'pulse', ...(showShabbos ? ['shabbos'] : [])];
  const slideLabels = ['Today', 'Daily Mitzvah', 'Events', 'Near You', 'Pulse', ...(showShabbos ? ['Shabbos'] : [])];

  useEffect(() => {
    if (activeSlide >= slideKeys.length) setActiveSlide(0);
  }, [activeSlide, slideKeys.length]);

  const visibleSlide = Math.min(activeSlide, slideKeys.length - 1);
  const currentKey = slideKeys[visibleSlide];
  const englishDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border border-white/8 shadow-[0_14px_32px_rgba(10,18,40,0.18)]">
      <style>{`
        @keyframes brief-progress { from { width: 0 } }
        .brief-progress-bar { animation: brief-progress 1.1s cubic-bezier(.4,0,.2,1) both; }
        @keyframes brief-pulse { 0%,100% { opacity:1 } 50% { opacity:.55 } }
        .brief-last-chance { animation: brief-pulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .brief-progress-bar,.brief-last-chance { animation: none; } }
        .brief-share-input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>

      <div className={`bg-gradient-to-br ${BRIEF_SLIDE_GRADIENTS[currentKey]} p-4 text-white transition-all duration-500`}>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: '#D4A843' }}>
            <Sparkles className="h-3 w-3" />
            Five Towns Daily Brief
          </div>
          {/* Dot indicators */}
          <div className="flex items-center gap-1">
            {slideKeys.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToSlide(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  height: '5px',
                  width: i === visibleSlide ? '18px' : '5px',
                  background: i === visibleSlide ? '#D4A843' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Gold rule */}
        <div className="mt-3 mb-3" style={{ height: '1px', background: 'linear-gradient(90deg, #D4A843 0%, rgba(212,168,67,0.15) 100%)' }} />

        {/* Slide label + slide name tabs (horizontal scroll, compact) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {slideLabels.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => goToSlide(i)}
              className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide transition-all"
              style={{
                background: i === visibleSlide ? '#D4A843' : 'rgba(255,255,255,0.08)',
                color: i === visibleSlide ? '#0a1628' : 'rgba(255,255,255,0.6)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Slides container */}
        <div className="mt-4 overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${visibleSlide * 100}%)` }}
        >

          {/* SLIDE 1 — Today */}
          <div className="min-w-full shrink-0">
            <div className="mb-3">
              <p className="text-[22px] font-black leading-tight tracking-tight">{englishDate}</p>
              <p className="mt-0.5 text-sm font-semibold" style={{ fontFamily: "'Heebo', 'Arial Hebrew', sans-serif", direction: 'rtl', color: '#D4A843' }}>
                {hebrewDate?.hebrewString || ''}
              </p>
              {hebrewDate?.display && (
                <p className="text-[11px] font-semibold" style={{ color: 'rgba(212,168,67,0.6)' }}>{hebrewDate.display}</p>
              )}
            </div>
            <div className="mb-3 rounded-xl px-3 py-2" style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)' }}>
              {candleLighting && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">🕯</span>
                  <span className="text-xs font-semibold text-white/70">Candle lighting</span>
                  <span className="text-xs font-black text-white">{candleLighting.timeStr}</span>
                  {candleLighting.parsha && <span className="ml-auto text-[10px] text-white/40">{candleLighting.parsha}</span>}
                </div>
              )}
              {zmanOfDay && !showShabbos && (
                <div className="flex items-center gap-2 mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(212,168,67,0.15)' }}>
                  <span className="text-sm">🕍</span>
                  <span className="text-xs font-semibold text-white/70">{zmanOfDay.label}</span>
                  <span className="text-xs font-black text-white">{zmanOfDay.timeStr}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {newsItems.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)', borderLeft: '2px solid #D4A843' }}>
                  <p className="text-[10px] font-black uppercase tracking-wide mb-0.5" style={{ color: '#D4A843' }}>{item.community_name}</p>
                  <p className="text-[13px] font-semibold leading-snug text-white">{item.title}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onOpenMap}
              className="motion-press mt-3 w-full rounded-xl py-2.5 text-[12px] font-black flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)' }}
            >
              <MapPin className="h-3.5 w-3.5" />
              View Five Towns Map
            </button>
          </div>

          {/* SLIDE 2 — Daily Mitzvah */}
          <div className="min-w-full shrink-0">
            <div className="flex items-start justify-between mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#4CAF7D' }}>Daily Mitzvah</p>
              {streak > 1 && (
                <span className="text-[11px] font-black" style={{ color: '#fb923c' }}>🔥 {streak} days in a row</span>
              )}
            </div>
            <p className="text-[19px] font-black leading-snug mb-1">
              {(safeBrief.topLocalUpdates?.[0]?.title) || 'Look for one small way to help a neighbor today.'}
            </p>
            <p className="text-xs mb-3 text-white/50">Five Towns · {englishDate}</p>

            {/* Progress bar */}
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-wide mb-2 text-white/40">Community progress</p>
              <div className="rounded-full overflow-hidden" style={{ height: '7px', background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="brief-progress-bar h-full rounded-full"
                  style={{ width: `${mitzvahProgress}%`, background: 'linear-gradient(90deg, #4CAF7D, #6fcf97)', animationDuration: '1.1s' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-white/20">Starting out</span>
                <span className="text-[9px] text-white/20">Community goal</span>
              </div>
            </div>

            {/* Composer box 1 — Mitzvah / act of kindness */}
            {(() => {
              const TARGETS = [
                { label: 'Yourself',    type: 'feed',    subtype: 'self_note' },
                { label: 'A Friend',    type: 'message', subtype: 'friend'    },
                { label: 'The Feed',    type: 'feed',    subtype: 'thought'   },
              ];
              const send = () => {
                const t = TARGETS.find(x => x.label === mitzvahShareTarget);
                if (t) onCreate(t.type, t.subtype, mitzvahText);
                setMitzvahText(''); setMitzvahShareTarget(null);
              };
              return (
                <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)' }}>
                  <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: '#4CAF7D' }}>✦ Share a mitzvah or act of kindness you did today</p>
                  <textarea
                    className="brief-share-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none mb-3"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${mitzvahText ? 'rgba(76,175,125,0.6)' : 'rgba(255,255,255,0.1)'}`, minHeight: '72px', lineHeight: '1.5' }}
                    placeholder="I helped a neighbor carry groceries today…"
                    value={mitzvahText}
                    onChange={e => setMitzvahText(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    {TARGETS.map(({ label }) => (
                      <button key={label} type="button"
                        onClick={() => { setMitzvahShareTarget(mitzvahShareTarget === label ? null : label); }}
                        className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                        style={{
                          background: mitzvahShareTarget === label ? '#4CAF7D' : 'rgba(255,255,255,0.09)',
                          color: mitzvahShareTarget === label ? '#081a10' : 'white',
                          border: `1px solid ${mitzvahShareTarget === label ? '#4CAF7D' : 'rgba(255,255,255,0.12)'}`,
                        }}
                      >{label}</button>
                    ))}
                    <button type="button" disabled className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      Communities ·
                    </button>
                    {mitzvahText.trim() && mitzvahShareTarget && (
                      <button type="button" onClick={send}
                        className="ml-auto rounded-full px-4 py-1.5 text-[12px] font-black transition-all"
                        style={{ background: '#4CAF7D', color: '#081a10' }}>
                        Share →
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Composer box 2 — Thought or Dvar Torah */}
            {(() => {
              const TARGETS = [
                { label: 'Yourself',    type: 'feed',    subtype: 'self_note' },
                { label: 'A Friend',    type: 'message', subtype: 'friend'    },
                { label: 'The Feed',    type: 'feed',    subtype: 'thought'   },
              ];
              const send = () => {
                const t = TARGETS.find(x => x.label === shareTarget);
                if (t) onCreate(t.type, t.subtype, thoughtText);
                setThoughtText(''); setShareTarget(null);
              };
              return (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <p className="text-[11px] font-black uppercase tracking-widest mb-3 text-white/60">📖 Share a thought or Dvar Torah</p>
                  <textarea
                    className="brief-share-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none mb-3"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${thoughtText ? 'rgba(76,175,125,0.6)' : 'rgba(255,255,255,0.1)'}`, minHeight: '72px', lineHeight: '1.5' }}
                    placeholder="This week's parsha teaches us…"
                    value={thoughtText}
                    onChange={e => setThoughtText(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    {TARGETS.map(({ label }) => (
                      <button key={label} type="button"
                        onClick={() => { setShareTarget(shareTarget === label ? null : label); }}
                        className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                        style={{
                          background: shareTarget === label ? '#4CAF7D' : 'rgba(255,255,255,0.09)',
                          color: shareTarget === label ? '#081a10' : 'white',
                          border: `1px solid ${shareTarget === label ? '#4CAF7D' : 'rgba(255,255,255,0.12)'}`,
                        }}
                      >{label}</button>
                    ))}
                    <button type="button" disabled className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      Communities ·
                    </button>
                    {thoughtText.trim() && shareTarget && (
                      <button type="button" onClick={send}
                        className="ml-auto rounded-full px-4 py-1.5 text-[12px] font-black transition-all"
                        style={{ background: '#4CAF7D', color: '#081a10' }}>
                        Share →
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* SLIDE 3 — Today's Events */}
          <div className="min-w-full shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#a78bfa' }}>Today&rsquo;s Events</p>
            <div className="space-y-2 mb-4">
              {eventItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-[11px] font-black shrink-0" style={{ color: '#a78bfa', minWidth: '52px' }}>{item.location_text || ''}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold leading-tight text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{item.community_name || item.location_text || 'Five Towns'}</p>
                  </div>
                </div>
              ))}
              {eventItems.length === 0 && (
                <p className="text-sm text-white/30 py-3 text-center">No events posted yet today.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onCreate('event', 'local_event', '')}
              className="motion-press w-full rounded-xl py-2.5 text-[12px] font-black transition-opacity hover:opacity-80"
              style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              + Post an event
            </button>
          </div>

          {/* SLIDE 4 — Mitzvahs Near You */}
          <div className="min-w-full shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#4CAF7D' }}>Mitzvahs Near You</p>
            <div className="space-y-2 mb-4">
              {mitzvahItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{
                    background: item.urgent ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.06)',
                    border: item.urgent ? '1px solid rgba(251,146,60,0.3)' : '1px solid transparent',
                  }}
                >
                  <div className="min-w-0 mr-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold leading-tight text-white">{item.title}</p>
                      {item.urgent && <span className="text-[10px] font-black shrink-0" style={{ color: '#fb923c' }}>⏳ Urgent</span>}
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5">{item.location_text || item.community_name || 'Five Towns'}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-black"
                    style={{ background: item.urgent ? 'rgba(251,146,60,0.2)' : 'rgba(76,175,125,0.15)', color: item.urgent ? '#fb923c' : '#4CAF7D' }}
                  >
                    Help →
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onCreate('help', 'chesed', '')}
              className="motion-press w-full rounded-xl py-2.5 text-[12px] font-black transition-opacity hover:opacity-80"
              style={{ background: 'rgba(76,175,125,0.12)', color: '#4CAF7D', border: '1px solid rgba(76,175,125,0.2)' }}
            >
              + Post a mitzvah
            </button>
          </div>

          {/* SLIDE 5 — Community Pulse */}
          <div className="min-w-full shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#D4A843' }}>Community Pulse</p>
            <p className="text-[19px] font-black leading-snug mb-4">What&rsquo;s happening in the Five Towns right now</p>
            <div className="space-y-2">
              {pulseStats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-base">{stat.emoji}</span>
                  <span className="text-[13px] font-semibold text-white">{stat.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SLIDE 6 — Shabbos Countdown (Thu/Fri only) */}
          {showShabbos && (() => {
            const lastChance = msUntilCandles !== null && msUntilCandles < 30 * 60_000 && msUntilCandles > 0;
            return (
              <div className="min-w-full snap-start text-center pt-2 pb-1">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: lastChance ? '#ef4444' : '#fb923c' }}>
                  {lastChance ? '⚠️ Last Chance' : 'Shabbos Countdown'}
                </p>
                {candleLighting?.parsha && (
                  <p className="text-[22px] font-black leading-tight mb-3 text-white">{candleLighting.parsha}</p>
                )}
                <div className={`mb-1 ${lastChance ? 'brief-last-chance' : ''}`}>
                  <span className="font-black leading-none tracking-tight" style={{ fontSize: lastChance ? '44px' : '52px', color: lastChance ? '#ef4444' : '#fb923c' }}>
                    {hoursUntil}h {minutesUntil}m
                  </span>
                </div>
                <p className="text-sm text-white/50 mb-1">until candle lighting</p>
                <p className="text-base font-black text-white">{candleLighting?.timeStr || '8:14 PM'} · Five Towns</p>
                <p className="mt-5 text-2xl font-black" style={{ fontFamily: "'Heebo', 'Arial Hebrew', sans-serif", color: '#D4A843' }}>
                  שבת שלום
                </p>
              </div>
            );
          })()}

        </div>
        </div>
      </div>
    </section>
  );
}

function MomentumTile({ icon: Icon, label, value, inverse = false }) {
  return (
    <div className={`rounded-2xl border p-2.5 text-center ${inverse ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-slate-50'}`}>
      <Icon className={`mx-auto h-4 w-4 ${inverse ? 'text-white' : 'text-blue-600'}`} />
      <p className={`mt-1 text-[16px] font-black leading-none ${inverse ? 'text-white' : 'text-slate-950'}`}>{value}</p>
      <p className={`mt-1 text-[10px] font-black uppercase tracking-wide ${inverse ? 'text-white/75' : 'text-slate-400'}`}>{label}</p>
    </div>
  );
}

function FiveTownsThreadChain({ posts = [], likedPostIds = [], onLike, onReply, onOpen, onMap, onCreate }) {
  const chainPosts = posts
    .filter((post) => post.type !== 'prompt')
    .slice(0, 8);

  if (!chainPosts.length) return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-300" />
            </span>
            <h2 className="text-[14px] font-black uppercase tracking-wide text-slate-950">Community Thread</h2>
          </div>
          <p className="mt-1 text-[12px] font-semibold leading-4 text-slate-400">Be the first to post something for the Five Towns today.</p>
        </div>
        <button type="button" onClick={onCreate} className="motion-press shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[12px] font-black text-white">Post now</button>
      </div>
    </section>
  );

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_5px_rgba(239,68,68,0.12)]" />
            </span>
            <h2 className="text-[14px] font-black uppercase tracking-wide text-slate-950">Happening Now</h2>
          </div>
          <p className="mt-1 text-[12px] font-semibold leading-4 text-slate-400">
            Minyan needs, rides, volunteer requests, events starting soon, and active local threads.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="motion-press shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[12px] font-black text-white"
        >
          Post now
        </button>
      </div>

      <div className="relative px-3 py-3">
        <div className="absolute bottom-7 left-[30px] top-5 w-px bg-slate-200" />
        <div className="space-y-2">
          {chainPosts.map((post, index) => (
            <ThreadChainItem
              key={`main-chain-${post.id}`}
              post={post}
              first={index === 0}
              liked={likedPostIds.includes(post.id)}
              onLike={() => onLike?.(post.id)}
              onReply={() => onReply?.(post)}
              onOpen={() => onOpen?.(post)}
              onMap={onMap}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ThreadChainItem({ post, first = false, liked = false, onLike, onReply, onOpen, onMap }) {
  const intent = getCardIntent(post);
  const tone = toneClasses[intent.tone] || toneClasses.slate;
  const Icon = intent.icon || MessageCircle;
  const title = feedText(post);
  const body = feedBody(post);
  const age = formatPostAge(postDate(post));
  const replies = Number(post.comments_count || 0);
  const reactions = Number(post.likes_count || 0);
  const aliveCue = getAliveCue(post);
  const location = post.location_text || post.city || post.community_name || 'Five Towns';
  const peopleText = post.type === 'help'
    ? `${Math.max(1, replies || 1)} people helping`
    : replies > 0
      ? `${replies} replies`
      : reactions > 0
        ? `${reactions} reactions`
        : 'Open for replies';

  return (
    <article className="relative pl-12">
      <div className={`absolute left-0 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white text-[11px] font-black text-white shadow-sm ${first ? 'bg-emerald-600' : 'bg-blue-600'}`}>
        {(post.author_name || 'J').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      <div className="rounded-[20px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${tone.pill}`}>
              <Icon className="h-3 w-3" />
              {intent.label}
            </span>
            {first && (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">Live thread</span>
            )}
            {Number(getPostLivePriority(post)) > 0 && !first && (
              <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">Needs attention</span>
            )}
            <span className="ml-auto text-[11px] font-black text-slate-400">{age}</span>
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[12px] font-bold text-slate-500">
            <span className="truncate text-slate-700">{post.author_name || 'Neighbor'}</span>
            <span>•</span>
            <span className="truncate">{location}</span>
          </div>

          <h3 className="mt-1 line-clamp-2 text-[16px] font-black leading-5 text-slate-950">{title}</h3>
          {body && <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-5 text-slate-500">{body}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-black text-slate-500">
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{aliveCue}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">{peopleText}</span>
            {post.community_name && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{post.community_name}</span>}
            {post.location_text && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{post.location_text}</span>}
          </div>
        </button>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <div className="flex min-w-0 items-center gap-1">
            <button type="button" onClick={onLike} className={`motion-press rounded-full px-2.5 py-1.5 text-[12px] font-black ${liked ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
              <Heart className="inline h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onReply} className="motion-press rounded-full bg-slate-50 px-2.5 py-1.5 text-[12px] font-black text-slate-600">
              <MessageCircle className="mr-1 inline h-3.5 w-3.5" />
              Reply
            </button>
            {(post.location_text || matchesText(post, /map|restaurant|business|pickup|ride/)) && (
              <button type="button" onClick={onMap} className="motion-press rounded-full bg-slate-50 px-2.5 py-1.5 text-[12px] font-black text-slate-600">
                <MapPin className="inline h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button type="button" onClick={onReply} className={`motion-press inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-black ${tone.cta}`}>
            {intent.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function CommunityFeedSection({ section, dense = false, likedPostIds = [], onLike, onReply, onOpen, onMap }) {
  const Icon = section.icon || MessageCircle;
  if (!section.items?.length) {
    return (
      <section className="rounded-[24px] border border-dashed border-slate-200 bg-white/80 p-4 text-center">
        <Icon className="mx-auto h-5 w-5 text-slate-300" />
        <p className="mt-2 text-[14px] font-black text-slate-800">{section.title}</p>
        <p className="mx-auto mt-1 max-w-xs text-[12px] font-semibold leading-5 text-slate-500">
          This space is ready for a real local note people can use today.
        </p>
        <button type="button" onClick={onReply} className="motion-press mt-3 rounded-full bg-slate-950 px-4 py-2 text-[12px] font-black text-white">
          Start a post
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {section.key === 'happening-now' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${section.key === 'happening-now' ? 'bg-red-500' : section.key === 'upcoming' ? 'bg-orange-500' : 'bg-blue-500'}`} />
            </span>
            <h2 className="text-[14px] font-black uppercase tracking-wide text-slate-950">{section.title}</h2>
          </div>
          <p className="mt-1 text-[12px] font-semibold leading-4 text-slate-400">{section.subtitle}</p>
          {Boolean(section.pills?.length) && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
              {section.pills.map((pill) => (
                <span
                  key={`${section.key}-${pill}`}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600"
                >
                  {pill}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500">{section.items.length}</span>
      </div>

      <div className={dense ? 'mobile-scroll-x flex gap-2 p-3' : 'grid gap-2 p-3'}>
        {section.items.map((post) => (
          <HeartbeatPostCard
            key={`${section.key}-${post.id}`}
            post={post}
            horizontal={dense}
            liked={likedPostIds.includes(post.id)}
            onLike={() => onLike?.(post.id)}
            onReply={() => onReply?.(post)}
            onOpen={() => onOpen?.(post)}
            onMap={onMap}
          />
        ))}
      </div>
    </section>
  );
}

function HeartbeatPostCard({ post, horizontal = false, liked = false, onLike, onReply, onOpen, onMap }) {
  const intent = getCardIntent(post);
  const tone = toneClasses[intent.tone] || toneClasses.slate;
  const Icon = intent.icon || MessageCircle;
  const title = feedText(post);
  const body = feedBody(post);
  const age = formatPostAge(postDate(post));
  const replies = Number(post.comments_count || 0);
  const reactions = Number(post.likes_count || 0);
  const aliveCue = getAliveCue(post);
  const activityText = post.type === 'help'
    ? `${Math.max(1, replies || 1)} people responding`
    : replies > 0
      ? `${replies} replies`
      : reactions > 0
        ? `${reactions} reactions`
        : 'Be first to reply';
  const location = post.location_text || post.city || post.community_name || 'Five Towns';

  return (
    <article
      className={`group relative min-w-0 max-w-full shrink-0 rounded-[20px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        horizontal ? 'w-[min(270px,calc(100vw-48px))] sm:w-[300px]' : 'w-full'
      }`}
    >
      <div className={`absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b ${tone.bar}`} />
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${tone.pill}`}>
              <Icon className="h-3 w-3" />
              {intent.label}
            </span>
            {Number(getPostLivePriority(post)) > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">Active now</span>
            )}
          </div>
          <span className="shrink-0 text-[11px] font-black text-slate-400">{age}</span>
        </div>

        <div className="mt-3 flex items-start gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white shadow-sm">
            {(post.author_name || 'J').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5 text-[12px] font-bold text-slate-500">
              <span className="truncate text-slate-700">{post.author_name || 'Neighbor'}</span>
              <span>•</span>
              <span className="truncate">{location}</span>
            </div>
            <h3 className="mt-1 line-clamp-2 text-[16px] font-black leading-5 text-slate-950">{title}</h3>
            {body && <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-5 text-slate-500">{body}</p>}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-black text-slate-500">
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{aliveCue}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{activityText}</span>
          {post.community_name && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{post.community_name}</span>}
          {post.location_text && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{post.location_text}</span>}
        </div>
      </button>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onLike} className={`motion-press rounded-full px-2.5 py-1.5 text-[12px] font-black ${liked ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
            <Heart className="inline h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onReply} className="motion-press rounded-full bg-slate-50 px-2.5 py-1.5 text-[12px] font-black text-slate-600">
            <MessageCircle className="mr-1 inline h-3.5 w-3.5" />
            Reply
          </button>
          {(post.location_text || matchesText(post, /map|restaurant|business|pickup/)) && (
            <button type="button" onClick={onMap} className="motion-press rounded-full bg-slate-50 px-2.5 py-1.5 text-[12px] font-black text-slate-600">
              <MapPin className="inline h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button type="button" onClick={onReply} className={`motion-press inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-black ${tone.cta}`}>
          {intent.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function FiveTownsConversationHub({ posts = [], networkLabel = 'Five Towns', onCreate, onOpenMap, onOpenMitzvah, onOpenEvents, onOpenMarketplace }) {
  // Include daily_greeting posts so the "updated" timestamp always reflects today's auto-post
  const allPosts = [...posts];
  const recentPosts = allPosts
    .filter((post) => post.type !== 'prompt' && post.type !== 'daily_greeting')
    .slice(0, 4);
  const activeThreads = allPosts.filter((post) => Number(post.comments_count || 0) > 0).length;
  const needsToday = allPosts.filter((post) => /need|help|ride|meal|tonight|today|urgent/i.test(`${post.title || ''} ${post.body || ''}`)).length;
  // Prefer daily_greeting post's timestamp so the hub always shows "updated today"
  const greetingPost = allPosts.find((post) => post.type === 'daily_greeting');
  const latest = greetingPost || recentPosts[0];
  const latestDate = latest?.updated_date || latest?.created_date || latest?.created_at || new Date().toISOString();
  const updatedText = latestDate
    ? (() => {
      const minutes = Math.max(1, Math.round((Date.now() - new Date(latestDate).getTime()) / 60000));
      if (minutes < 60) return `Updated ${minutes} min ago`;
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `Updated ${hours} hr${hours === 1 ? '' : 's'} ago`;
      const days = Math.round(hours / 24);
      if (days < 7) return `Updated ${days}d ago`;
      const weeks = Math.round(days / 7);
      return `Updated ${weeks}w ago`;
    })()
    : 'Ready for the first useful post';

  const actions = [
    {
      label: 'Ask neighbors',
      detail: 'Fast local answer',
      icon: MessageCircle,
      onClick: () => onCreate('feed', 'question', ''),
    },
    {
      label: 'Need help',
      detail: 'Meals, rides, favors',
      icon: Handshake,
      onClick: () => onCreate('help', 'chesed', ''),
    },
    {
      label: 'Plan something',
      detail: 'Event or meetup',
      icon: CalendarDays,
      onClick: () => onCreate('event', 'local_event', ''),
    },
    {
      label: 'Business update',
      detail: 'Useful, not spam',
      icon: Store,
      onClick: () => onCreate('marketplace', 'business_update', ''),
    },
    {
      label: 'Mitzvah',
      detail: 'Share or step up',
      icon: Sparkles,
      onClick: () => onCreate('help', 'mitzvah', ''),
    },
  ];

  const supportingLinks = [
    { label: 'Mitzvahs', icon: Handshake, onClick: onOpenMitzvah },
    { label: 'Map', icon: MapPin, onClick: onOpenMap },
    { label: 'Events', icon: CalendarDays, onClick: onOpenEvents },
    { label: 'Marketplace', icon: Store, onClick: onOpenMarketplace },
  ];

  return (
    <section className="mb-3 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.07)]">
      <div className="bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/75">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Main community thread
            </p>
            <h2 className="mt-2 text-[20px] font-black leading-tight">Talk to the Five Towns</h2>
            <p className="mt-1 max-w-xl text-[12px] font-semibold leading-5 text-white/75">
              The main thread for questions, plans, rides, needs, events, and useful local updates.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right">
            <p className="text-[16px] font-black leading-none">{activeThreads}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-white/60">active</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide text-white/65">
          <span>{recentPosts.length} recent posts</span>
          <span>•</span>
          <span>{needsToday} needs today</span>
          <span>•</span>
          <span>{updatedText}</span>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="motion-press rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50"
              >
                <Icon className="h-4 w-4 text-blue-600" />
                <p className="mt-1.5 text-[13px] font-black text-slate-950">{action.label}</p>
                <p className="mt-0.5 text-[11px] font-bold text-slate-500">{action.detail}</p>
              </button>
            );
          })}
        </div>

        <div className="mobile-scroll-x flex gap-2 pb-1">
          {supportingLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className="motion-press inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700"
              >
                <Icon className="h-3.5 w-3.5 text-blue-600" />
                {link.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onCreate('feed', 'carpool', '')}
            className="motion-press inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700"
          >
            <Car className="h-3.5 w-3.5 text-blue-600" />
            Carpool
          </button>
        </div>
      </div>
    </section>
  );
}

class WidgetBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: true }; }
  render() { return this.state.crashed ? null : this.props.children; }
}
