import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dataService, feedRetentionService, shabbatReminderService, storageService, togglePostLike } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { appParams } from '@/lib/app-params';
import { toast } from 'sonner';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import HomeFeedTabs from '@/components/feed/HomeFeedTabs';
import EventsForYou from '@/components/feed/EventsForYou';
import EventsFeedSection from '@/components/feed/EventsFeedSection';
import InlineFeedPrompt from '@/components/feed/InlineFeedPrompt';
import UnifiedPostModal from '@/components/feed/UnifiedPostModal';
import ReportModal from '@/components/common/ReportModal';
import PageHelp from '@/components/common/PageHelp';
import LiveNowRail from '@/components/common/LiveNowRail';
import NotificationBell from '@/components/notifications/NotificationBell';
import UpcomingEventsSheet from '@/components/feed/UpcomingEventsSheet';
import DailyHooks from '@/components/feed/DailyHooks';
import { Activity, ArrowRight, CalendarDays, ChevronDown, Heart, MessageCircle, Plus, RefreshCw, Search, Sparkles } from 'lucide-react';
import SkeletonCard from '@/components/common/SkeletonCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LocationNetworkPicker from '@/components/feed/LocationNetworkPicker';
import { LOCAL_NETWORKS } from '@/lib/localNetworks';
import { getShabbatTimes } from '@/lib/hebrewDate';
import useShabbatLocation from '@/hooks/useShabbatLocation';
import { useFloatingActions } from '@/components/layout/FloatingActionsContext';
import DestinationHeader from '@/components/layout/DestinationHeader';
import { buildFeedLiveNowItems } from '@/lib/liveNow';

const NEIGHBORHOODS = ['All Five Towns', 'Lawrence', 'Woodmere', 'Cedarhurst', 'Hewlett', 'Inwood'];
const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const FEED_LOAD_TIMEOUT_MS = 4500;
const withFeedTimeout = (promise, ms = FEED_LOAD_TIMEOUT_MS) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Feed request timed out')), ms);
  }),
]);
const getPostLivePriority = (post) => {
  const text = `${post.title || ''} ${post.body || ''} ${post.post_subtype || ''}`.toLowerCase();
  const created = new Date(post.created_date || post.created_at || post.updated_date || Date.now()).getTime();
  const ageHours = Math.max(0, (Date.now() - created) / 3600000);
  let score = 0;

  if (post.type === 'help' || post.board === 'help' || /urgent|need|ride|meal|help|tonight|today/.test(text)) score += 80;
  if (post.type === 'event' || post.event_date) {
    const eventTime = new Date(post.event_date || post.created_date || Date.now()).getTime();
    const hoursUntil = (eventTime - Date.now()) / 3600000;
    if (hoursUntil >= 0 && hoursUntil <= 12) score += 70;
    else score += 35;
  }
  if (/tonight|today|now|soon|before shabbos|ending/.test(text)) score += 45;
  if (ageHours < 2) score += 25;
  else if (ageHours < 8) score += 12;
  score += Math.min(35, Number(post.comments_count || 0) * 2 + Number(post.likes_count || 0));

  return score;
};
const DEMO_POSTS = [
  {
    id: 'demo-feed-minyan-early',
    type: 'news',
    post_subtype: 'shul_update',
    title: 'Early Shacharis tomorrow: which minyan is most reliable?',
    body: 'Need to be on the LIRR by 7:18 from Cedarhurst. Is the 6:20 at YILC still ending on time, or is there a better Woodmere option?',
    author_name: 'Ari G.',
    user_id: 'local-demo',
    community_id: 'five-towns-shul-network',
    community_name: 'Five Towns Shul Network',
    city: 'Five Towns',
    location_text: 'Cedarhurst',
    created_date: minutesAgo(14),
    updated_date: new Date().toISOString(),
    likes_count: 18,
    comments_count: 16,
  },
  {
    id: 'demo-feed-meals',
    type: 'help',
    post_subtype: 'chesed',
    title: 'Two Shabbos meal deliveries still open',
    body: 'One family in Woodmere and one in Lawrence need prepared meals dropped off before 1:30 Friday. Can split it if two people are available.',
    author_name: 'Rachel B.',
    user_id: 'local-demo-2',
    community_id: 'chesed-response-circle',
    community_name: 'Chesed Response Circle',
    city: 'Five Towns',
    location_text: 'Woodmere',
    created_date: minutesAgo(31),
    updated_date: new Date().toISOString(),
    likes_count: 27,
    comments_count: 12,
  },
  {
    id: 'demo-feed-restaurant',
    type: 'feed',
    post_subtype: 'recommendation',
    title: 'Best place for a quiet business lunch on Central?',
    body: 'Need kosher, not too loud, and decent seating for 3 people around 1 PM. Bonus if parking is not impossible.',
    author_name: 'Mordy K.',
    user_id: 'local-demo-3',
    community_id: 'jewish-marketplace-fivetowns',
    community_name: 'Five Towns Jewish Marketplace',
    city: 'Five Towns',
    location_text: 'Cedarhurst',
    created_date: minutesAgo(47),
    updated_date: new Date().toISOString(),
    likes_count: 9,
    comments_count: 23,
  },
  {
    id: 'demo-feed-event-tonight',
    type: 'event',
    post_subtype: 'local_event',
    title: 'Women’s shiur and dessert tonight',
    body: '8:15 PM in Woodmere. Topic is keeping connection at the Shabbos table with teens. Anyone know if there is a Zoom option?',
    author_name: 'Tova G.',
    user_id: 'local-demo-4',
    community_id: 'simcha-events-board',
    community_name: 'Simcha & Events Board',
    city: 'Five Towns',
    location_text: 'Woodmere',
    created_date: hoursAgo(1.2),
    updated_date: new Date().toISOString(),
    event_date: hoursFromNow(7),
    likes_count: 33,
    comments_count: 18,
  },
  {
    id: 'demo-feed-lost-siddur',
    type: 'feed',
    post_subtype: 'lost_found',
    title: 'Lost and found: black leather siddur',
    body: 'Found near Central Ave after mincha. Name inside looks like “Y. Rosen” but hard to read. I can leave it by the shul office.',
    author_name: 'Shul Office',
    user_id: 'local-demo-5',
    community_id: 'five-towns-shul-network',
    community_name: 'Five Towns Shul Network',
    city: 'Five Towns',
    location_text: 'Cedarhurst',
    created_date: hoursAgo(2),
    updated_date: new Date().toISOString(),
    likes_count: 14,
    comments_count: 7,
  },
  {
    id: 'demo-feed-halacha',
    type: 'news',
    post_subtype: 'learning',
    title: '20-minute halacha chabura after Maariv',
    body: 'Quick practical review: reheating soup, blech questions, and what to do if the urn was unplugged. Source sheet posted later tonight.',
    author_name: 'Rabbi Adler',
    user_id: 'local-demo-6',
    community_id: 'daily-learning-beis',
    community_name: 'Daily Learning Beis',
    city: 'Five Towns',
    location_text: 'Woodmere',
    created_date: hoursAgo(2.5),
    updated_date: new Date().toISOString(),
    likes_count: 41,
    comments_count: 11,
  },
  {
    id: 'demo-feed-jfk-ride',
    type: 'help',
    post_subtype: 'ride',
    title: 'JFK ride tomorrow 5:45 AM',
    body: 'One adult, one carry-on, leaving from Lawrence. Happy to pay gas or split with anyone already going that way.',
    author_name: 'Dani P.',
    user_id: 'local-demo-7',
    community_id: 'shabbos-table-hosts',
    community_name: 'Shabbos Table Hosts',
    city: 'Five Towns',
    location_text: 'Lawrence',
    created_date: hoursAgo(3),
    updated_date: new Date().toISOString(),
    likes_count: 7,
    comments_count: 14,
  },
  {
    id: 'demo-feed-park',
    type: 'event',
    post_subtype: 'parents',
    title: 'Parent meetup at Andrew J. Parise Park',
    body: 'A few families are meeting after school if the weather holds. Good for ages 3-7. Anyone bringing scooters?',
    author_name: 'Naomi A.',
    user_id: 'local-demo-8',
    community_id: 'young-parents-five-towns',
    community_name: 'Young Parents Five Towns',
    city: 'Five Towns',
    location_text: 'Cedarhurst',
    created_date: hoursAgo(4),
    updated_date: new Date().toISOString(),
    event_date: hoursFromNow(27),
    likes_count: 19,
    comments_count: 20,
  },
  {
    id: 'demo-feed-new-family',
    type: 'feed',
    post_subtype: 'welcome',
    title: 'New family moving to Inwood this week',
    body: 'Family with two kids under 6. Looking for someone to drop off a small welcome basket and maybe invite them for Shabbos lunch.',
    author_name: 'Welcome Committee',
    user_id: 'local-demo-9',
    community_id: 'five-towns-shul-network',
    community_name: 'Five Towns Shul Network',
    city: 'Five Towns',
    location_text: 'Inwood',
    created_date: hoursAgo(5),
    updated_date: new Date().toISOString(),
    likes_count: 22,
    comments_count: 10,
  },
  {
    id: 'demo-feed-hosting',
    type: 'help',
    post_subtype: 'shabbos',
    title: 'Two guests looking for Shabbos lunch',
    body: 'Newly married couple staying in Woodmere. Walking distance preferred. They are easygoing, no allergies.',
    author_name: 'Tova G.',
    user_id: 'local-demo-10',
    community_id: 'shabbos-table-hosts',
    community_name: 'Shabbos Table Hosts',
    city: 'Five Towns',
    location_text: 'Woodmere',
    created_date: hoursAgo(5.5),
    updated_date: new Date().toISOString(),
    likes_count: 35,
    comments_count: 17,
  },
  {
    id: 'demo-feed-pickleball',
    type: 'event',
    post_subtype: 'hobbies',
    title: 'Pickleball ladder needs two more players',
    body: 'Thursday 8:15 PM, beginner-friendly court and one competitive court. Please comment skill level so we can split evenly.',
    author_name: 'Josh M.',
    user_id: 'local-demo-11',
    community_id: 'five-towns-pickleball',
    community_name: 'Five Towns Pickleball & Sports',
    city: 'Five Towns',
    location_text: 'Lawrence',
    created_date: hoursAgo(6),
    updated_date: new Date().toISOString(),
    event_date: hoursFromNow(30),
    likes_count: 26,
    comments_count: 21,
  },
  {
    id: 'demo-feed-babysitter',
    type: 'feed',
    post_subtype: 'recommendation',
    title: 'Reliable Motzei Shabbos babysitter?',
    body: 'Looking for someone for 7:45-10:30 in Hewlett. Kids are asleep most of the time. Any names you trust?',
    author_name: 'Esti F.',
    user_id: 'local-demo-12',
    community_id: 'young-parents-five-towns',
    community_name: 'Young Parents Five Towns',
    city: 'Five Towns',
    location_text: 'Hewlett',
    created_date: hoursAgo(6.5),
    updated_date: new Date().toISOString(),
    likes_count: 12,
    comments_count: 28,
  },
  {
    id: 'demo-feed-marketplace-chairs',
    type: 'feed',
    post_subtype: 'marketplace',
    title: 'Looking to borrow 12 folding chairs',
    body: 'Need them for a small vort next Tuesday in Cedarhurst. Can pick up and return same night.',
    author_name: 'Yoni G.',
    user_id: 'local-demo-13',
    community_id: 'jewish-marketplace-fivetowns',
    community_name: 'Five Towns Jewish Marketplace',
    city: 'Five Towns',
    location_text: 'Cedarhurst',
    created_date: hoursAgo(7),
    updated_date: new Date().toISOString(),
    likes_count: 8,
    comments_count: 13,
  },
  {
    id: 'demo-feed-eruv',
    type: 'news',
    post_subtype: 'shul_update',
    title: 'Eruv status thread for this week',
    body: 'Can we keep one thread here for any updates? Please post only confirmed info and source.',
    author_name: 'Avi R.',
    user_id: 'local-demo-14',
    community_id: 'five-towns-shul-network',
    community_name: 'Five Towns Shul Network',
    city: 'Five Towns',
    location_text: 'Five Towns',
    created_date: hoursAgo(8),
    updated_date: new Date().toISOString(),
    likes_count: 44,
    comments_count: 19,
  },
  {
    id: 'demo-feed-seforim',
    type: 'feed',
    post_subtype: 'marketplace',
    title: 'Free seforim shelf pickup',
    body: 'A few duplicate Mishnayos sets and old chumashim available. Please take only what you will use.',
    author_name: 'Miriam C.',
    user_id: 'local-demo-15',
    community_id: 'jewish-marketplace-fivetowns',
    community_name: 'Five Towns Jewish Marketplace',
    city: 'Five Towns',
    location_text: 'Woodmere',
    created_date: hoursAgo(9),
    updated_date: new Date().toISOString(),
    likes_count: 31,
    comments_count: 15,
  },
  {
    id: 'demo-feed-tech',
    type: 'help',
    post_subtype: 'tech_help',
    title: 'Can someone help set up a printer for an older neighbor?',
    body: 'Near Peninsula Blvd. Probably 20 minutes if you know wireless printers. They are flexible tonight or tomorrow.',
    author_name: 'Moshe K.',
    user_id: 'local-demo-16',
    community_id: 'chesed-response-circle',
    community_name: 'Chesed Response Circle',
    city: 'Five Towns',
    location_text: 'Hewlett',
    created_date: hoursAgo(10),
    updated_date: new Date().toISOString(),
    likes_count: 16,
    comments_count: 8,
  },
  {
    id: 'demo-feed-singles',
    type: 'event',
    post_subtype: 'singles',
    title: 'Board game night: still room for 6',
    body: 'Moderated singles event Motzei Shabbos. Ages 24-32. Details sent after approval. Anyone able to bring Codenames?',
    author_name: 'Tamar K.',
    user_id: 'local-demo-17',
    community_id: 'jewish-singles-circle',
    community_name: 'Jewish Singles Circle',
    city: 'Five Towns',
    location_text: 'Nassau and Queens',
    created_date: hoursAgo(11),
    updated_date: new Date().toISOString(),
    event_date: hoursFromNow(50),
    likes_count: 18,
    comments_count: 12,
  },
  {
    id: 'demo-feed-screens',
    type: 'feed',
    post_subtype: 'values',
    title: 'Phones at the Shabbos table: what actually works?',
    body: 'We want a warmer table, not a fight every week. What boundaries have worked in your home with teens?',
    author_name: 'Maya R.',
    user_id: 'local-demo-18',
    community_id: 'modern-orthodox-home-builders',
    community_name: 'Modern Orthodox Home Builders',
    city: 'Five Towns',
    location_text: 'Five Towns',
    created_date: hoursAgo(12),
    updated_date: new Date().toISOString(),
    likes_count: 52,
    comments_count: 34,
  },
  {
    id: 'demo-feed-cleanup',
    type: 'event',
    post_subtype: 'neighborhood',
    title: 'Sunday neighborhood cleanup',
    body: 'Meeting 10:30 near Central Ave. Gloves and bags provided. Good chesed hours opportunity for teens.',
    author_name: 'Cedarhurst Board',
    user_id: 'local-demo-19',
    community_id: 'cedarhurst-neighborhood-watch',
    community_name: 'Cedarhurst Neighborhood Board',
    city: 'Five Towns',
    location_text: 'Cedarhurst',
    created_date: hoursAgo(13),
    updated_date: new Date().toISOString(),
    event_date: hoursFromNow(72),
    likes_count: 23,
    comments_count: 9,
  },
  {
    id: 'demo-feed-apartment',
    type: 'feed',
    post_subtype: 'housing',
    title: 'Young couple looking for basement apartment',
    body: 'Woodmere/Lawrence preferred, near shul if possible. Budget flexible for the right place. Please message leads.',
    author_name: 'Leah W.',
    user_id: 'local-demo-20',
    community_id: 'five-towns-shul-network',
    community_name: 'Five Towns Shul Network',
    city: 'Five Towns',
    location_text: 'Woodmere',
    created_date: hoursAgo(15),
    updated_date: new Date().toISOString(),
    likes_count: 10,
    comments_count: 18,
  },
  {
    id: 'demo-feed-tehillim',
    type: 'help',
    post_subtype: 'tehillim',
    title: 'Tehillim group tonight 9:15',
    body: 'Short call for a local refuah request. Please comment if you want the name privately.',
    author_name: 'Chesed Circle',
    user_id: 'local-demo-21',
    community_id: 'chesed-response-circle',
    community_name: 'Chesed Response Circle',
    city: 'Five Towns',
    location_text: 'Five Towns',
    created_date: hoursAgo(16),
    updated_date: new Date().toISOString(),
    likes_count: 37,
    comments_count: 22,
  },
  {
    id: 'demo-feed-carpool',
    type: 'help',
    post_subtype: 'ride',
    title: 'Cedarhurst to Woodmere morning carpool',
    body: 'We have two seats available leaving 7:48. Can add one stop near Central if timing works.',
    author_name: 'Ben T.',
    user_id: 'local-demo-22',
    community_id: 'young-parents-five-towns',
    community_name: 'Young Parents Five Towns',
    city: 'Five Towns',
    location_text: 'Cedarhurst',
    created_date: hoursAgo(18),
    updated_date: new Date().toISOString(),
    likes_count: 11,
    comments_count: 10,
  },
  {
    id: 'demo-feed-cholent',
    type: 'feed',
    post_subtype: 'recommendation',
    title: 'Best takeout cholent for a small kiddush?',
    body: 'Need enough for around 35 people. Looking for something reliable and not too salty. Any recent experiences?',
    author_name: 'Noam C.',
    user_id: 'local-demo-23',
    community_id: 'jewish-marketplace-fivetowns',
    community_name: 'Five Towns Jewish Marketplace',
    city: 'Five Towns',
    location_text: 'Lawrence',
    created_date: hoursAgo(20),
    updated_date: new Date().toISOString(),
    likes_count: 15,
    comments_count: 26,
  },
];


export default function Feed({ isActive = true }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { registerFloatingAction } = useFloatingActions();
  const [activeTab, setActiveTab] = useState('for_you');
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
  // CommentsSheet is now handled inside each UnifiedPostCard via createPortal
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [showEventsSheet, setShowEventsSheet] = useState(false);
  const { location: candleLocation, locationLoading: candleLocationLoading } = useShabbatLocation({ autoRequest: true });
  const shabbat = useShabbosCountdown(candleLocation, candleLocationLoading);

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
  const [userGeo, setUserGeo] = useState(null); // { lat, lng }
  const [feedPrompts, setFeedPrompts] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [cachedPosts, setCachedPosts] = useState([]);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [page, setPage] = useState(0);
  const [allPosts, setAllPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 30;
  const [showNetworkBanner, setShowNetworkBanner] = useState(() => !storageService.getItem('junited_network_banner_v2_dismissed'));
  const [dailyPrompt, setDailyPrompt] = useState(null);
  const [publishedBrief, setPublishedBrief] = useState(null);

  const openCreatePost = useCallback(() => {
    setPostModalType('feed');
    setPostModalSubtype(null);
    setPostModalInitialBody('');
    setShowPostModal(true);
  }, []);

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
      const prompts = await dataService.entities.DailyFeedPrompt.list('-created_date', 5);
      if (prompts?.length > 0) setFeedPrompts(prompts);
    } catch {}
  }, []);

	  const { data: posts = [], isLoading, isError, refetch } = useQuery({
	    queryKey: ['unified-posts', page],
	    queryFn: async () => {
	      if (!appParams.hasBackendConfig) return page === 0 ? DEMO_POSTS : [];
	      try {
	        const p = await withFeedTimeout(dataService.entities.UnifiedPost.list('-updated_date', PAGE_SIZE, page * PAGE_SIZE));
	        return p?.length ? p : (page === 0 ? DEMO_POSTS : []);
	      } catch (error) {
	        console.warn('Feed posts fallback used:', error?.message || error);
	        return page === 0 ? DEMO_POSTS : [];
	      }
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

  useEffect(() => {
    feedRetentionService.getDailyPrompt({ network: primaryNetwork.cityPreset || 'Five Towns', userId: currentUser?.id })
      .then(setDailyPrompt)
      .catch(() => setDailyPrompt(null));
  }, [currentUser?.id, primaryNetwork.cityPreset]);

  useEffect(() => {
    feedRetentionService.getPublishedBrief({ network: primaryNetwork.cityPreset || 'Five Towns' })
      .then(setPublishedBrief)
      .catch(() => setPublishedBrief(null));
  }, [primaryNetwork.cityPreset]);

	  // If the backend hangs, stop showing skeletons and let cached/demo posts render.
	  useEffect(() => {
	    if (!isLoading) {
	      setLoadTimedOut(false);
	      return undefined;
	    }
	    const timer = setTimeout(() => setLoadTimedOut(true), FEED_LOAD_TIMEOUT_MS);
	    return () => clearTimeout(timer);
	  }, [isLoading, page, activeTab]);

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
    navigate('/Communities?communityId=' + communityId);
  }, [navigate]);

  const handleComment = useCallback((p) => {
    recordInterest(p);
  }, [recordInterest]);

  const handleDelete = useCallback((id) => deleteMutation.mutate(id), [deleteMutation.mutate]);

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

  const engagementScore = (p) => feedRetentionService.scorePost(p, {
    joinedCommunityIds,
    primaryNetwork,
    userInterests: currentUser?.interests || [],
    interestSignals,
  });

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

  const dailyBrief = useMemo(() => feedRetentionService.buildBrief({
    posts: feedPosts,
    communityGroups,
    networkLabel: primaryNetwork.shortLabel || primaryNetwork.cityPreset || 'Five Towns',
    curatedBrief: publishedBrief,
  }), [communityGroups, feedPosts, primaryNetwork.cityPreset, primaryNetwork.shortLabel, publishedBrief]);

  const feedMomentum = useMemo(() => ({
    activeThreads: feedPosts.filter((post) => (post.comments_count || 0) >= 8).length,
    joinedPosts: feedPosts.filter((post) => post.community_id && joinedCommunityIds.has(post.community_id)).length,
    localEvents: feedPosts.filter((post) => post.type === 'event').length,
  }), [feedPosts, joinedCommunityIds]);

  const liveNowItems = useMemo(() => buildFeedLiveNowItems({
    posts: feedPosts,
    networkLabel: primaryNetwork.shortLabel || 'Five Towns',
  }), [feedPosts, primaryNetwork.shortLabel]);

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
          <button
            onClick={() => setShowLocationPicker(v => !v)}
            className="app-chip app-chip-active min-h-[44px] min-w-0 border-blue-200 bg-blue-50 shadow-sm touch-manipulation active:scale-95"
          >
            <span>{primaryNetwork.emoji}</span>
            <span className="truncate">{primaryNetwork.shortLabel}</span>
            <ChevronDown className="w-3 h-3 shrink-0 text-blue-400 transition-transform" style={{ transform: showLocationPicker ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        )}
        actions={(
          <>
            <button onClick={() => navigate('/SupportJUnited')} className="app-icon-button surface-tile-hover touch-manipulation" aria-label="Support JUnited">
              <Heart className="h-[18px] w-[18px] text-rose-400" />
            </button>
            <button onClick={() => navigate('/search')} className="app-icon-button surface-tile-hover touch-manipulation" aria-label="Search">
              <Search className="h-[18px] w-[18px] text-slate-500" />
            </button>
            <NotificationBell userId={currentUser?.id} />
          </>
        )}
      />

      {showLocationPicker && (
        <div className="sticky top-[78px] z-20">
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

      <div className="mobile-page px-3 pt-2 mobile-safe-bottom">
        <div className="flex items-center gap-1.5 mb-3">
          <h1 className="text-[20px] font-black text-slate-950">Community Feed</h1>
          <PageHelp text="See what's happening in your community, from updates and announcements to posts from people nearby." />
        </div>

        <DailyRetentionPrompt
          prompt={dailyPrompt}
          shabbat={shabbat}
          onPost={(prompt) => {
            setPostModalType(prompt?.suggested_post_type || 'feed');
            setPostModalSubtype(prompt?.suggested_post_subtype || null);
            setPostModalInitialBody(prompt?.initial_body || '');
            setShowPostModal(true);
          }}
        />

        <LiveNowRail
          className="mb-3"
          title="Live in the Five Towns"
          subtitle="Urgent needs, tonight plans, and active local threads"
          items={liveNowItems}
          onItemClick={(item) => navigate(item.href || '/Feed')}
        />

        <FiveTownsBrief
          brief={dailyBrief}
          momentum={feedMomentum}
          posts={feedPosts}
          joinedCommunityIds={joinedCommunityIds}
          onOpenMap={() => navigate('/Map')}
          onOpenCommunities={() => navigate('/Communities')}
          onCreate={(type, subtype, body) => {
            setPostModalType(type);
            setPostModalSubtype(subtype);
            setPostModalInitialBody(body);
            setShowPostModal(true);
          }}
        />

        <QuickActionDock
          onCreate={(type, subtype, body) => {
            setPostModalType(type);
            setPostModalSubtype(subtype);
            setPostModalInitialBody(body);
            setShowPostModal(true);
          }}
          onOpenEvents={() => setShowEventsSheet(true)}
          onOpenMap={() => navigate('/Map')}
        />

        {/* One-time network banner for new users */}
        {showNetworkBanner && (
          <div className="graphic-stripes mb-3 flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-4 py-3 text-white text-[12px] font-medium shadow-[0_14px_30px_rgba(37,99,235,0.18)]">
            <span className="text-lg">{primaryNetwork.emoji}</span>
            <span className="flex-1">You're viewing <strong>{primaryNetwork.shortLabel}</strong> — tap the chip above to switch networks.</span>
            <button onClick={() => { setShowNetworkBanner(false); storageService.setItem('junited_network_banner_v2_dismissed', '1'); }} className="text-white/70 hover:text-white text-lg leading-none font-bold flex-shrink-0">×</button>
          </div>
        )}

        <HomeFeedTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === 'events' && !isLoading && (
          <div className="surface-panel mb-3 overflow-hidden rounded-[28px]">
          <EventsForYou currentUser={currentUser} events={visiblePosts.filter(p => p.type === 'event')} />
          <EventsFeedSection
            posts={visiblePosts}
            currentUser={currentUser}
            onCreateEvent={() => { setPostModalType('event'); setShowPostModal(true); }}
          />
          </div>
        )}

        {activeTab !== 'events' && isLoading && !loadTimedOut && (
          <div key={`loading-${activeTab}`} className="motion-stagger space-y-3 tab-fade-in">
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
          <div key={`feed-${activeTab}`} className="motion-stagger tab-fade-in space-y-2">
            <div className="app-card overflow-hidden">
              {/* Question of the Day — embedded as first "post" in the feed card */}
              <DailyHooks
                onPostClick={(type, subtype, prefill) => {
                  setPostModalType(type);
                  setPostModalSubtype(subtype || null);
                  setPostModalInitialBody(prefill || '');
                  setShowPostModal(true);
                }}
              />
            </div>
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
            let orderedPosts = [...feedPosts].sort((a, b) => getPostLivePriority(b) - getPostLivePriority(a));
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
              const personalizationReasons = feedRetentionService.explainPost(post, {
                joinedCommunityIds,
                primaryNetwork,
                userInterests: currentUser?.interests || [],
              });
              return (
                <React.Fragment key={post.id}>
                  {sectionLabel && (
                    <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/70 px-3 py-2">
                      <span className="text-base">{sectionLabel.emoji}</span>
                      <span className="text-[12px] font-bold uppercase text-slate-700">{sectionLabel.text}</span>
                    </div>
                  )}
                  {showCommunityDivider && (
                    <div className="flex items-center gap-2 rounded-2xl bg-indigo-50/80 px-3 py-2">
                      <span className="text-[11px] font-bold uppercase text-indigo-600">👥 From your communities</span>
                    </div>
                  )}
                  <div className="app-card overflow-hidden">
                    {personalizationReasons.length > 0 && (
                      <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-blue-50/60 px-3 py-2">
                        {personalizationReasons.map((reason) => (
                          <span key={`${post.id}-${reason}`} className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[11px] font-black text-blue-700">
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                    <UnifiedPostCard
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
                     isFromJoinedCommunity={isFromJoinedCommunity}
                    />
                  </div>
                  {(index + 1) % 6 === 0 && feedPrompts[(Math.floor((index + 1) / 6) - 1) % feedPrompts.length] && (
                    <div className="app-card overflow-hidden">
                      <InlineFeedPrompt
                        prompt={feedPrompts[(Math.floor((index + 1) / 6) - 1) % feedPrompts.length]}
                        onReply={(p) => { setPinnedPrompt(p); setShowPromptReply(true); }}
                      />
                    </div>
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
                  className="motion-press px-6 py-2 rounded-full bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
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

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
        currentUser={currentUser}
      />

      <UpcomingEventsSheet
        open={showEventsSheet}
        onOpenChange={setShowEventsSheet}
        currentUser={currentUser}
        joinedCommunityIds={communityGroups.map(c => c.id)}
      />

    </div>
  );
}

function extractHolidayName(title) {
  if (!title) return 'Yom Tov';
  return title
    .replace(/\s+\d{4}$/, '')
    .replace(/:\s*.+$/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+(?:I{1,3}|IV|VI{0,3}|VII|VIII)\s*$/i, '')
    .trim() || 'Yom Tov';
}

function useShabbosCountdown(location, locationLoading) {
  const [state, setState] = useState({ label: 'Shabbat', countdown: 'Loading…', time: '', locationLabel: null });

  useEffect(() => {
    if (locationLoading) return;
    let cancelled = false;
    let times = null;

    const load = async () => {
      times = await getShabbatTimes(location.lat, location.lng, location.tzid);
      if (!cancelled) update();
    };

    const update = () => {
      const displayLabel = location.type !== 'default' ? location.label : null;
      if (!times) {
        setState({ label: 'Shabbat', countdown: 'Soon', time: '', locationLabel: displayLabel });
        return;
      }
      const now = new Date();
      const majorHolidays = times.majorHolidays || [];
      const allEvents = [
        ...(times.allCandles  || []).map(c => ({ date: new Date(c.date), type: 'candles'  })),
        ...(times.allHavdalah || []).map(h => ({ date: new Date(h.date), type: 'havdalah' })),
      ].sort((a, b) => a.date - b.date);
      // backwards compat if allCandles/allHavdalah not yet populated
      if (allEvents.length === 0) {
        if (times.candleLighting) allEvents.push({ date: new Date(times.candleLighting), type: 'candles' });
        if (times.havdalah)       allEvents.push({ date: new Date(times.havdalah),       type: 'havdalah' });
      }
      const upcoming = allEvents.find(e => e.date > now);
      if (!upcoming) {
        setState({ label: 'Shabbat', countdown: 'Shavua tov', time: '', locationLabel: displayLabel });
        return;
      }
      const ms = upcoming.date - now;
      const totalH = Math.floor(ms / 3600000);
      const d = Math.floor(totalH / 24);
      const h = totalH % 24;
      const time = upcoming.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const countdown = d > 0 ? `${d}d ${h}h away` : `${h}h away`;

      let label;
      if (upcoming.type === 'candles') {
        const pad2 = n => String(n).padStart(2, '0');
        const candleDateStr = [
          upcoming.date.getFullYear(),
          pad2(upcoming.date.getMonth() + 1),
          pad2(upcoming.date.getDate()),
        ].join('-');
        const matchedHoliday = majorHolidays.find(hol => hol.date >= candleDateStr);
        label = matchedHoliday ? extractHolidayName(matchedHoliday.title) : 'Candle lighting';
      } else {
        label = 'Havdalah';
      }

      setState({ label, countdown, time, locationLabel: displayLabel });
    };

    load();
    const t = setInterval(update, 60000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [location.lat, location.lng, location.tzid, locationLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

function FiveTownsBrief({ brief, momentum, posts = [], joinedCommunityIds, onOpenMap, onOpenCommunities, onCreate }) {
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
  const mitzvahOffers = posts
    .filter((post) => post.type === 'help' || /help|chesed|meal|ride|offer|volunteer/i.test(`${post.title || ''} ${post.body || ''}`))
    .slice(0, 3);
  const communityEvents = posts
    .filter((post) => post.type === 'event' && (!joinedCommunityIds?.size || joinedCommunityIds.has(post.community_id)))
    .slice(0, 3);

  const slides = [
    {
      key: 'news',
      eyebrow: 'Five Towns News',
      title: brief.title,
      subtitle: brief.verifiedLocalBrief
        ? 'Three verified local updates worth knowing today.'
        : brief.rotatingDailyBrief
          ? 'Three fresh daily local prompts rotate by date until a curated brief is published.'
          : 'The updates worth noticing before the feed gets noisy.',
      items: newsItems,
      tone: 'from-slate-950 via-blue-900 to-cyan-800',
      empty: 'No major local news posts yet today.',
      actionLabel: 'Open map',
      onAction: onOpenMap,
    },
    {
      key: 'trending',
      eyebrow: 'Trending Posts',
      title: 'What people are talking about',
      subtitle: `${momentum.activeThreads} active conversations are pulling the community together.`,
      items: trendingPosts,
      tone: 'from-indigo-950 via-blue-800 to-violet-700',
      empty: 'No trending posts yet. The next one could start with you.',
      actionLabel: 'Browse communities',
      onAction: onOpenCommunities,
    },
    {
      key: 'mitzvah',
      eyebrow: 'Mitzvahs Near You',
      title: 'Help moving through the network',
      subtitle: 'Requests, offers, and local chesed that deserve a faster response.',
      items: mitzvahOffers,
      tone: 'from-emerald-950 via-emerald-800 to-teal-700',
      empty: 'No open chesed threads surfaced yet.',
      actionLabel: 'Post help',
      onAction: () => onCreate('help', 'chesed', 'I can help with / I need help with...'),
    },
    {
      key: 'events',
      eyebrow: 'Events In Your Communities',
      title: 'What is coming up',
      subtitle: 'Community events that belong on your radar.',
      items: communityEvents,
      tone: 'from-rose-950 via-fuchsia-800 to-orange-700',
      empty: 'No community events posted yet.',
      actionLabel: 'Share event',
      onAction: () => onCreate('event', 'local_event', 'Event details: '),
    },
  ];
  const slide = slides[activeSlide];

  return (
    <section className="surface-panel mb-3 overflow-hidden rounded-[28px]">
      <div className={`graphic-stripes bg-gradient-to-br ${slide.tone} p-4 text-white sm:p-5`}>
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
                const scroller = briefScrollerRef.current;
                if (scroller) {
                  scroller.scrollTo({
                    left: scroller.clientWidth * index,
                    behavior: 'smooth',
                  });
                }
              }}
              className={`motion-press shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                index === activeSlide ? 'bg-white text-slate-950' : 'border border-white/15 bg-white/10 text-white/90'
              }`}
            >
              {item.eyebrow}
            </button>
          ))}
        </div>

        <div
          ref={briefScrollerRef}
          className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
          onScroll={(event) => {
            const node = event.currentTarget;
            const slideWidth = Math.max(node.clientWidth, 1);
            const rawIndex = node.scrollLeft / slideWidth;
            const nextIndex = Math.round(rawIndex);
            const settledNearSlide = Math.abs(rawIndex - nextIndex) <= 0.18;
            if (!settledNearSlide) return;
            if (Number.isFinite(nextIndex) && nextIndex !== activeSlide && nextIndex >= 0 && nextIndex < slides.length) {
              setActiveSlide(nextIndex);
            }
          }}
        >
          {slides.map((item, index) => (
            <div key={`slide-${item.key}`} className="min-w-full snap-start">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-white/75">{item.eyebrow}</p>
                <h2 className="mt-1 text-[21px] font-black leading-tight">{item.title}</h2>
                <p className="mt-1 max-w-2xl text-sm font-semibold text-white/85">{item.subtitle}</p>

                <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto]">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {item.items.length > 0 ? item.items.map((post) => (
                      <div key={`${item.key}-${post.id}`} className="rounded-2xl border border-white/15 bg-white/12 px-3 py-3 backdrop-blur-sm">
                        <p className="line-clamp-2 text-[13px] font-black leading-5 text-white">{post.title || post.body || 'Community update'}</p>
                        <p className="mt-2 text-[11px] font-semibold text-white/75">
                          {(post.community_name || post.location_text || 'Five Towns')}
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

function QuickActionDock({ onCreate, onOpenEvents, onOpenMap }) {
  const actions = [
    {
      label: 'Ask local question',
      detail: 'Get recommendations or practical answers',
      onClick: () => onCreate('feed', 'question', 'Question for the community: '),
    },
    {
      label: 'Offer help',
      detail: 'Meals, rides, errands, or small acts of chesed',
      onClick: () => onCreate('help', 'chesed', 'I can help with...'),
    },
    {
      label: 'Share event',
      detail: 'Shiur, meetup, school, simcha, or local gathering',
      onClick: () => onCreate('event', 'local_event', 'Event details: '),
    },
  ];

  return (
    <section className="surface-panel-soft mb-3 rounded-[24px] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">Start something useful</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">Fast paths for the posts that keep a community alive.</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button onClick={onOpenEvents} className="motion-press rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600">Events</button>
          <button onClick={onOpenMap} className="motion-press rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600">Map</button>
        </div>
      </div>
      <div className="mobile-scroll-x mt-3 flex gap-2 pb-1">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="motion-press min-w-[220px] shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            <p className="text-[13px] font-black text-slate-950">{action.label}</p>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{action.detail}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function DailyRetentionPrompt({ prompt, onPost, shabbat }) {
  if (!prompt) return null;

  return (
    <section className="app-card mb-3 overflow-hidden">
      <div
        className="p-4"
        style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 45%, #92400E 100%)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wider text-blue-200">Daily Prompt</p>
            <h2 className="mt-1.5 text-[16px] font-black leading-snug text-white">{prompt.question}</h2>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/15 backdrop-blur-sm px-3 py-2 text-center min-w-[80px]">
            <p className="text-[9px] font-black uppercase tracking-wide text-amber-200">🕯 {shabbat.label}</p>
            <p className="mt-0.5 text-[12px] font-black text-white leading-tight">{shabbat.countdown}</p>
            {shabbat.time && <p className="mt-0.5 text-[10px] font-bold text-blue-100">{shabbat.time}</p>}
            {shabbat.locationLabel && (
              <p className="mt-0.5 text-[9px] text-white/55 leading-tight truncate max-w-[88px]">
                📍 {shabbat.locationLabel}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]">
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-black uppercase text-slate-400">Suggested</p>
          <p className="mt-1 text-[12px] font-bold text-slate-700">{prompt.initial_body || 'Share what you need, know, or can offer.'}</p>
        </div>
        <button
          onClick={() => onPost(prompt)}
          className="h-11 rounded-xl bg-blue-600 px-4 text-[13px] font-black text-white active:scale-[0.98]"
        >
          {prompt.cta_label || 'Post'}
        </button>
      </div>
    </section>
  );
}
