import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dataService, storageService } from '@/services';
import { appParams } from '@/lib/app-params';
import { toast } from 'sonner';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import CommentsSheet from '@/components/feed/CommentsSheet';
import HomeFeedTabs from '@/components/feed/HomeFeedTabs';
import EventsForYou from '@/components/feed/EventsForYou';
import EventsFeedSection from '@/components/feed/EventsFeedSection';
import InlineFeedPrompt from '@/components/feed/InlineFeedPrompt';
import UnifiedPostModal from '@/components/feed/UnifiedPostModal';
import ReportModal from '@/components/common/ReportModal';
import CommunityAlertModal from '@/components/feed/CommunityAlertModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import PushNotificationPrompt from '@/components/feed/PushNotificationPrompt';
import UpcomingEventsSheet from '@/components/feed/UpcomingEventsSheet';
import DailyHooks from '@/components/feed/DailyHooks';
import { Search, Plus, RefreshCw, ChevronDown, MapPin, Users, HeartHandshake, CalendarDays, Bell, ShieldCheck, Store, Utensils, Car, MessageCircle } from 'lucide-react';
import SkeletonCard from '@/components/common/SkeletonCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LocationNetworkPicker from '@/components/feed/LocationNetworkPicker';
import { LOCAL_NETWORKS } from '@/lib/localNetworks';

const NEIGHBORHOODS = ['All Five Towns', 'Lawrence', 'Woodmere', 'Cedarhurst', 'Hewlett', 'Inwood', 'Far Rockaway'];
const DEMO_POSTS = [
  {
    id: 'demo-feed-1',
    type: 'feed',
    title: 'Welcome to your local JUnited demo',
    body: 'This app is running locally. Add your real backend URL in .env.local when you are ready to connect live data.',
    author_name: 'Local demo',
    user_id: 'local-demo',
    community_id: 'demo-community',
    community_name: 'Five Towns',
    city: 'Five Towns',
    location_text: 'Five Towns',
    created_date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updated_date: new Date().toISOString(),
    likes_count: 12,
    comments_count: 3,
  },
  {
    id: 'demo-feed-2',
    type: 'help',
    body: 'Looking for volunteers to help deliver Shabbos meals this week.',
    author_name: 'Chesed team',
    user_id: 'local-demo-2',
    community_id: 'demo-community',
    community_name: 'Chesed Volunteers',
    city: 'Five Towns',
    location_text: 'Woodmere',
    created_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_date: new Date().toISOString(),
    likes_count: 8,
    comments_count: 5,
  },
  {
    id: 'demo-feed-3',
    type: 'event',
    body: 'Community dinner tonight in the social hall.',
    author_name: 'Events demo',
    user_id: 'local-demo-3',
    community_id: 'demo-community',
    community_name: 'Five Towns',
    city: 'Five Towns',
    location_text: 'Lawrence',
    created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updated_date: new Date().toISOString(),
    event_date: new Date().toISOString(),
    likes_count: 19,
    comments_count: 6,
  },
  {
    id: 'demo-feed-4',
    type: 'feed',
    title: 'Lost and found near Central Avenue',
    body: 'A small siddur was left after mincha. Message the office if it is yours.',
    author_name: 'Shul office',
    user_id: 'local-demo-4',
    community_id: 'demo-community',
    community_name: 'Five Towns',
    city: 'Five Towns',
    location_text: 'Cedarhurst',
    created_date: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
    updated_date: new Date().toISOString(),
    likes_count: 6,
    comments_count: 2,
  },
  {
    id: 'demo-feed-5',
    type: 'news',
    title: 'Tonight: short halacha chabura',
    body: 'Quick 20 minute learning after maariv, focused on practical Shabbos questions.',
    author_name: 'Learning group',
    user_id: 'local-demo-5',
    community_id: 'demo-community',
    community_name: 'Five Towns',
    city: 'Five Towns',
    location_text: 'Woodmere',
    created_date: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    updated_date: new Date().toISOString(),
    likes_count: 14,
    comments_count: 4,
  },
  {
    id: 'demo-feed-6',
    type: 'help',
    body: 'Can someone recommend a reliable car service for an early JFK pickup?',
    author_name: 'Neighbor',
    user_id: 'local-demo-6',
    community_id: 'demo-community',
    community_name: 'Five Towns',
    city: 'Five Towns',
    location_text: 'Lawrence',
    created_date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    updated_date: new Date().toISOString(),
    likes_count: 4,
    comments_count: 9,
  },
  {
    id: 'demo-feed-7',
    type: 'event',
    body: 'Parent meetup at the park after school, weather permitting.',
    author_name: 'Parents board',
    user_id: 'local-demo-7',
    community_id: 'demo-community',
    community_name: 'Five Towns',
    city: 'Five Towns',
    location_text: 'Hewlett',
    created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_date: new Date().toISOString(),
    event_date: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    likes_count: 11,
    comments_count: 7,
  },
  {
    id: 'demo-feed-8',
    type: 'feed',
    title: 'New family moving in',
    body: 'A new family is moving to the neighborhood this week. Looking for ideas to help them feel welcomed.',
    author_name: 'Welcome committee',
    user_id: 'local-demo-8',
    community_id: 'demo-community',
    community_name: 'Five Towns',
    city: 'Five Towns',
    location_text: 'Inwood',
    created_date: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    updated_date: new Date().toISOString(),
    likes_count: 22,
    comments_count: 10,
  },
];

const HUB_ACTIONS = [
  { label: 'Open hub map', icon: MapPin, path: '/MitzvahCircle?tab=map', tone: 'blue' },
  { label: 'Find groups', icon: Users, path: '/Communities', tone: 'emerald' },
  { label: 'Offer chesed', icon: HeartHandshake, path: '/MitzvahCircle', tone: 'rose' },
  { label: 'Plan rides', icon: Car, path: '/MitzvahCircle?tab=carpool', tone: 'amber' },
];

const HUB_PULSE = [
  { label: 'Shul updates', value: '12', detail: 'minyanim, shiurim, kiddush notes' },
  { label: 'Open chesed', value: '4', detail: 'rides, meals, errands, setup help' },
  { label: 'Events today', value: '7', detail: 'learning, simchas, meetups' },
  { label: 'Local threads', value: '21', detail: 'recommendations and conversations' },
];

const SHABBOS_PREP = [
  'Candle lighting and eruv reminders',
  'Hosting and guest matching',
  'Ride and pickup coordination',
  'Urgent chesed before Shabbos',
];

const TRUST_LAYERS = [
  { icon: ShieldCheck, label: 'Verified shuls and admins' },
  { icon: Bell, label: 'Smart alerts from joined circles' },
  { icon: Store, label: 'Local marketplace and recommendations' },
  { icon: MessageCircle, label: 'Direct neighbor-to-neighbor connection' },
];

export default function Feed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('trending');
  const [primaryNetwork, setPrimaryNetwork] = useState(LOCAL_NETWORKS[0]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
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
  const [showEventsSheet, setShowEventsSheet] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [interestSignals, setInterestSignals] = useState({ types: {}, subtypes: {}, keywords: [] }); // track user interactions
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userGeo, setUserGeo] = useState(null); // { lat, lng }
  const lastScrollY = useRef(0);
  const [feedPrompts, setFeedPrompts] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [cachedPosts, setCachedPosts] = useState([]);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [page, setPage] = useState(0);
  const [allPosts, setAllPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 30;
  const [showNetworkBanner, setShowNetworkBanner] = useState(() => !storageService.getItem('junited_network_banner_v2_dismissed'));

  useEffect(() => {
    if (!appParams.hasBackendConfig) {
      setCurrentUser({ id: 'local-demo', full_name: 'Local demo', cityPreset: 'Five Towns', interests: ['chesed', 'events'] });
      return;
    }
    dataService.auth.me().then(u => {
      setCurrentUser(u);
      // Load saved primary network from user profile
      if (u?.cityPreset) {
        const net = LOCAL_NETWORKS.find(n => n.cityPreset === u.cityPreset);
        if (net) setPrimaryNetwork(net);
      }
    }).catch(() => {});
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
    if (!appParams.hasBackendConfig) {
      setFeedPrompts([]);
      return;
    }
    try {
      const prompts = await dataService.entities.DailyPrompt.list('-created_date', 5);
      if (prompts?.length > 0) setFeedPrompts(prompts);
    } catch {}
  }, []);

  const { data: posts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['unified-posts', page],
    queryFn: async () => {
      if (!appParams.hasBackendConfig) return page === 0 ? DEMO_POSTS : [];
      const p = await dataService.entities.UnifiedPost.list('-updated_date', PAGE_SIZE, page * PAGE_SIZE);
      return p;
    },
    staleTime: 30000,
    refetchInterval: page === 0 ? 60000 : false,
  });

  // Merge paged results into allPosts without causing infinite loops
  useEffect(() => {
    if (!posts || posts.length === 0) return;
    if (page === 0) {
      setAllPosts(posts);
      setCachedPosts(posts);
    } else {
      setAllPosts(prev => {
        const existingIds = new Set(prev.map(x => x.id));
        const newOnes = posts.filter(x => !existingIds.has(x.id));
        if (newOnes.length === 0) return prev; // no change, avoid re-render
        return [...prev, ...newOnes];
      });
    }
    setHasMore(posts.length === PAGE_SIZE);
  }, [posts, page]);

  const { data: userCommunitiesList } = useQuery({
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

  useEffect(() => {
    loadPinnedPrompt();
  }, [loadPinnedPrompt]);

  // 5-second timeout: if still loading, show content or empty state
  useEffect(() => {
    const timer = setTimeout(() => setLoadTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, []);

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
      const existing = await dataService.entities.Like.filter({ post_id: postId, user_id: currentUser.id });
      if (existing.length > 0) {
        await dataService.entities.Like.delete(existing[0].id);
        const post = await dataService.entities.UnifiedPost.get(postId);
        await dataService.entities.UnifiedPost.update(postId, { likes_count: Math.max(0, (post.likes_count || 1) - 1) });
      } else {
        await dataService.entities.Like.create({ post_id: postId, user_id: currentUser.id });
        const post = await dataService.entities.UnifiedPost.get(postId);
        await dataService.entities.UnifiedPost.update(postId, { likes_count: (post.likes_count || 0) + 1 });
      }
    },
    onSuccess: (_, postId) => {
      setUserLikes(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
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

  const recordInterest = (post) => {
    setInterestSignals(prev => ({
      types: { ...prev.types, [post.type]: (prev.types[post.type] || 0) + 1 },
      subtypes: post.post_subtype ? { ...prev.subtypes, [post.post_subtype]: (prev.subtypes[post.post_subtype] || 0) + 1 } : prev.subtypes,
      keywords: [...prev.keywords, ...(post.body || '').toLowerCase().split(/\s+/).slice(0, 5)].slice(-50),
    }));
  };

  const handleLike = (postId) => {
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    const post = posts.find(p => p.id === postId);
    if (post) recordInterest(post);
    if (!appParams.hasBackendConfig) {
      setUserLikes(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
      return;
    }
    likeMutation.mutate(postId);
  };

  const handleBlock = async (userId) => {
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

  const visiblePosts = allPosts.filter(p => {
    if (p.type === 'dating') return false;
    if (p.type === 'prompt' && activeTab !== 'trending' && activeTab !== 'for_you' && activeTab !== 'social') return false;
    if (blockedIds.includes(p.user_id)) return false;
    // Sub-neighborhood filter within the selected network
    if (selectedNeighborhood !== 'All') {
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

    // Boost local network posts
    const postCity = (p.city || p.location_text || '').toLowerCase();
    const networkLabel = primaryNetwork.cityPreset.toLowerCase();
    if (postCity.includes(networkLabel) || primaryNetwork.neighborhoods.some(nb => postCity.includes(nb.toLowerCase()))) {
      base = base * 2 + 10;
    }

    return base;
  };

  const feedPosts = (() => {
    const sorted = [...visiblePosts].sort((a, b) => engagementScore(b) - engagementScore(a));

    let filtered;
    if (activeTab === 'for_you') {
      const userInterests = currentUser?.interests || [];
      const userCity = currentUser?.cityPreset || '';
      // Local posts first, then interest-matched, then rest — always mixed, never empty
      const localPosts = sorted.filter(p => userCity && p.city === userCity);
      const interestPosts = sorted.filter(p => {
        const bodyLower = (p.body || '').toLowerCase();
        return userInterests.some(i => bodyLower.includes(i.toLowerCase())) && p.city !== userCity;
      });
      const seen = new Set();
      const merged = [...localPosts, ...interestPosts, ...sorted].filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id); return true;
      });
      filtered = merged.slice(0, 40);
    } else if (activeTab === 'trending') {
      filtered = sorted.slice(0, 40);
    } else if (activeTab === 'chessed') {
      filtered = sorted.filter(p => p.type === 'help' || p.board === 'help');
    } else if (activeTab === 'learning') {
      filtered = sorted.filter(p => p.type === 'news' || /torah|parsha|daf|halacha|shiur/i.test(p.body || ''));
    } else if (activeTab === 'social') {
      filtered = sorted.filter(p => p.type === 'feed');
    } else if (activeTab === 'nearby') {
      // Build coord map from all LOCAL_NETWORKS centers + neighborhoods
      const getPostCoords = (p) => {
        const postCity = p.city || '';
        const net = LOCAL_NETWORKS.find(n => n.cityPreset === postCity);
        if (net) return net.center;
        const locLower = (p.location_text || '').toLowerCase();
        for (const n of LOCAL_NETWORKS) {
          if (n.neighborhoods.some(nb => locLower.includes(nb.toLowerCase()))) return n.center;
        }
        return null;
      };
      const dist = (a, b) => {
        if (!a || !b) return Infinity;
        const dx = a.lat - b.lat, dy = a.lng - b.lng;
        return dx * dx + dy * dy;
      };
      // Fallback origin: user's primary network center
      const origin = userGeo || primaryNetwork.center;
      // Sort all posts by distance; local network posts get priority
      filtered = [...sorted].sort((a, b) => {
        const da = dist(getPostCoords(a), origin);
        const db = dist(getPostCoords(b), origin);
        return da - db;
      });
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
    <div className="app-page relative">
      {pullDistance > 0 && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[40] pointer-events-none">
          <div className={`transition-all ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }}>
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      )}

      <div className="sticky top-0 z-[60] bg-[#F6F8FB]/95 backdrop-blur-xl">
        <div className="mobile-page px-3 pt-2 pb-2 flex items-center justify-between">
          <button
            onClick={() => setShowLocationPicker(v => !v)}
            className="app-chip app-chip-active min-h-[44px] touch-manipulation active:scale-95"
          >
            <span>{primaryNetwork.emoji}</span>
            <span>{primaryNetwork.shortLabel}</span>
            <ChevronDown className="w-3 h-3 text-blue-400 transition-transform" style={{ transform: showLocationPicker ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
          <div className="flex items-center gap-0.5">
            <button onClick={() => navigate('/search')} className="app-icon-button touch-manipulation" aria-label="Search">
              <Search className="h-[18px] w-[18px] text-slate-500" />
            </button>
            <NotificationBell userId={currentUser?.id} />
          </div>
        </div>
      </div>

      {showLocationPicker && (
        <div className="sticky top-[60px] z-20">
          <LocationNetworkPicker
            currentNetwork={primaryNetwork}
            onSelect={async (net) => {
              setPrimaryNetwork(net);
              setSelectedNeighborhood('All');
              // Persist to user profile
              if (appParams.hasBackendConfig) {
                try { await dataService.auth.updateMe({ cityPreset: net.cityPreset }); } catch {}
              }
            }}
            onClose={() => setShowLocationPicker(false)}
          />
          {/* Sub-neighborhood filter for current network */}
          {primaryNetwork.neighborhoods.length > 1 && (
            <div className="bg-white border-b border-slate-100 shadow-sm">
              <div className="mobile-page px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSelectedNeighborhood('All')}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${selectedNeighborhood === 'All' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  All
                </button>
                {primaryNetwork.neighborhoods.map(nb => (
                  <button
                    key={nb}
                    onClick={() => setSelectedNeighborhood(nb)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${selectedNeighborhood === nb ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {nb}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mobile-page px-3 pt-1 mobile-safe-bottom">
        <PushNotificationPrompt />

        <div className="app-card mb-3 overflow-hidden">
          <div className="relative p-4">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[44px] bg-blue-50" />
            <div className="relative">
              <p className="mb-1 flex items-center gap-2 text-[12px] font-black uppercase tracking-wide text-blue-700">
                <MapPin className="h-4 w-4" />
                Digital hub of the Five Towns
              </p>
              <h1 className="text-[24px] font-black leading-tight text-slate-950">Connect Jewish life around you.</h1>
              <p className="mt-2 text-[13px] font-medium leading-6 text-slate-600">
                A local social network for shuls, families, singles, parents, businesses, events, rides, lost and found, chesed, and everyday Jewish community.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <HubMetric icon={Users} label="Social circles" value="Groups" />
                <HubMetric icon={HeartHandshake} label="Chesed flow" value="Help" />
                <HubMetric icon={MapPin} label="Local pulse" value="Map" />
              </div>
            </div>
          </div>
        </div>

        <FiveTownsDashboard
          pulse={HUB_PULSE}
          actions={HUB_ACTIONS}
          shabbosPrep={SHABBOS_PREP}
          trustLayers={TRUST_LAYERS}
          onNavigate={navigate}
          onPost={(type, subtype, body) => {
            setPostModalType(type);
            setPostModalSubtype(subtype || null);
            setPostModalInitialBody(body || '');
            setShowPostModal(true);
          }}
        />

        {/* One-time network banner for new users */}
        {showNetworkBanner && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-blue-600 px-3.5 py-3 text-white text-[12px] font-medium shadow-sm">
            <span className="text-lg">{primaryNetwork.emoji}</span>
            <span className="flex-1">You're viewing <strong>{primaryNetwork.shortLabel}</strong> — tap the chip above to switch networks.</span>
            <button onClick={() => { setShowNetworkBanner(false); storageService.setItem('junited_network_banner_v2_dismissed', '1'); }} className="text-white/70 hover:text-white text-lg leading-none font-bold flex-shrink-0">×</button>
          </div>
        )}

        <HomeFeedTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === 'events' && !isLoading && (
          <div className="app-gradient-panel mb-3 overflow-hidden">
          <EventsForYou currentUser={currentUser} events={visiblePosts.filter(p => p.type === 'event')} />
          <EventsFeedSection
            posts={visiblePosts}
            currentUser={currentUser}
            onCreateEvent={() => { setPostModalType('event'); setShowPostModal(true); }}
          />
          </div>
        )}

        {activeTab !== 'events' && isLoading && !loadTimedOut && (
          <div className="space-y-3 tab-fade-in">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} hasImage={i === 1} />
            ))}
          </div>
        )}
        {activeTab !== 'events' && (isLoading && loadTimedOut && feedPosts.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">🌿</div>
            <p className="text-[15px] font-bold text-slate-700 mb-1">No posts yet — share a recommendation or ask the community for help.</p>
            <p className="text-[13px] text-slate-400">Be the first to post something!</p>
          </div>
        )}
        {activeTab !== 'events' && (!isLoading || loadTimedOut) && feedPosts.length > 0 && (
          <div className="app-card divide-y divide-slate-100 overflow-hidden tab-fade-in">
            {/* Question of the Day — embedded as first "post" in the feed card */}
            <DailyHooks
              onPostClick={(type, subtype, prefill) => {
                setPostModalType(type);
                setPostModalSubtype(subtype || null);
                setPostModalInitialBody(prefill || '');
                setShowPostModal(true);
              }}
            />
            {isError && (
              <p className="text-[12px] text-slate-400 text-center px-4 py-2">Showing cached posts — pull down to refresh.</p>
            )}

            {(() => {
            // Section labels injected at fixed positions
            const SECTION_LABELS = {
              0: activeTab === 'nearby'
                ? { emoji: '📍', text: `Near You — ${primaryNetwork.shortLabel}` }
                : { emoji: '🔥', text: `Trending in ${primaryNetwork.shortLabel}` },
              5:  { emoji: '💬', text: 'Active discussions' },
              12: { emoji: '👀', text: 'People are talking about this' },
            };

            const hotIndex = feedPosts.findIndex(p => {
              const ageHours = (Date.now() - new Date(p.created_date).getTime()) / 3600000;
              return ageHours < 48 && (p.likes_count || 0) + (p.comments_count || 0) * 2 >= 20;
            });
            let orderedPosts = [...feedPosts];
            if (hotIndex > 2) {
              const [hot] = orderedPosts.splice(hotIndex, 1);
              orderedPosts.splice(2, 0, hot);
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
            {/* Load more */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoading}
                  className="px-6 py-2 rounded-full bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Loading…' : 'Load more posts'}
                </button>
              </div>
            )}
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

      <button
        onClick={() => { setPostModalType('feed'); setPostModalSubtype(null); setPostModalInitialBody(''); setShowPostModal(true); }}
        className={`app-fab fixed bottom-[96px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-all duration-200 active:scale-95 ${isScrollingDown ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100 translate-y-0'}`}
        aria-label="Create post"
      >
        <Plus className="w-6 h-6" />
      </button>

      <UpcomingEventsSheet
        open={showEventsSheet}
        onOpenChange={setShowEventsSheet}
        currentUser={currentUser}
        joinedCommunityIds={communityGroups.map(c => c.id)}
      />

    </div>
  );
}

function HubMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
      <Icon className="mb-1 h-4 w-4 text-blue-600" />
      <p className="text-[13px] font-black text-slate-950">{value}</p>
      <p className="text-[10px] font-black uppercase leading-4 text-slate-500">{label}</p>
    </div>
  );
}

function FiveTownsDashboard({ pulse, actions, shabbosPrep, trustLayers, onNavigate, onPost }) {
  return (
    <section className="mb-3 space-y-3">
      <div className="app-card overflow-hidden">
        <div className="border-b border-slate-100 p-3">
          <p className="text-[12px] font-black uppercase tracking-wide text-blue-700">Today in the Five Towns</p>
          <p className="mt-0.5 text-[13px] font-semibold leading-5 text-slate-600">A daily control center for the Jewish local pulse.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {pulse.map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-2xl font-black text-slate-950">{item.value}</p>
              <p className="text-[12px] font-black text-slate-800">{item.label}</p>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onNavigate(action.path)}
                className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-3 text-left text-[12px] font-black text-slate-800 shadow-sm active:scale-[0.99]"
              >
                <Icon className="h-4 w-4 text-blue-600" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="app-card p-3">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-[15px] font-black text-slate-950">Shabbos prep mode</p>
              <p className="text-[12px] font-semibold text-slate-500">The weekly rhythm people will return for.</p>
            </div>
          </div>
          <div className="space-y-2">
            {shabbosPrep.map((item) => (
              <div key={item} className="rounded-2xl bg-blue-50 px-3 py-2 text-[12px] font-bold text-blue-800">{item}</div>
            ))}
          </div>
          <button
            onClick={() => onPost('help', 'shabbos', 'Before Shabbos I am looking for / can help with...')}
            className="mt-3 h-10 w-full rounded-xl bg-slate-950 text-[12px] font-black text-white active:scale-[0.98]"
          >
            Post before Shabbos
          </button>
        </div>

        <div className="app-card p-3">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-[15px] font-black text-slate-950">Local trust layer</p>
              <p className="text-[12px] font-semibold text-slate-500">Built for a real Jewish community.</p>
            </div>
          </div>
          <div className="space-y-2">
            {trustLayers.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-800">
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => onPost('feed', 'recommendation', 'Who do you recommend locally for...')}
            className="mt-3 h-10 w-full rounded-xl border border-emerald-100 bg-emerald-50 text-[12px] font-black text-emerald-800 active:scale-[0.98]"
          >
            Ask for a recommendation
          </button>
        </div>
      </div>

      <div className="app-card grid grid-cols-[44px_1fr_auto] items-center gap-3 p-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <Utensils className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-black text-slate-950">Kosher food, businesses, gemachs, and local recommendations</p>
          <p className="truncate text-[12px] font-semibold text-slate-500">This becomes the Five Towns directory people actually use.</p>
        </div>
        <button onClick={() => onNavigate('/search')} className="rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-black text-slate-700 active:scale-[0.98]">
          Search
        </button>
      </div>
    </section>
  );
}
