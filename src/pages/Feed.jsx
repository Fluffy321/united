import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dataService, feedRetentionService, shabbatReminderService, storageService, togglePostLike } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { appParams } from '@/lib/app-params';
import { toast } from 'sonner';
import UnifiedPostCard from '@/components/feed/UnifiedPostCard';
import UnifiedPostModal from '@/components/feed/UnifiedPostModal';
import ReportModal from '@/components/common/ReportModal';
import PageHelp from '@/components/common/PageHelp';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Activity, ArrowRight, CalendarDays, Car, ChevronDown, Handshake, Heart, MapPin, MessageCircle, Plus, RefreshCw, Search, Sparkles, Store, Users } from 'lucide-react';
import SkeletonCard from '@/components/common/SkeletonCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LocationNetworkPicker from '@/components/feed/LocationNetworkPicker';
import { LOCAL_NETWORKS } from '@/lib/localNetworks';
import { useFloatingActions } from '@/components/layout/FloatingActionsContext';
import DestinationHeader from '@/components/layout/DestinationHeader';

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

const postDate = (post) => post?.updated_date || post?.updated_at || post?.created_date || post?.created_at;

const formatPostAge = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(time)) return 'Just now';
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
};

const feedText = (post) => post?.title || post?.body || 'Community update';

const feedBody = (post) => {
  const body = post?.body || post?.description || '';
  if (post?.title && body.toLowerCase().trim() === post.title.toLowerCase().trim()) return '';
  return body;
};

const matchesText = (post, pattern) => pattern.test(`${post?.type || ''} ${post?.post_subtype || ''} ${post?.title || ''} ${post?.body || ''} ${post?.community_name || ''}`);

const getCardIntent = (post) => {
  const text = `${post?.type || ''} ${post?.post_subtype || ''} ${post?.title || ''} ${post?.body || ''}`.toLowerCase();
  if (post?.type === 'help' || /need|help|meal|ride|chesed|urgent|favor|tehillim|volunteer/.test(text)) {
    return { label: 'Help needed', cta: "I'll help", tone: 'red', icon: Handshake };
  }
  if (/carpool|ride|drive|seat|pickup|jfk/.test(text)) {
    return { label: 'Carpool', cta: 'Join', tone: 'blue', icon: Car };
  }
  if (post?.type === 'event' || post?.event_date || /event|shiur|tonight|meetup|game|cleanup/.test(text)) {
    return { label: 'Event', cta: 'RSVP', tone: 'orange', icon: CalendarDays };
  }
  if (/business|restaurant|shop|marketplace|menu|sale|free|pickup|borrow/.test(text)) {
    return { label: 'Local listing', cta: 'Message', tone: 'teal', icon: Store };
  }
  if (/question|rec|recommend|looking|where|anyone|best/.test(text)) {
    return { label: 'Question', cta: 'Reply', tone: 'purple', icon: MessageCircle };
  }
  return { label: 'Local post', cta: 'Reply', tone: 'slate', icon: MessageCircle };
};

const toneClasses = {
  red: {
    pill: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
    cta: 'text-red-700',
    bar: 'from-red-500 to-orange-400',
  },
  orange: {
    pill: 'border-orange-200 bg-orange-50 text-orange-700',
    dot: 'bg-orange-500',
    cta: 'text-orange-700',
    bar: 'from-orange-500 to-amber-400',
  },
  teal: {
    pill: 'border-teal-200 bg-teal-50 text-teal-700',
    dot: 'bg-teal-500',
    cta: 'text-teal-700',
    bar: 'from-teal-500 to-emerald-400',
  },
  blue: {
    pill: 'border-blue-200 bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
    cta: 'text-blue-700',
    bar: 'from-blue-500 to-indigo-500',
  },
  purple: {
    pill: 'border-violet-200 bg-violet-50 text-violet-700',
    dot: 'bg-violet-500',
    cta: 'text-violet-700',
    bar: 'from-violet-500 to-fuchsia-500',
  },
  slate: {
    pill: 'border-slate-200 bg-slate-50 text-slate-700',
    dot: 'bg-slate-400',
    cta: 'text-blue-700',
    bar: 'from-blue-500 to-indigo-500',
  },
};

const uniquePosts = (posts, predicate, limit, used = new Set()) => {
  const picked = [];
  for (const post of posts) {
    if (!post?.id || used.has(post.id) || !predicate(post)) continue;
    picked.push(post);
    used.add(post.id);
    if (picked.length >= limit) break;
  }
  return picked;
};

const buildFeedSections = (posts) => {
  const ranked = [...posts].sort((a, b) => {
    const priority = getPostLivePriority(b) - getPostLivePriority(a);
    if (priority !== 0) return priority;
    const timeA = new Date(postDate(a) || 0).getTime() || 0;
    const timeB = new Date(postDate(b) || 0).getTime() || 0;
    return timeB - timeA;
  });
  const byReplies = [...posts].sort((a, b) => (Number(b.comments_count || 0) + Number(b.likes_count || 0)) - (Number(a.comments_count || 0) + Number(a.likes_count || 0)));
  const used = new Set();
  const liveNow = uniquePosts(ranked, (post) => getPostLivePriority(post) > 0 || Number(post.comments_count || 0) >= 12, 6, used);
  const today = uniquePosts(ranked, (post) => !matchesText(post, /marketplace|business|restaurant|shop|free|pickup/) && post.type !== 'help', 6, used);
  const talking = uniquePosts(byReplies, (post) => Number(post.comments_count || 0) >= 8 || Number(post.likes_count || 0) >= 10, 5, used);
  const nearYou = uniquePosts(ranked, (post) => Boolean(post.location_text) || matchesText(post, /restaurant|business|shop|map|pickup|woodmere|cedarhurst|lawrence|hewlett|inwood/), 5, used);
  const mitzvah = uniquePosts(ranked, (post) => post.type === 'help' || matchesText(post, /help|need|chesed|mitzvah|meal|ride|tehillim|volunteer/), 5, used);

  return [
    {
      key: 'live-now',
      title: 'Live Now',
      subtitle: 'Urgent needs, minyanim, events starting soon, and active discussions.',
      icon: Activity,
      items: liveNow.length ? liveNow : ranked.slice(0, 3),
    },
    {
      key: 'today',
      title: 'Today in Five Towns',
      subtitle: 'One shared stream for neighbor questions, plans, updates, and announcements.',
      icon: MessageCircle,
      items: today.length ? today : ranked.slice(0, 4),
    },
    {
      key: 'talking',
      title: 'People Are Talking About',
      subtitle: 'The threads with the most replies and momentum.',
      icon: Users,
      items: talking,
    },
    {
      key: 'near-you',
      title: 'Near You',
      subtitle: 'Map-linked posts, restaurants, businesses, pickups, and local activity.',
      icon: MapPin,
      items: nearYou,
    },
    {
      key: 'mitzvah',
      title: 'Help / Mitzvah',
      subtitle: 'Needs, offers, carpools, completed mitzvahs, and people stepping up.',
      icon: Handshake,
      items: mitzvah,
    },
  ];
};


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
  const [showPostModal, setShowPostModal] = useState(false);
  const [postModalType, setPostModalType] = useState('feed');
  const [postModalSubtype, setPostModalSubtype] = useState(null);
  const [postModalInitialBody, setPostModalInitialBody] = useState('');
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
  const [cachedPosts, setCachedPosts] = useState([]);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [page, setPage] = useState(0);
  const [allPosts, setAllPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [dailyPrompt, setDailyPrompt] = useState(null);
  const [publishedBrief, setPublishedBrief] = useState(null);
  const PAGE_SIZE = 30;
  const [showNetworkBanner, setShowNetworkBanner] = useState(() => !storageService.getItem('junited_network_banner_v2_dismissed'));

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

  // If the backend hangs, stop showing skeletons and let cached/demo posts render.
  useEffect(() => {
    if (!isLoading) {
      setLoadTimedOut(false);
      return undefined;
    }
    const timer = setTimeout(() => setLoadTimedOut(true), FEED_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoading, page]);

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
      setPostModalType('event');
      setPostModalSubtype('reply');
      setPostModalInitialBody(`I want to join: ${feedText(post)}`);
      setShowPostModal(true);
      return;
    }
    if (intent.label === 'Local listing') {
      navigate('/Marketplace');
      return;
    }
    setPostModalType('feed');
    setPostModalSubtype('reply');
    setPostModalInitialBody(`Replying to ${post.author_name || 'a neighbor'} about "${feedText(post)}"...`);
    setShowPostModal(true);
  }, [navigate, recordInterest]);

  const handleCardOpen = useCallback((post) => {
    recordInterest(post);
    if (post.type === 'help') {
      navigate('/MitzvahCircle');
      return;
    }
    if (post.type === 'event') {
      setPostModalType('event');
      setPostModalSubtype('local_event');
      setPostModalInitialBody(`Following up on: ${feedText(post)}`);
      setShowPostModal(true);
      return;
    }
    setPostModalType('feed');
    setPostModalSubtype('discussion');
    setPostModalInitialBody('');
    setShowPostModal(true);
  }, [navigate, recordInterest]);

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
          <h1 className="text-[20px] font-black text-slate-950">Five Towns Feed</h1>
          <PageHelp text="The main local thread for questions, plans, needs, businesses, carpools, events, and neighbor-to-neighbor help." />
        </div>

        <FiveTownsConversationHub
          posts={feedPosts}
          networkLabel={primaryNetwork.shortLabel || 'Five Towns'}
          onCreate={(type, subtype, body) => {
            setPostModalType(type);
            setPostModalSubtype(subtype);
            setPostModalInitialBody(body);
            setShowPostModal(true);
          }}
          onOpenMap={() => navigate('/Map')}
          onOpenMitzvah={() => navigate('/MitzvahCircle')}
          onOpenEvents={() => {
            setPostModalType('event');
            setPostModalSubtype('local_event');
            setPostModalInitialBody('');
            setShowPostModal(true);
          }}
          onOpenMarketplace={() => navigate('/Marketplace')}
        />

        <FiveTownsThreadChain
          posts={feedPosts}
          likedPostIds={userLikes}
          onLike={handleLike}
          onReply={handleCardReply}
          onOpen={handleCardOpen}
          onMap={() => navigate('/Map')}
          onCreate={() => {
            setPostModalType('feed');
            setPostModalSubtype('discussion');
            setPostModalInitialBody('');
            setShowPostModal(true);
          }}
        />

        {/* One-time network banner for new users */}
        {showNetworkBanner && (
          <div className="graphic-stripes mb-3 flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-4 py-3 text-white text-[12px] font-medium shadow-[0_14px_30px_rgba(37,99,235,0.18)]">
            <span className="text-lg">{primaryNetwork.emoji}</span>
            <span className="flex-1">You're viewing <strong>{primaryNetwork.shortLabel}</strong> — tap the chip above to switch networks.</span>
            <button onClick={() => { setShowNetworkBanner(false); storageService.setItem('junited_network_banner_v2_dismissed', '1'); }} className="text-white/70 hover:text-white text-lg leading-none font-bold flex-shrink-0">×</button>
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
                dense={index !== 1}
                likedPostIds={userLikes}
                onLike={handleLike}
                onReply={handleCardReply}
                onOpen={handleCardOpen}
                onMap={() => navigate('/Map')}
              />
            ))}

            <FiveTownsBrief
              brief={dailyBrief}
              momentum={feedMomentum}
              posts={feedPosts}
              joinedCommunityIds={joinedCommunityIds}
              prompt={dailyPrompt}
              onOpenMap={() => navigate('/Map')}
              onOpenCommunities={() => navigate('/Communities')}
              onCreate={(type, subtype, body) => {
                setPostModalType(type);
                setPostModalSubtype(subtype);
                setPostModalInitialBody(body);
                setShowPostModal(true);
              }}
            />

            <details className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-black text-slate-900">
                Full thread history
                <span className="ml-2 text-[11px] font-bold text-slate-400">{feedPosts.length} posts</span>
              </summary>
              <div className="space-y-2 border-t border-slate-100 p-2">
                {feedPosts.slice(0, 10).map((post) => (
                  <div key={`history-${post.id}`} className="overflow-hidden rounded-[18px] border border-slate-100 bg-white">
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
                      isFromJoinedCommunity={post.community_id && joinedCommunityIds.has(post.community_id)}
                    />
                  </div>
                ))}
              </div>
            </details>

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
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
            <h2 className="text-[14px] font-black uppercase tracking-wide text-slate-950">Main Five Towns chain</h2>
          </div>
          <p className="mt-1 text-[12px] font-semibold leading-4 text-slate-400">
            One running neighborhood thread for questions, needs, plans, rides, and useful updates.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="motion-press shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[12px] font-black text-white"
        >
          Start thread
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
              {section.key === 'live-now' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${section.key === 'live-now' ? 'bg-red-500' : 'bg-blue-500'}`} />
            </span>
            <h2 className="text-[14px] font-black uppercase tracking-wide text-slate-950">{section.title}</h2>
          </div>
          <p className="mt-1 text-[12px] font-semibold leading-4 text-slate-400">{section.subtitle}</p>
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
