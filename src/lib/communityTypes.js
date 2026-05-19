import {
  BookOpen,
  CalendarDays,
  HeartHandshake,
  Home,
  Landmark,
  Megaphone,
  MessageCircleQuestion,
  ShoppingBag,
  Users,
} from 'lucide-react';

const SHARED_TABS = ['home', 'posts', 'members', 'about'];

export const COMMUNITY_TYPE_CONFIG = {
  general: {
    key: 'general',
    label: 'Community',
    pluralLabel: 'Communities',
    icon: Users,
    emoji: 'JU',
    accent: 'from-blue-600 to-slate-800',
    badgeClass: 'bg-blue-50 text-blue-700',
    softClass: 'bg-blue-50 text-blue-700 border-blue-100',
    tagline: 'A shared space for updates, questions, and connection.',
    cardFallback: 'A Jewish community space for conversation, updates, and useful local connection.',
    coverPattern: 'radial-gradient(circle at 18% 18%, rgba(255,255,255,.28), transparent 28%), linear-gradient(135deg, #2563eb 0%, #1e293b 100%)',
    primaryCta: 'Start a Post',
    secondaryCta: 'Ask a Question',
    prompts: ['Share a community update', 'Ask a helpful question', 'Start a local conversation'],
    emptyTitle: 'No posts here yet',
    emptyBody: 'Start the conversation with an update, question, or helpful note for the community.',
    tabs: ['home', 'posts', 'chat', 'members', 'about'],
    homeModules: ['composer', 'posts', 'chat', 'about'],
    descriptors: ['Member-led', 'Discussion'],
    composerMode: 'message',
    primaryTabs: ['home', 'posts', 'members', 'about'],
    moreTabs: ['chat'],
    homeEmphasis: 'feed',
  },
  neighborhood: {
    key: 'neighborhood',
    label: 'Neighborhood',
    pluralLabel: 'Neighborhoods',
    icon: Home,
    emoji: 'NB',
    accent: 'from-cyan-500 to-blue-700',
    badgeClass: 'bg-cyan-50 text-cyan-700',
    softClass: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    tagline: 'Local updates, recommendations, and neighbor-to-neighbor help.',
    cardFallback: 'A local hub for neighborhood updates, recommendations, and quick questions.',
    coverPattern: 'radial-gradient(circle at 76% 18%, rgba(255,255,255,.28), transparent 26%), linear-gradient(135deg, #06b6d4 0%, #1d4ed8 100%)',
    primaryCta: 'Share Local Update',
    secondaryCta: 'Ask Local Question',
    prompts: ['What should neighbors know today?', 'Ask for a local recommendation', 'Share something happening nearby'],
    emptyTitle: 'Nothing local posted yet',
    emptyBody: 'Share a local update or ask something nearby members can help with.',
    tabs: SHARED_TABS,
    homeModules: ['composer', 'posts', 'members', 'about'],
    descriptors: ['Local', 'Updates'],
    composerMode: 'message',
    primaryTabs: ['home', 'posts', 'events', 'members'],
    moreTabs: ['resources', 'about'],
    homeEmphasis: 'feed',
  },
  chesed: {
    key: 'chesed',
    label: 'Chesed',
    pluralLabel: 'Chesed',
    icon: HeartHandshake,
    emoji: 'CH',
    accent: 'from-emerald-500 to-teal-700',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    softClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagline: 'Needs, offers, and mitzvah coordination in one focused place.',
    cardFallback: 'A chesed circle for help requests, offers, meals, rides, and practical support.',
    coverPattern: 'radial-gradient(circle at 24% 20%, rgba(255,255,255,.3), transparent 28%), linear-gradient(135deg, #10b981 0%, #0f766e 100%)',
    primaryCta: 'Request Help',
    secondaryCta: 'Offer Help',
    prompts: ['Request help from this community', 'Offer a ride, meal, errand, or time', 'Share a completed mitzvah update'],
    emptyTitle: 'No open needs here yet',
    emptyBody: 'Be the first to request help, offer support, or coordinate something useful.',
    tabs: ['home', 'openNeeds', 'posts', 'members', 'about'],
    homeModules: ['openNeeds', 'composer', 'posts', 'about'],
    descriptors: ['Action', 'Support'],
    composerMode: 'chesed',
    primaryTabs: ['home', 'openNeeds', 'posts', 'members'],
    moreTabs: ['about'],
    homeEmphasis: 'chesed',
  },
  shul: {
    key: 'shul',
    label: 'Shul',
    pluralLabel: 'Shuls',
    icon: Landmark,
    emoji: 'SH',
    accent: 'from-indigo-600 to-violet-700',
    badgeClass: 'bg-indigo-50 text-indigo-700',
    softClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    tagline: 'Announcements, minyanim, shiurim, and shul community updates.',
    cardFallback: 'A shul hub for announcements, minyanim, shiurim, and community presence.',
    coverPattern: 'radial-gradient(circle at 72% 24%, rgba(255,255,255,.26), transparent 30%), linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)',
    primaryCta: 'View Updates',
    secondaryCta: 'Share Update',
    prompts: ['Share a shul announcement', 'Ask about a minyan or shiur', 'Post a community update'],
    emptyTitle: 'No announcements yet',
    emptyBody: 'Community updates, shul news, and useful posts will appear here.',
    tabs: ['home', 'announcements', 'events', 'resources', 'posts', 'members', 'about'],
    homeModules: ['announcements', 'events', 'resources', 'composer', 'posts', 'about'],
    descriptors: ['Announcements', 'Community'],
    composerMode: 'official',
    primaryTabs: ['home', 'events', 'resources', 'members'],
    moreTabs: ['posts', 'announcements', 'about'],
    homeEmphasis: 'announcements',
  },
  parents: {
    key: 'parents',
    label: 'Parents',
    pluralLabel: 'Parents',
    icon: MessageCircleQuestion,
    emoji: 'PA',
    accent: 'from-orange-400 to-amber-600',
    badgeClass: 'bg-orange-50 text-orange-700',
    softClass: 'bg-orange-50 text-orange-700 border-orange-100',
    tagline: 'Questions, recommendations, and coordination for families.',
    cardFallback: 'A parent space for school questions, recommendations, tips, and family coordination.',
    coverPattern: 'radial-gradient(circle at 22% 24%, rgba(255,255,255,.32), transparent 28%), linear-gradient(135deg, #fb923c 0%, #d97706 100%)',
    primaryCta: 'Ask a Question',
    secondaryCta: 'Request Recommendation',
    prompts: ['Ask for a local recommendation', 'Share a parenting tip', 'Start a school, camp, or family question'],
    emptyTitle: 'Start the parent conversation',
    emptyBody: 'Ask for a recommendation, school advice, babysitter tip, or local parenting help.',
    tabs: ['home', 'questions', 'posts', 'members', 'about'],
    homeModules: ['questions', 'composer', 'posts', 'about'],
    descriptors: ['Questions', 'Recommendations'],
    composerMode: 'message',
    primaryTabs: ['home', 'questions', 'events', 'members'],
    moreTabs: ['resources', 'about'],
    homeEmphasis: 'feed',
  },
  learning: {
    key: 'learning',
    label: 'Learning',
    pluralLabel: 'Learning',
    icon: BookOpen,
    emoji: 'LR',
    accent: 'from-amber-500 to-rose-600',
    badgeClass: 'bg-amber-50 text-amber-700',
    softClass: 'bg-amber-50 text-amber-700 border-amber-100',
    tagline: 'Shiurim, Torah questions, chavrusa talk, and shared resources.',
    cardFallback: 'A learning community for shiurim, Torah questions, chavrusa discussion, and ideas.',
    coverPattern: 'radial-gradient(circle at 70% 20%, rgba(255,255,255,.28), transparent 28%), linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)',
    primaryCta: 'Start Discussion',
    secondaryCta: 'Ask Learning Question',
    prompts: ['Ask a Torah or learning question', 'Share a shiur or thought', 'Start a chavrusa-style discussion'],
    emptyTitle: 'No learning discussions yet',
    emptyBody: 'Share a shiur, ask a Torah question, or begin a thoughtful discussion.',
    tabs: ['home', 'discussions', 'resources', 'posts', 'members', 'about'],
    homeModules: ['discussions', 'resources', 'composer', 'posts', 'about'],
    descriptors: ['Torah', 'Discussion'],
    composerMode: 'post',
    primaryTabs: ['home', 'discussions', 'resources', 'members'],
    moreTabs: ['posts', 'about'],
    homeEmphasis: 'resources',
  },
  marketplace: {
    key: 'marketplace',
    label: 'Marketplace',
    pluralLabel: 'Marketplace',
    icon: ShoppingBag,
    emoji: 'MK',
    accent: 'from-stone-600 to-slate-800',
    badgeClass: 'bg-stone-50 text-stone-700',
    softClass: 'bg-stone-50 text-stone-700 border-stone-100',
    tagline: 'Local exchange, recommendations, and practical posts.',
    cardFallback: 'A local exchange space for recommendations, gemach-style posts, and useful community needs.',
    coverPattern: 'radial-gradient(circle at 24% 20%, rgba(255,255,255,.24), transparent 28%), linear-gradient(135deg, #57534e 0%, #1f2937 100%)',
    primaryCta: 'Create Listing',
    secondaryCta: 'Ask Community',
    prompts: ['Post an item or useful local need', 'Ask for a recommendation', 'Share a gemach or practical resource'],
    emptyTitle: 'No listings yet',
    emptyBody: 'Create the first community listing or use posts for local recommendations and practical needs.',
    tabs: ['home', 'listings', 'posts', 'members', 'about'],
    homeModules: ['listings', 'composer', 'posts', 'about'],
    descriptors: ['Exchange', 'Recommendations'],
    composerMode: 'post',
    primaryTabs: ['home', 'listings', 'posts', 'members'],
    moreTabs: ['about'],
    homeEmphasis: 'feed',
  },
  events: {
    key: 'events',
    label: 'Events',
    pluralLabel: 'Events',
    icon: CalendarDays,
    emoji: 'EV',
    accent: 'from-rose-500 to-pink-700',
    badgeClass: 'bg-rose-50 text-rose-700',
    softClass: 'bg-rose-50 text-rose-700 border-rose-100',
    tagline: 'Gatherings, happenings, and conversation around what is coming up.',
    cardFallback: 'An events-focused space for upcoming gatherings, updates, and community conversation.',
    coverPattern: 'radial-gradient(circle at 78% 18%, rgba(255,255,255,.28), transparent 28%), linear-gradient(135deg, #f43f5e 0%, #be185d 100%)',
    primaryCta: 'Share Event',
    secondaryCta: 'Start Discussion',
    prompts: ['Share an upcoming event', 'Ask who is going', 'Post a gathering idea or update'],
    emptyTitle: 'No events yet',
    emptyBody: 'Upcoming gatherings and event updates will appear here once they are added.',
    tabs: ['home', 'events', 'posts', 'members', 'about'],
    homeModules: ['events', 'composer', 'posts', 'about'],
    descriptors: ['Events', 'Gatherings'],
    composerMode: 'message',
    primaryTabs: ['home', 'events', 'posts', 'members'],
    moreTabs: ['about'],
    homeEmphasis: 'events',
  },
};

export const COMMUNITY_TYPE_OPTIONS = Object.values(COMMUNITY_TYPE_CONFIG);

const TYPE_ALIASES = {
  general: 'general',
  community: 'general',
  communities: 'general',
  local: 'neighborhood',
  neighborhood: 'neighborhood',
  neighborhoods: 'neighborhood',
  city: 'neighborhood',
  five_towns: 'neighborhood',
  fiveTowns: 'neighborhood',
  support: 'chesed',
  chesed: 'chesed',
  chessed: 'chesed',
  mitzvah: 'chesed',
  help: 'chesed',
  volunteer: 'chesed',
  shul: 'shul',
  shuls: 'shul',
  synagogue: 'shul',
  minyan: 'shul',
  school: 'parents',
  schools: 'parents',
  parent: 'parents',
  parents: 'parents',
  parenting: 'parents',
  youth: 'parents',
  camp: 'parents',
  learning: 'learning',
  torah: 'learning',
  daf: 'learning',
  gemara: 'learning',
  shiur: 'learning',
  shiurim: 'learning',
  marketplace: 'marketplace',
  market: 'marketplace',
  buy_sell: 'marketplace',
  buySell: 'marketplace',
  'buy/sell': 'marketplace',
  business: 'marketplace',
  jobs: 'marketplace',
  food: 'marketplace',
  events: 'events',
  event: 'events',
  social: 'events',
  singles: 'events',
};

const normalizeToken = (value = '') =>
  String(value)
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();

export function getCommunityTypeKey(community = {}) {
  const candidates = [
    community.template_type,
    community.community_type,
    community.category,
    community.type,
    community.verified_type,
    community.name,
    community.communityType,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const raw = String(candidate).trim();
    const normalized = normalizeToken(raw);
    if (COMMUNITY_TYPE_CONFIG[normalized]) return normalized;
    if (TYPE_ALIASES[normalized]) return TYPE_ALIASES[normalized];

    const lower = raw.toLowerCase();
    if (lower.includes('chesed') || lower.includes('chessed') || lower.includes('mitzvah')) return 'chesed';
    if (lower.includes('shul') || lower.includes('synagogue') || lower.includes('minyan')) return 'shul';
    if (lower.includes('parent') || lower.includes('school') || lower.includes('camp')) return 'parents';
    if (lower.includes('learn') || lower.includes('torah') || lower.includes('gemara') || lower.includes('shiur')) return 'learning';
    if (lower.includes('market') || lower.includes('buy') || lower.includes('sell') || lower.includes('business')) return 'marketplace';
    if (lower.includes('event') || lower.includes('social') || lower.includes('single')) return 'events';
    if (lower.includes('neighborhood') || lower.includes('local') || lower.includes('town')) return 'neighborhood';
  }

  return 'general';
}

export function getCommunityTypeConfig(community = {}) {
  return COMMUNITY_TYPE_CONFIG[getCommunityTypeKey(community)] || COMMUNITY_TYPE_CONFIG.general;
}

export function getSupportedCommunityTabs(community = {}, productionCapabilities = {}) {
  const config = getCommunityTypeConfig(community);
  const baseSet = new Set(config.tabs);

  // Filter base tabs that require a capability.
  const filtered = config.tabs.filter((tab) => {
    if (tab === 'events') return Boolean(productionCapabilities.events);
    if (tab === 'resources') return Boolean(productionCapabilities.resources);
    if (tab === 'chat') return Boolean(productionCapabilities.chat);
    if (tab === 'listings') return Boolean(productionCapabilities.listings);
    return true;
  });

  // Admin-enabled modules may not be in the type's base tab list (e.g. resources on a
  // neighborhood community). Inject them before 'members' so they always appear when enabled.
  const insertIdx = filtered.includes('members') ? filtered.indexOf('members') : filtered.length;
  const extras = [];
  if (!baseSet.has('announcements')) extras.push('announcements');
  if (productionCapabilities.events && !baseSet.has('events')) extras.push('events');
  if (productionCapabilities.resources && !baseSet.has('resources')) extras.push('resources');
  if (productionCapabilities.listings && !baseSet.has('listings')) extras.push('listings');
  if (productionCapabilities.chat && !baseSet.has('chat')) extras.push('chat');
  if (productionCapabilities.groups && !baseSet.has('groups')) extras.push('groups');
  if (extras.length) filtered.splice(insertIdx, 0, ...extras);

  return filtered.length ? filtered : COMMUNITY_TYPE_CONFIG.general.tabs;
}

export function getCommunityTabLabel(tabKey) {
  const labels = {
    home: 'Home',
    posts: 'Posts',
    feed: 'Posts',
    questions: 'Questions',
    discussions: 'Discussions',
    openNeeds: 'Open Needs',
    announcements: 'Announcements',
    members: 'Members',
    about: 'About',
    events: 'Events',
    resources: 'Resources',
    chat: 'Chat',
    listings: 'Listings',
    groups: 'Groups',
  };
  return labels[tabKey] || tabKey;
}

/**
 * Returns { primary: string[], more: string[] } for community navigation.
 * Primary tabs are limited to ~4 visible items. Overflow goes to More.
 * Always respects what getSupportedCommunityTabs returns (capability-gated).
 */
export function getCommunityNavConfig(community = {}, capabilities = {}) {
  const config = getCommunityTypeConfig(community);
  const allSupported = getSupportedCommunityTabs(community, capabilities);
  const savedLayout = (community?.settings && typeof community.settings === 'object')
    ? community.settings.layout
    : null;
  const primaryIdeal = (savedLayout?.primaryTabs?.length ? savedLayout.primaryTabs : null)
    || config.primaryTabs
    || ['home', 'posts', 'members'];
  const primary = primaryIdeal.filter((t) => allSupported.includes(t));
  const more = allSupported.filter((t) => !primary.includes(t));
  return { primary, more };
}
