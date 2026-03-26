import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Calendar, Search, Plus, Bell, HandHeart, X, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import InlineFeedPrompt from '@/components/feed/InlineFeedPrompt';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import UnifiedPostModal from '@/components/feed/UnifiedPostModal';
import CommentsSheet from '@/components/feed/CommentsSheet';
import ReportModal from '@/components/common/ReportModal';
import ProfileSetup from '@/components/profile/ProfileSetup';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import PostTypeSelector from '@/components/feed/PostTypeSelector';
import CommunityAlertModal from '@/components/feed/CommunityAlertModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import SearchModal from '@/components/feed/SearchModal';
import PostBox from '@/components/feed/PostBox';
import HomeFeedTabs from '@/components/feed/HomeFeedTabs';
import CommunityActivityStrip from '@/components/feed/CommunityActivityStrip';
import EventsFeedSection from '@/components/feed/EventsFeedSection';
import EventsForYou from '@/components/feed/EventsForYou';
import PushNotificationPrompt from '@/components/feed/PushNotificationPrompt';

import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Feed() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postModalType, setPostModalType] = useState('feed');
  const [showPromptReply, setShowPromptReply] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [pinnedPrompt, setPinnedPrompt] = useState(null);
  const [userLikes, setUserLikes] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [showFAB, setShowFAB] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [feedPrompts, setFeedPrompts] = useState([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All Five Towns');
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const scrollTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

  const { isRefreshing, pullDistance } = usePullToRefresh(async () => {
    await refetchPosts();
  });

  const NEIGHBORHOODS = ['All Five Towns', 'Lawrence', 'Cedarhurst', 'Woodmere', 'Hewlett', 'Inwood', 'Far Rockaway'];

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        await Promise.allSettled([loadPinnedPrompt(), loadUserLikes(user), loadFeedPrompts(), loadBlocks(user)]);
        // Show onboarding once per user if not yet done
        const onboardingKey = `onboarding_done_${user.id}`;
        if (user.is_profile_complete && !user.onboarding_complete && !localStorage.getItem(onboardingKey)) {
          setShowOnboarding(true);
        }
      } catch (e) {
        setCurrentUser({ id: 'guest', full_name: 'Guest', display_name: 'Guest', role: 'user', is_profile_complete: true });
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const currentScrollY = window.scrollY;
        setIsScrollingDown(currentScrollY > lastScrollY);
        setLastScrollY(currentScrollY);
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [lastScrollY]);

  const loadPinnedPrompt = async () => {
    try {
      const prompts = await base44.entities.DailyPrompt.filter({ is_pinned: true });
      if (prompts.length > 0) setPinnedPrompt(prompts[0]);
      else {
        const newest = await base44.entities.DailyPrompt.list('-created_date', 1);
        if (newest.length > 0) setPinnedPrompt(newest[0]);
      }
    } catch (e) {}
  };

  const loadFeedPrompts = async () => {
    try {
      const prompts = await base44.entities.DailyPrompt.list('-created_date', 5);
      setFeedPrompts(prompts);
      // Seed example community prompts if none exist
      const existing = await base44.entities.UnifiedPost.filter({ type: 'prompt' }, '-created_date', 1);
      if (existing.length === 0) {
        const EXAMPLE_PROMPTS = [
          "What are your Shabbos plans this week?",
          "Anyone hosting or looking for a Shabbos meal?",
          "Best kosher takeout for Thursday night?",
          "Who's going to Israel this summer?",
        ];
        for (const q of EXAMPLE_PROMPTS) {
          await base44.entities.UnifiedPost.create({
            user_id: 'system',
            user_name: 'Community',
            type: 'prompt',
            board: 'feed',
            body: q,
            city: 'Five Towns',
            comments_count: 0,
            is_seeded: true,
          });
        }
      }
    } catch (e) {}
  };

  const loadBlocks = async (user) => {
    try {
      const blocks = await base44.entities.Block.filter({ blocker_id: user.id });
      setBlockedIds(blocks.map(b => b.blocked_id));
    } catch (e) {}
  };

  const handleBlock = async (userId) => {
    await base44.entities.Block.create({ blocker_id: currentUser.id, blocked_id: userId });
    setBlockedIds(prev => [...prev, userId]);
    toast.success('User blocked');
  };

  const loadUserLikes = async (user) => {
    try {
      const likes = await base44.entities.Like.filter({ user_id: user.id });
      setUserLikes(likes.map(l => l.post_id));
    } catch (e) {}
  };

  const FEED_CACHE_KEY = 'feed_posts_cache';

  const getCachedPosts = () => {
    try {
      const cached = localStorage.getItem(FEED_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  };

  const [cachedPosts, setCachedPosts] = useState(getCachedPosts);

  const { data: posts = [], isLoading, isError, refetch: refetchPosts } = useQuery({
    queryKey: ['unified-posts'],
    queryFn: async () => {
      const result = await base44.entities.UnifiedPost.list('-created_date', 40);
      try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(result)); } catch {}
      setCachedPosts(result);
      return result;
    },
    staleTime: 3600000,
    gcTime: 7200000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    enabled: !!currentUser
  });

  const { data: communityGroups = [] } = useQuery({
    queryKey: ['community-groups-feed'],
    queryFn: () => base44.entities.CommunityGroup.list('-member_count', 10),
    staleTime: 3600000,
    retry: 0,
    enabled: !!currentUser
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UnifiedPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
      toast.success('Post deleted');
    }
  });

  const handleLike = async (postId) => {
    const isLiked = userLikes.includes(postId);
    const post = (queryClient.getQueryData(['unified-posts']) || posts).find(p => p.id === postId);
    // Optimistic UI update — instant feedback
    setUserLikes(prev => isLiked ? prev.filter(id => id !== postId) : [...prev, postId]);
    queryClient.setQueryData(['unified-posts'], old =>
      old?.map(p => p.id === postId
        ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + (isLiked ? -1 : 1)) }
        : p
      )
    );
    // Background sync
    if (isLiked) {
      const like = await base44.entities.Like.filter({ post_id: postId, user_id: currentUser.id });
      if (like[0]) await base44.entities.Like.delete(like[0].id);
    } else {
      await base44.entities.Like.create({ post_id: postId, user_id: currentUser.id });
      if (post?.user_id && post.user_id !== currentUser.id) {
        base44.entities.Notification.create({
          user_id: post.user_id, type: 'like',
          message: `${currentUser.display_name || currentUser.full_name} liked your post`,
          read: false
        });
      }
    }
    base44.entities.UnifiedPost.update(postId, {
      likes_count: Math.max(0, (post?.likes_count || 0) + (isLiked ? -1 : 1))
    });
  };

  const handleReport = (id, type) => {
    setReportTarget({ id, type });
    setShowReport(true);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!currentUser.is_profile_complete) {
    return <ProfileSetup user={currentUser} onComplete={() => base44.auth.me().then(setCurrentUser)} />;
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        user={currentUser}
        onComplete={() => {
          setShowOnboarding(false);
          base44.auth.me().then(setCurrentUser);
        }}
      />
    );
  }

  const activePosts = posts.length > 0 ? posts : cachedPosts;
  const visiblePosts = activePosts.filter(p => {
    if (p.type === 'dating') return false;
    if (p.type === 'prompt' && activeTab !== 'trending' && activeTab !== 'for_you' && activeTab !== 'social') return false;
    if (blockedIds.includes(p.user_id)) return false;
    if (selectedNeighborhood !== 'All Five Towns') {
      const loc = (p.location_text || p.city || '').toLowerCase();
      if (loc && !loc.includes(selectedNeighborhood.toLowerCase())) return false;
    }
    return true;
  });
  const trendingScore = (p) => (p.likes_count || 0) + (p.comments_count || 0) * 2;

  const feedPosts = (() => {
    const sorted = [...visiblePosts].sort((a, b) => trendingScore(b) - trendingScore(a));
    if (activeTab === 'for_you') {
      const userInterests = currentUser?.interests || [];
      const userCity = currentUser?.cityPreset || '';
      return sorted.filter(p => {
        if (userInterests.length === 0 && !userCity) return true;
        const bodyLower = (p.body || '').toLowerCase();
        const interestMatch = userInterests.some(i => bodyLower.includes(i.toLowerCase()));
        const cityMatch = userCity && (p.city || p.location_text || '').toLowerCase().includes(userCity.toLowerCase());
        return interestMatch || cityMatch || (p.user_id === currentUser?.id);
      }).slice(0, 40);
    }
    if (activeTab === 'trending') return sorted.slice(0, 40);
    if (activeTab === 'chessed') return sorted.filter(p => p.type === 'help' || p.board === 'help');
    if (activeTab === 'learning') return sorted.filter(p => p.type === 'news' || /torah|parsha|daf|halacha|shiur/i.test(p.body || ''));
    if (activeTab === 'social') return sorted.filter(p => p.type === 'feed');
    if (activeTab === 'nearby') return sorted.filter(p => p.city);
    if (activeTab === 'events') return sorted.filter(p => p.type === 'event' || p.board === 'events');
    return sorted.slice(0, 40);
  })();

  return (
    <div className="min-h-screen relative" style={{ background: '#F8FAFC' }}>
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-30">
          <div className={`transition-all ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }}>
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white" style={{ borderBottom: '1px solid #E8ECF4', boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowLocationPicker(v => !v)}
            className="flex items-center gap-1 font-bold text-[16px] tracking-[-0.01em] text-slate-900 hover:text-blue-600 transition-colors active:scale-95 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
          >
            <span>{selectedNeighborhood}</span>
            <svg className="w-4 h-4 text-slate-400 mt-0.5 transition-transform" style={{ transform: showLocationPicker ? 'rotate(180deg)' : 'rotate(0deg)', pointerEvents: 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className="flex items-center gap-1.5" style={{ pointerEvents: 'auto' }}>
            <button 
              onClick={() => setShowSearch(true)} 
              className="w-11 h-11 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 rounded-full transition-colors cursor-pointer touch-manipulation relative" 
              title="Search posts"
              style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
            >
              <Search className="w-5 h-5 text-slate-500" style={{ pointerEvents: 'none' }} />
            </button>
            <button 
              onClick={() => setActiveTab('events')} 
              className="w-11 h-11 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 rounded-full transition-colors cursor-pointer touch-manipulation relative" 
              title="View events"
              style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
            >
              <Calendar className="w-5 h-5 text-slate-500" style={{ pointerEvents: 'none' }} />
            </button>
            <NotificationBell userId={currentUser?.id} />
          </div>
        </div>
      </div>

      {/* Location picker dropdown */}
      {showLocationPicker && (
        <div className="sticky top-12 z-20 bg-white border-b border-slate-100 shadow-md">
          <div className="max-w-2xl mx-auto px-4 py-2 flex flex-wrap gap-2">
            {NEIGHBORHOODS.map(n => (
              <button
                key={n}
                onClick={() => { setSelectedNeighborhood(n); setShowLocationPicker(false); }}
                className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                  selectedNeighborhood === n
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-32">

        {/* Push notification prompt */}
        <PushNotificationPrompt />


        {/* 1. Post Box */}
        <PostBox
          currentUser={currentUser}
          onPostClick={(type) => { setPostModalType(type === 'photo' ? 'feed' : type); setShowPostModal(true); }}
        />



        {/* 2. Feed Tabs */}
        <div className="rounded-2xl mb-3 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #4C1D95 100%)', boxShadow: '0 4px 16px rgba(37,99,235,0.2)' }}>
          <HomeFeedTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>



        {/* 3. Community Activity (compact circles) */}
        <CommunityActivityStrip groups={communityGroups} />

        {/* 5. Events Calendar Tab */}
        {activeTab === 'events' && !isLoading && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #FAF5FF 100%)', border: '1px solid #C7D7FD', boxShadow: '0 2px 12px rgba(37,99,235,0.06)', marginBottom: 12, padding: 0 }}>
          <EventsForYou currentUser={currentUser} events={visiblePosts.filter(p => p.type === 'event')} />
          <EventsFeedSection
            posts={visiblePosts}
            currentUser={currentUser}
            onCreateEvent={() => { setPostModalType('event'); setShowPostModal(true); }}
          />
          </div>
        )}

        {/* 6. Feed Posts (all tabs except events) */}
        {activeTab !== 'events' && isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-2.5 w-16 rounded" />
                  </div>
                </div>
                <div className="skeleton h-3 w-full rounded mb-2" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        )}
        {activeTab !== 'events' && isError && cachedPosts.length === 0 && (
          <div className="space-y-3">
            <p className="text-[12px] text-slate-400 text-center">Still loading posts...</p>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-2.5 w-16 rounded" />
                  </div>
                </div>
                <div className="skeleton h-3 w-full rounded mb-2" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        )}
        {activeTab !== 'events' && (isError ? cachedPosts.length > 0 : !isLoading) && (
          <div className="space-y-2.5">
            {isError && cachedPosts.length > 0 && (
              <p className="text-[12px] text-slate-400 text-center">Showing cached posts — still loading...</p>
            )}
            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-3xl mb-3">💬</p>
                <p className="font-bold text-slate-900">Nothing here yet</p>
                <p className="text-[13px] text-slate-400 mt-1">Be the first to post!</p>
                <button
                  onClick={() => { setPostModalType('feed'); setShowPostModal(true); }}
                  className="mt-4 px-5 py-2 rounded-full text-white text-[13px] font-semibold bg-blue-600"
                >
                  Post Something
                </button>
              </div>
            ) : feedPosts.map((post, index) => (
              <React.Fragment key={post.id}>
                <UnifiedPostCard
                 post={post}
                 currentUser={currentUser}
                 liked={userLikes.includes(post.id)}
                 onLike={handleLike}
                 onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                 onDelete={(id) => deleteMutation.mutate(id)}
                 onBlock={handleBlock}
                 blockedIds={blockedIds}
                 onReport={handleReport}
                 communities={communityGroups}
                />
                {(index + 1) % 6 === 0 && feedPrompts[(Math.floor((index + 1) / 6) - 1) % feedPrompts.length] && (
                  <InlineFeedPrompt
                    prompt={feedPrompts[(Math.floor((index + 1) / 6) - 1) % feedPrompts.length]}
                    onReply={(p) => { setPinnedPrompt(p); setShowPromptReply(true); }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <UnifiedPostModal
        open={showPostModal}
        onOpenChange={(open) => {
          setShowPostModal(open);
          if (!open) queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
        }}
        currentUser={currentUser}
        postType={postModalType}
      />

      <UnifiedPostModal
        open={showPromptReply}
        onOpenChange={(open) => {
          setShowPromptReply(open);
          if (!open) { queryClient.invalidateQueries({ queryKey: ['unified-posts'] }); loadPinnedPrompt(); }
        }}
        currentUser={currentUser}
        postType="prompt_reply"
        promptId={pinnedPrompt?.id}
        promptText={pinnedPrompt?.question}
      />

      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        post={selectedPost}
        currentUser={currentUser}
        onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['unified-posts'] })}
      />

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
        currentUser={currentUser}
      />

      <CommunityAlertModal
        open={showAlertModal}
        onOpenChange={setShowAlertModal}
        currentUser={currentUser}
      />

      {/* FAB */}
      <div className={`fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3 transition-transform duration-300 ${isScrollingDown ? 'translate-x-32' : 'translate-x-0'}`}>
        {showFAB && (
          <>
            {[
              { label: 'Post Alert', icon: Bell, type: 'alert', color: 'bg-red-500' },
              { label: 'Ask for Help', icon: HandHeart, type: 'help', color: 'bg-orange-500' },
              { label: 'Create Event', icon: Calendar, type: 'event', color: 'bg-blue-500' },
            ].map(({ label, icon: Icon, type, color }) => (
              <button
                key={type}
                onClick={() => {
                  setShowFAB(false);
                  if (type === 'alert') { setShowAlertModal(true); return; }
                  setPostModalType(type);
                  setShowPostModal(true);
                }}
                className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-white text-[13px] font-semibold shadow-lg ${color}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </>
        )}
        <button
          onClick={() => setShowFAB(v => !v)}
          className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}
        >
          {showFAB ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      <SearchModal
        open={showSearch}
        onOpenChange={setShowSearch}
        posts={visiblePosts}
        helpRequests={[]}
        communities={[]}
      />
    </div>
  );
}