import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dataService, feedRetentionService, shabbatReminderService, storageService, togglePostLike } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { appParams } from '@/lib/app-params';
import { toast } from 'sonner';
import ReportModal from '@/components/common/ReportModal';
import PageHelp from '@/components/common/PageHelp';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Activity, ArrowRight, CalendarDays, Car, Handshake, Heart, MapPin, MessageCircle, Plus, RefreshCw, Search, Sparkles, Store, Users } from 'lucide-react';
import SkeletonCard from '@/components/common/SkeletonCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LOCAL_NETWORKS } from '@/lib/localNetworks';
import { useFloatingActions } from '@/components/layout/FloatingActionsContext';
import DestinationHeader from '@/components/layout/DestinationHeader';
import useFeedData from '@/components/feed/useFeedData';
import FeedFilters, { FeedFilterTrigger } from '@/components/feed/FeedFilters';
import FeedComposer from '@/components/feed/FeedComposer';
import FeedPost from '@/components/feed/FeedPost';
import TodayFiveTownsCard from '@/components/feed/TodayFiveTownsCard';

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
  // CommentsSheet is now handled inside each UnifiedPostCard via createPortal
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
  const canShowPreviewContent = !import.meta.env.PROD;

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
    enabled: !!currentUser?.id && appParams.hasBackendConfig,
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
    const intent = getCardIntent(post);
    if (intent.label === 'Help needed') {
      navigate('/MitzvahCircle');
      return;
    }
    if (intent.label === 'Event') {
      openComposer({
        type: 'event',
        subtype: 'reply',
        initialBody: `I want to join: ${feedText(post)}`,
      });
      return;
    }
    if (intent.label === 'Local listing') {
      navigate('/Marketplace');
      return;
    }
    openComposer({
      type: 'feed',
      subtype: 'reply',
      initialBody: `Replying to ${post.author_name || 'a neighbor'} about "${feedText(post)}"...`,
    });
  }, [navigate, openComposer, recordInterest]);

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

      <div className="mobile-page px-3 pt-2 mobile-safe-bottom">
        <div className="flex items-center gap-1.5 mb-3">
          <h1 className="text-[20px] font-black text-slate-950">Five Towns Feed</h1>
          <PageHelp text="The main local thread for questions, plans, needs, businesses, carpools, events, and neighbor-to-neighbor help." />
        </div>

        <FiveTownsBrief
          brief={dailyBrief}
          momentum={feedMomentum}
          posts={feedPosts}
          joinedCommunityIds={joinedCommunityIds}
          prompt={dailyPrompt}
          onOpenMap={() => navigate('/Map')}
          onOpenCommunities={() => navigate('/Communities')}
          onCreate={(type, subtype, body) => openComposer({ type, subtype, initialBody: body })}
        />

        <TodayFiveTownsCard />

        <FiveTownsConversationHub
          posts={feedPosts}
          networkLabel={primaryNetwork.shortLabel || 'Five Towns'}
          onCreate={(type, subtype, body) => openComposer({ type, subtype, initialBody: body })}
          onOpenMap={() => navigate('/Map')}
          onOpenMitzvah={() => navigate('/MitzvahCircle')}
          onOpenEvents={() => openComposer({ type: 'event', subtype: 'local_event', initialBody: '' })}
          onOpenMarketplace={() => navigate('/Marketplace')}
        />

        <FiveTownsThreadChain
          posts={feedPosts}
          likedPostIds={userLikes}
          onLike={handleLike}
          onReply={handleCardReply}
          onOpen={handleCardOpen}
          onMap={() => navigate('/Map')}
          onCreate={() => openComposer({ type: 'feed', subtype: 'discussion', initialBody: '' })}
        />

        {/* One-time network banner for new users */}
        {showNetworkBanner && (
          <div className="graphic-stripes mb-3 flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-4 py-3 text-white text-[12px] font-medium shadow-[0_14px_30px_rgba(37,99,235,0.18)]">
            <span className="text-lg">{primaryNetwork.emoji}</span>
            <span className="flex-1">You're viewing <strong>{primaryNetwork.shortLabel}</strong> — tap the chip above to switch networks.</span>
            <button onClick={() => { setShowNetworkBanner(false); storageService.setItem('junited_network_banner_v2_dismissed', '1'); }} className="text-white/70 hover:text-white text-lg leading-none font-bold flex-shrink-0">×</button>
          </div>
        )}

        {isPreviewContent && (
          <div className="mb-3 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
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

        {appParams.hasBackendConfig && communitiesFetched && communityGroups.length === 0 && (
          <div className="mb-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
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

        {isLoading && !loadTimedOut && (
          <div key="loading-mainstream" className="motion-stagger space-y-3 tab-fade-in">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} hasImage={i === 1} />
            ))}
          </div>
        )}
        {(isLoading && loadTimedOut && feedPosts.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">🌿</div>
            <p className="text-[15px] font-bold text-slate-700 mb-1">No posts yet — share a recommendation or ask the community for help.</p>
            <p className="text-[13px] text-slate-400">Be the first to post something!</p>
          </div>
        )}
        {(!isLoading || loadTimedOut) && feedPosts.length > 0 && (
          <div key="feed-mainstream" className="motion-stagger tab-fade-in space-y-3">
            {isError && (
              <p className="text-[12px] text-slate-400 text-center px-4 py-2">Showing cached posts — pull down to refresh.</p>
            )}

            {feedSections.map((section, index) => (
              <CommunityFeedSection
                key={section.key}
                section={section}
                dense={section.key !== 'today'}
                likedPostIds={userLikes}
                onLike={handleLike}
                onReply={handleCardReply}
                onOpen={handleCardOpen}
                onMap={() => navigate('/Map')}
              />
            ))}

            <details className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-black text-slate-900">
                Full thread history
                <span className="ml-2 text-[11px] font-bold text-slate-400">{feedPosts.length} posts</span>
              </summary>
              <div className="space-y-2 border-t border-slate-100 p-2">
                {feedPosts.slice(0, 10).map((post) => (
                  <FeedPost
                    key={`history-${post.id}`}
                    post={post}
                    currentUser={currentUser}
                    liked={userLikes.includes(post.id)}
                    onLike={handleLike}
                    onComment={handleComment}
                    onDelete={handleDelete}
                    onBlock={handleBlock}
                    blockedIds={blockedIds}
                    onReport={handleReport}
                    communities={communityGroups}
                    onCommunityClick={handleCommunityClick}
                    isFromJoinedCommunity={post.community_id && joinedCommunityIds.has(post.community_id)}
                  />
                ))}
              </div>
            </details>

            {/* Load more */}
            {hasNextPage && (
              <div className="p-4 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isLoading}
                  className="motion-press px-6 py-2 rounded-full bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Loading…' : 'Load more posts'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}

function FiveTownsBrief({ brief, momentum, posts = [], joinedCommunityIds, prompt, onOpenMap, onOpenCommunities, onCreate }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const briefScrollerRef = useRef(null);
  if (!brief) return null;

  const curatedNewsItems = (brief.topLocalUpdates || []).map((item, index) => ({
    id: item.id || `curated-local-${index}`,
    title: item.title || 'Verified local update',
    body: item.summary || item.detail || '',
    community_name: item.source_label || item.source || 'Verified local source',
    location_text: item.location || 'Five Towns',
  }));
  const fallbackNewsItems = posts
    .filter((post) => post.type === 'news' || /update|brief|eruv|traffic|school|notice|local/i.test(`${post.title || ''} ${post.body || ''}`))
    .slice(0, 3);
  const newsItems = curatedNewsItems.length ? curatedNewsItems : fallbackNewsItems;
  const trendingPosts = [...posts]
    .sort((a, b) => ((b.comments_count || 0) * 2 + (b.likes_count || 0)) - ((a.comments_count || 0) * 2 + (a.likes_count || 0)))
    .slice(0, 3);
  const mitzvahNeeds = posts
    .filter((post) => post.type === 'help' || /help|chesed|meal|ride|offer|volunteer/i.test(`${post.title || ''} ${post.body || ''}`))
    .slice(0, 3);
  const communityEvents = posts
    .filter((post) => post.type === 'event' && (!joinedCommunityIds?.size || joinedCommunityIds.has(post.community_id)))
    .slice(0, 3);

  const slides = [
    {
      key: 'news',
      eyebrow: 'Five Towns News',
      title: brief.title || 'Today in the Five Towns',
      subtitle: brief.verifiedLocalBrief
        ? 'Curated local updates worth knowing today.'
        : 'Useful local prompts until verified updates are published.',
      items: newsItems,
      tone: 'from-slate-950 via-blue-900 to-cyan-800',
      empty: 'No major local news posts yet today.',
      actionLabel: 'Open map',
      onAction: onOpenMap,
    },
    {
      key: 'trending',
      eyebrow: 'Trending Posts',
      title: 'What neighbors are talking about',
      subtitle: `${momentum.activeThreads} active conversations are pulling people in.`,
      items: trendingPosts,
      tone: 'from-indigo-950 via-blue-800 to-violet-700',
      empty: 'No trending posts yet. Start the thread people need.',
      actionLabel: 'Open communities',
      onAction: onOpenCommunities,
    },
    {
      key: 'mitzvah',
      eyebrow: 'Mitzvahs Near You',
      title: 'Help that needs a real person',
      subtitle: 'Meals, rides, favors, and chesed that should not sit unanswered.',
      items: mitzvahNeeds,
      tone: 'from-emerald-950 via-emerald-800 to-teal-700',
      empty: 'No open chesed threads surfaced yet.',
      actionLabel: 'Post help',
      onAction: () => onCreate('help', 'chesed', ''),
    },
    {
      key: 'events',
      eyebrow: 'Events In Your Communities',
      title: 'What is coming up',
      subtitle: 'Shiurim, meetups, school moments, and local plans that belong on your radar.',
      items: communityEvents,
      tone: 'from-rose-950 via-fuchsia-800 to-orange-700',
      empty: 'No community events posted yet.',
      actionLabel: 'Share event',
      onAction: () => onCreate('event', 'local_event', ''),
    },
  ];

  const promptText = prompt?.prompt || prompt?.title || prompt?.body;

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.07)]">
      <div className={`graphic-stripes bg-gradient-to-br ${slides[activeSlide].tone} p-4 text-white`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/80">
            <Sparkles className="h-3.5 w-3.5" />
            Five Towns Daily Brief
          </div>
          <div className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-black text-white/90">
            {activeSlide + 1}/{slides.length}
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {slides.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActiveSlide(index);
                briefScrollerRef.current?.scrollTo({
                  left: briefScrollerRef.current.clientWidth * index,
                  behavior: 'smooth',
                });
              }}
              className={`motion-press shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                index === activeSlide ? 'bg-white text-slate-950' : 'border border-white/15 bg-white/10 text-white/90'
              }`}
            >
              {item.eyebrow}
            </button>
          ))}
        </div>

        {promptText && (
          <button
            type="button"
            onClick={() => onCreate('feed', 'daily_prompt', '')}
            className="motion-press mt-3 w-full rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-left backdrop-blur-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-wide text-white/65">Today’s prompt</p>
            <p className="mt-0.5 line-clamp-2 text-[13px] font-black leading-5 text-white">{promptText}</p>
          </button>
        )}

        <div
          ref={briefScrollerRef}
          className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
          onScroll={(event) => {
            const node = event.currentTarget;
            const slideWidth = Math.max(node.clientWidth, 1);
            const rawIndex = node.scrollLeft / slideWidth;
            const nextIndex = Math.round(rawIndex);
            if (Math.abs(rawIndex - nextIndex) <= 0.18 && nextIndex !== activeSlide && nextIndex >= 0 && nextIndex < slides.length) {
              setActiveSlide(nextIndex);
            }
          }}
        >
          {slides.map((item) => (
            <div key={`slide-${item.key}`} className="min-w-full snap-start">
              <p className="text-[11px] font-black uppercase tracking-wide text-white/75">{item.eyebrow}</p>
              <h2 className="mt-1 text-[21px] font-black leading-tight">{item.title}</h2>
              <p className="mt-1 max-w-2xl text-sm font-semibold text-white/85">{item.subtitle}</p>

              <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto]">
                <div className="grid gap-2 sm:grid-cols-3">
                  {item.items.length > 0 ? item.items.map((post) => (
                    <div key={`${item.key}-${post.id}`} className="rounded-2xl border border-white/15 bg-white/12 px-3 py-3 backdrop-blur-sm">
                      <p className="line-clamp-2 text-[13px] font-black leading-5 text-white">{post.title || post.body || 'Community update'}</p>
                      <p className="mt-2 text-[11px] font-semibold text-white/75">
                        {post.community_name || post.location_text || 'Five Towns'}
                      </p>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-white/15 bg-white/12 px-3 py-3 text-[13px] font-bold text-white/90 sm:col-span-3">
                      {item.empty}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={item.onAction}
                  className="motion-press inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[12px] font-black text-slate-950 lg:self-end"
                >
                  {item.actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MomentumTile inverse icon={MessageCircle} label="Hot threads" value={momentum.activeThreads} />
          <MomentumTile inverse icon={Activity} label="For you" value={momentum.joinedPosts} />
          <MomentumTile inverse icon={CalendarDays} label="Events" value={momentum.localEvents} />
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

  if (!chainPosts.length) return null;

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
        <p className="mt-1 text-[12px] font-semibold text-slate-400">Nothing here yet. Start the first useful thread.</p>
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
      className={`group relative shrink-0 rounded-[20px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        horizontal ? 'w-[270px] sm:w-[300px]' : 'w-full'
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
  const recentPosts = posts
    .filter((post) => post.type !== 'prompt')
    .slice(0, 4);
  const activeThreads = posts.filter((post) => Number(post.comments_count || 0) > 0).length;
  const needsToday = posts.filter((post) => /need|help|ride|meal|tonight|today|urgent/i.test(`${post.title || ''} ${post.body || ''}`)).length;
  const latest = recentPosts[0];
  const latestDate = latest?.updated_date || latest?.created_date || latest?.created_at;
  const updatedText = latestDate
    ? (() => {
      const minutes = Math.max(1, Math.round((Date.now() - new Date(latestDate).getTime()) / 60000));
      if (minutes < 60) return `Updated ${minutes} min ago`;
      const hours = Math.round(minutes / 60);
      return `Updated ${hours} hr${hours === 1 ? '' : 's'} ago`;
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
