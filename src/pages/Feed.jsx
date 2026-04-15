import React, { useEffect, useState, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import PostBox from '@/components/feed/PostBox';
import QuickPromptChips from '@/components/feed/QuickPromptChips';
import CommentsSheet from '@/components/feed/CommentsSheet';
import HomeFeedTabs from '@/components/feed/HomeFeedTabs';
import CommunityActivityStrip from '@/components/feed/CommunityActivityStrip';
import ReactionBar from '@/components/feed/ReactionBar';
import EventsForYou from '@/components/feed/EventsForYou';
import EventsFeedSection from '@/components/feed/EventsFeedSection';
import InlineFeedPrompt from '@/components/feed/InlineFeedPrompt';
import UnifiedPostModal from '@/components/feed/UnifiedPostModal';
import ReportModal from '@/components/common/ReportModal';
import CommunityAlertModal from '@/components/feed/CommunityAlertModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import PushNotificationPrompt from '@/components/feed/PushNotificationPrompt';
import SearchModal from '@/components/feed/SearchModal';
import UpcomingEventsSheet from '@/components/feed/UpcomingEventsSheet';
import DailyHooks from '@/components/feed/DailyHooks';
import LocalContextStrip from '@/components/feed/LocalContextStrip';
import PostErrorBoundary from '@/components/feed/PostErrorBoundary';
import { Search, Plus, X, Bell, HandHeart, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const NEIGHBORHOODS = ['All Five Towns', 'Lawrence', 'Woodmere', 'Cedarhurst', 'Hewlett', 'Inwood', 'Far Rockaway'];

export default function Feed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('trending');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All Five Towns');
  const [userLikes, setUserLikes] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postModalType, setPostModalType] = useState('feed');
  const [postModalSubtype, setPostModalSubtype] = useState(null);
  const [postModalInitialBody, setPostModalInitialBody] = useState('');
  const [showPromptReply, setShowPromptReply] = useState(false);
  const [pinnedPrompt, setPinnedPrompt] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showEventsSheet, setShowEventsSheet] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [interestSignals, setInterestSignals] = useState({ types: {}, subtypes: {}, keywords: [] }); // track user interactions
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userGeo, setUserGeo] = useState(null); // { lat, lng }
  const lastScrollY = useRef(0);
  const [feedPrompts, setFeedPrompts] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [cachedPosts, setCachedPosts] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // Request geolocation when user switches to nearby tab
  useEffect(() => {
    if (activeTab === 'nearby' && !userGeo && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      );
    }
  }, [activeTab]);

  const loadPinnedPrompt = useCallback(async () => {
    try {
      const prompts = await base44.entities.DailyPrompt.list('-created_date', 5);
      if (prompts?.length > 0) setFeedPrompts(prompts);
    } catch {}
  }, []);

  const { data: rawPostsData = [], isLoading, isError } = useQuery({
    queryKey: ['unified-posts'],
    queryFn: async () => {
      const p = await base44.entities.UnifiedPost.list('-updated_date', 100);
      const raw = Array.isArray(p) ? p : [];
      const safe = raw.filter(
        (item) => item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim().length > 0
      );
      const invalid = raw.filter(
        (item) => !item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id?.trim()
      );
      if (invalid.length > 0) console.log('[Feed] Invalid posts filtered out at fetch:', invalid);
      setCachedPosts(safe);
      return safe;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Sanitize at render time too — defensive against stale/cached bad data
  const posts = Array.isArray(rawPostsData)
    ? rawPostsData.filter(
        (p) => p && typeof p === 'object' && typeof p.id === 'string' && p.id.trim().length > 0
      )
    : [];

  const { data: userCommunitiesList = [] } = useQuery({
    queryKey: ['user-communities', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const memberships = await base44.entities.UserCommunity.filter({ user_id: currentUser.id });
      const ids = memberships.map(m => m.community_id);
      if (ids.length === 0) return [];
      return Promise.all(ids.map(id => base44.entities.Community.get(id))).catch(() => []);
    },
    enabled: !!currentUser?.id,
  });

  const { data: userBlocksList = [] } = useQuery({
    queryKey: ['user-blocks', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      return base44.entities.Block.filter({ blocker_id: currentUser.id });
    },
    enabled: !!currentUser?.id,
  });

  useEffect(() => {
    setBlockedIds(userBlocksList.map(b => b.blocked_id));
  }, [userBlocksList]);

  useEffect(() => {
    setCommunityGroups(userCommunitiesList.filter(c => c));
  }, [userCommunitiesList]);

  useEffect(() => {
    loadPinnedPrompt();
  }, [loadPinnedPrompt]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrollingDown(currentY > lastScrollY.current);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const likeMutation = useMutation({
    mutationFn: async (postId) => {
      const existing = await base44.entities.Like.filter({ post_id: postId, user_id: currentUser.id });
      if (existing.length > 0) {
        await base44.entities.Like.delete(existing[0].id);
        const post = await base44.entities.UnifiedPost.get(postId);
        await base44.entities.UnifiedPost.update(postId, { likes_count: Math.max(0, (post.likes_count || 1) - 1) });
      } else {
        await base44.entities.Like.create({ post_id: postId, user_id: currentUser.id });
        const post = await base44.entities.UnifiedPost.get(postId);
        await base44.entities.UnifiedPost.update(postId, { likes_count: (post.likes_count || 0) + 1 });
      }
    },
    onSuccess: (_, postId) => {
      setUserLikes(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
      queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId) => {
      await base44.entities.UnifiedPost.delete(postId);
      const comments = await base44.entities.Comment.filter({ post_id: postId });
      for (const c of comments) await base44.entities.Comment.delete(c.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-posts'] });
    },
  });

  const recordInterest = (post) => {
    setInterestSignals(prev => ({
      types: { ...prev.types, [post.type]: (prev.types[post.type] || 0) + 1 },
      subtypes: post.post_subtype ? { ...prev.subtypes, [post.post_subtype]: (prev.subtypes[post.post_subtype] || 0) + 1 } : prev.subtypes,
      keywords: [...prev.keywords, ...(post.body || '').toLowerCase().split(/\s+/).slice(0, 5)].slice(-50),
    }));
  };

  const handleLike = (postId) => {
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
    const post = posts.find(p => p.id === postId);
    if (post) recordInterest(post);
    likeMutation.mutate(postId);
  };

  const handleBlock = async (userId) => {
    if (!currentUser) return;
    try {
      await base44.entities.Block.create({ blocker_id: currentUser.id, blocked_id: userId });
      setBlockedIds(prev => [...prev, userId]);
      toast.success('User blocked');
    } catch { toast.error('Could not block user'); }
  };

  const handleReport = (contentId, contentType) => {
    setReportTarget({ id: contentId, type: contentType });
    setShowReport(true);
  };

  const handleCommunityClick = (communityId) => {
    if (!communityId) return;
    // Navigate to Communities tab with the community selected
    const params = new URLSearchParams(window.location.search);
    navigate('/Communities?communityId=' + communityId);
  };

  const visiblePosts = posts.filter(p => {
    if (p.type === 'dating') return false;
    if (p.type === 'prompt' && activeTab !== 'trending' && activeTab !== 'for_you' && activeTab !== 'social') return false;
    if (blockedIds.includes(p.user_id)) return false;
    if (selectedNeighborhood !== 'All Five Towns') {
      const loc = (p.location_text || p.city || '').toLowerCase();
      if (loc && !loc.includes(selectedNeighborhood.toLowerCase())) return false;
    }
    return true;
  });

  const joinedCommunityIds = useMemo(() => new Set(communityGroups.map(c => c.id)), [communityGroups]);

  const engagementScore = (p) => {
    const likes = p.likes_count || 0;
    const comments = p.comments_count || 0;
    const ageMs = Date.now() - new Date(p.created_date).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    const timeDecay = Math.max(0.2, 1 - ageHours / 48);
    let base = (likes + comments * 3) * timeDecay;

    // Boost active discussions (many comments recently)
    if (comments >= 5) base *= 1.3;
    if (comments >= 10) base *= 1.5;

    // Boost posts matching user's interaction signals
    const typeBoost = interestSignals.types[p.type] || 0;
    const subtypeBoost = p.post_subtype ? (interestSignals.subtypes[p.post_subtype] || 0) : 0;
    const bodyWords = (p.body || '').toLowerCase().split(/\s+/);
    const keywordMatches = bodyWords.filter(w => w.length > 4 && interestSignals.keywords.includes(w)).length;
    base *= (1 + typeBoost * 0.1 + subtypeBoost * 0.15 + keywordMatches * 0.05);

    // Strong boost for posts from communities the user joined
    if (p.community_id && joinedCommunityIds.has(p.community_id)) base = base * 3 + 50;

    return base;
  };

  const feedPosts = (() => {
    const sorted = [...visiblePosts].filter(p => p && p.id).sort((a, b) => engagementScore(b) - engagementScore(a));

    let filtered;
    if (activeTab === 'for_you') {
      const userInterests = currentUser?.interests || [];
      const userCity = currentUser?.cityPreset || '';
      filtered = sorted.filter(p => {
        if (userInterests.length === 0 && !userCity) return true;
        const bodyLower = (p.body || '').toLowerCase();
        const interestMatch = userInterests.some(i => bodyLower.includes(i.toLowerCase()));
        const cityMatch = userCity && (p.city || p.location_text || '').toLowerCase().includes(userCity.toLowerCase());
        return interestMatch || cityMatch || (p.user_id === currentUser?.id);
      }).slice(0, 40);
    } else if (activeTab === 'trending') {
      filtered = sorted.slice(0, 40);
    } else if (activeTab === 'chessed') {
      filtered = sorted.filter(p => p.type === 'help' || p.board === 'help');
    } else if (activeTab === 'learning') {
      filtered = sorted.filter(p => p.type === 'news' || /torah|parsha|daf|halacha|shiur/i.test(p.body || ''));
    } else if (activeTab === 'social') {
      filtered = sorted.filter(p => p.type === 'feed');
    } else if (activeTab === 'nearby') {
      const NEIGHBORHOOD_COORDS = {
        'cedarhurst':   { lat: 40.6237, lng: -73.7257 },
        'woodmere':     { lat: 40.6354, lng: -73.7129 },
        'lawrence':     { lat: 40.6165, lng: -73.7293 },
        'inwood':       { lat: 40.6093, lng: -73.7490 },
        'hewlett':      { lat: 40.6437, lng: -73.6960 },
        'far rockaway': { lat: 40.6054, lng: -73.7548 },
        'five towns':   { lat: 40.6237, lng: -73.7257 },
      };
      const getCoords = (p) => {
        const loc = (p.location_text || p.city || '').toLowerCase();
        for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
          if (loc.includes(key)) return coords;
        }
        return null;
      };
      const dist = (a, b) => {
        if (!a || !b) return Infinity;
        const dx = a.lat - b.lat, dy = a.lng - b.lng;
        return dx * dx + dy * dy;
      };
      const withLocation = sorted.filter(p => p.location_text || p.city);
      filtered = userGeo
        ? [...withLocation].sort((a, b) => dist(getCoords(a), userGeo) - dist(getCoords(b), userGeo))
        : withLocation;
    } else if (activeTab === 'communities') {
      const communityIds = communityGroups.map(c => c.id);
      filtered = sorted.filter(p => communityIds.includes(p.community_id));
    } else if (activeTab === 'events') {
      filtered = sorted.filter(p => p.type === 'event' || p.board === 'events');
    } else {
      filtered = sorted.slice(0, 40);
    }

    // NEVER show empty feed — fall back to full global feed (seeded + real) if filter yields nothing
    return filtered.length > 0 ? filtered : sorted.slice(0, 40);
  })();

  return (
    <div className="min-h-screen relative" style={{ background: '#F8FAFC' }}>
      {pullDistance > 0 && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[40] pointer-events-none">
          <div className={`transition-all ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }}>
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      )}

      <div className="sticky top-0 z-[60] bg-white" style={{ borderBottom: '1px solid #E8ECF4', boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setShowLocationPicker(v => !v)}
            className="flex items-center gap-1 font-bold text-[16px] tracking-[-0.01em] text-slate-900 hover:text-blue-600 transition-colors active:scale-95 touch-manipulation min-h-[44px] px-1"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span>{selectedNeighborhood}</span>
            <svg className="w-4 h-4 text-slate-400 mt-0.5 transition-transform" style={{ transform: showLocationPicker ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setShowSearch(true)}
              className="w-[44px] h-[44px] flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 rounded-full transition-colors touch-manipulation" 
              title="Search posts"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Search className="w-5 h-5 text-slate-500" />
            </button>
            <button 
              onClick={() => setShowEventsSheet(true)}
              className="w-[44px] h-[44px] flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 rounded-full transition-colors touch-manipulation" 
              title="View events"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Calendar className="w-5 h-5 text-slate-500" />
            </button>
            <NotificationBell userId={currentUser?.id} />
          </div>
        </div>
      </div>

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
        <PushNotificationPrompt />

        <PostBox
          currentUser={currentUser}
          onPostClick={(type, subtype) => {
            setPostModalType(type);
            setPostModalSubtype(subtype || null);
            setPostModalInitialBody('');
            setShowPostModal(true);
          }}
        />
        <QuickPromptChips
          onPostClick={(type, subtype, prefill) => {
            setPostModalType(type);
            setPostModalSubtype(subtype || null);
            setPostModalInitialBody(prefill || '');
            setShowPostModal(true);
          }}
        />

        <DailyHooks
          onPostClick={(type, subtype, prefill) => {
            setPostModalType(type);
            setPostModalSubtype(subtype || null);
            setPostModalInitialBody(prefill || '');
            setShowPostModal(true);
          }}
        />

        <LocalContextStrip
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userCommunityCount={communityGroups.length}
        />

        <div className="rounded-2xl mb-3 bg-blue-50/60 border border-blue-100/60 p-2.5 space-y-2">
          <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #4C1D95 100%)' }}>
            <HomeFeedTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>
          <CommunityActivityStrip groups={communityGroups} />
        </div>

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
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {isError && cachedPosts.length > 0 && (
              <p className="text-[12px] text-slate-400 text-center">Showing cached posts — still loading...</p>
            )}
            {(() => {
            // Section labels injected at fixed positions
            const SECTION_LABELS = {
              0:  { emoji: '🔥', text: 'Trending now in Five Towns' },
              5:  { emoji: '💬', text: 'Active discussions' },
              12: { emoji: '👀', text: 'People are talking about this' },
            };

            const hotIndex = feedPosts.findIndex(p =>
              (p.likes_count || 0) + (p.comments_count || 0) * 2 >= 20
            );
            let orderedPosts = [...feedPosts].filter(p => p && p.id && typeof p.id === 'string');
            if (hotIndex > 2 && hotIndex < orderedPosts.length) {
              const [hot] = orderedPosts.splice(hotIndex, 1);
              if (hot) orderedPosts.splice(2, 0, hot);
            }
            let shownCommunityDivider = false;
            return orderedPosts.map((post, index) => {
              const isFromJoinedCommunity = post.community_id && joinedCommunityIds.has(post.community_id);
              const showCommunityDivider = isFromJoinedCommunity && !shownCommunityDivider && joinedCommunityIds.size > 0;
              if (showCommunityDivider) shownCommunityDivider = true;
              const sectionLabel = SECTION_LABELS[index];
              return (
                <React.Fragment key={post.id}>
                  {sectionLabel && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100">
                      <span className="text-base">{sectionLabel.emoji}</span>
                      <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">{sectionLabel.text}</span>
                    </div>
                  )}
                  {showCommunityDivider && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/80 border-b border-indigo-100">
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">👥 From your communities</span>
                    </div>
                  )}
                  <PostErrorBoundary key={post.id}>
                    <UnifiedPostCard
                     post={post}
                     currentUser={currentUser}
                     liked={userLikes.includes(post.id)}
                     onLike={handleLike}
                     onComment={(p) => { recordInterest(p); setSelectedPost(p); setShowComments(true); }}
                     onDelete={(id) => deleteMutation.mutate(id)}
                     onBlock={handleBlock}
                     blockedIds={blockedIds}
                     onReport={handleReport}
                     communities={communityGroups}
                     onCommunityClick={handleCommunityClick}
                     isFromJoinedCommunity={isFromJoinedCommunity}
                    />
                  </PostErrorBoundary>
                  {(index + 1) % 6 === 0 && feedPrompts[(Math.floor((index + 1) / 6) - 1) % feedPrompts.length] && (
                    <InlineFeedPrompt
                      prompt={feedPrompts[(Math.floor((index + 1) / 6) - 1) % feedPrompts.length]}
                      onReply={(p) => { setPinnedPrompt(p); setShowPromptReply(true); }}
                    />
                  )}
                </React.Fragment>
              );
            });
          })()}
          </div>
        )}
      </div>

      <UnifiedPostModal
        open={showPostModal}
        onOpenChange={(open) => {
          setShowPostModal(open);
          if (!open) { queryClient.invalidateQueries({ queryKey: ['unified-posts'] }); setPostModalSubtype(null); setPostModalInitialBody(''); }
        }}
        currentUser={currentUser}
        postType={postModalType}
        initialSubtype={postModalSubtype}
        initialBody={postModalInitialBody}
        userCommunities={communityGroups}
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

      <UpcomingEventsSheet
        open={showEventsSheet}
        onOpenChange={setShowEventsSheet}
        currentUser={currentUser}
        joinedCommunityIds={communityGroups.map(c => c.id)}
      />

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