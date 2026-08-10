const STANDARD_TABS = ['updates', 'discuss', 'directory'];

export const BRIEF_CATEGORIES = [
  {
    id: 'local',
    label: 'Local Updates',
    description: 'News, notices, and changes nearby.',
    icon: 'MapPinned',
    accent: 'blue',
    card: { shortLabel: 'Local', tone: 'blue', emptyLabel: 'Share or check a local update' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'share_update', label: 'Share update', composer: { type: 'feed', subtype: 'local_update', initialBody: '' } },
      { id: 'report_issue', label: 'Report an issue', composer: { type: 'feed', subtype: 'local_issue', initialBody: '' } },
    ],
  },
  {
    id: 'helping',
    label: 'Helping',
    description: 'Ask for support or show up for someone.',
    icon: 'HeartHandshake',
    accent: 'rose',
    card: { shortLabel: 'Helping', tone: 'emerald', emptyLabel: 'Ask for or offer help' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'ask_help', label: 'Ask for help', composer: { type: 'help', subtype: 'need_help', initialBody: '' } },
      { id: 'offer_help', label: 'Offer help', composer: { type: 'feed', subtype: 'offer_help', initialBody: 'I can help with…' } },
    ],
  },
  {
    id: 'jewish_times',
    label: 'Jewish Times',
    description: 'Candle lighting, zmanim, and timely reminders.',
    icon: 'Sunset',
    accent: 'amber',
    card: { shortLabel: 'Jewish Times', tone: 'amber', emptyLabel: 'Check today’s Jewish times' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'view_times', label: 'View today’s times', destination: '/Zmanim' },
      { id: 'share_reminder', label: 'Share a reminder', composer: { type: 'feed', subtype: 'jewish_times', initialBody: '' } },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    description: 'What is happening across your community.',
    icon: 'CalendarDays',
    accent: 'orange',
    card: { shortLabel: 'Events', tone: 'orange', emptyLabel: 'See or plan what’s happening' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'browse_events', label: 'Browse events', destination: 'events_sheet' },
      { id: 'plan_event', label: 'Plan something', composer: { type: 'event', subtype: 'plan', initialBody: '' } },
    ],
  },
  {
    id: 'kosher_food',
    label: 'Kosher Food',
    description: 'Recommendations, openings, and local food talk.',
    icon: 'Utensils',
    accent: 'emerald',
    card: { shortLabel: 'Kosher Food', tone: 'lime', emptyLabel: 'Ask or share a kosher food tip' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'ask_food', label: 'Ask for a recommendation', composer: { type: 'feed', subtype: 'recommendation', initialBody: 'Where should I go for…' } },
      { id: 'share_food', label: 'Share a food update', composer: { type: 'feed', subtype: 'kosher_food', initialBody: '' } },
    ],
  },
  {
    id: 'minyanim',
    label: 'Minyanim',
    description: 'Find and share prayer times nearby.',
    icon: 'UsersRound',
    accent: 'indigo',
    card: { shortLabel: 'Minyanim', tone: 'indigo', emptyLabel: 'Find a minyan nearby' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'find_minyan', label: 'Find a minyan', destination: 'minyan_sheet' },
      { id: 'share_minyan', label: 'Share a minyan', composer: { type: 'feed', subtype: 'minyan', initialBody: '' } },
    ],
  },
  {
    id: 'parents_schools',
    label: 'Parents & Schools',
    description: 'School updates and useful parent-to-parent help.',
    icon: 'School',
    accent: 'sky',
    card: { shortLabel: 'Parents', tone: 'sky', emptyLabel: 'Ask parents or share school news' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'ask_parents', label: 'Ask parents', composer: { type: 'feed', subtype: 'question', initialBody: '' } },
      { id: 'share_school', label: 'Share a school update', composer: { type: 'feed', subtype: 'school', initialBody: '' } },
    ],
  },
  {
    id: 'torah_learning',
    label: 'Torah & Learning',
    description: 'Shiurim, chavrusas, and learning opportunities.',
    icon: 'BookOpen',
    accent: 'violet',
    card: { shortLabel: 'Learning', tone: 'violet', emptyLabel: 'Find learning or share a shiur' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'find_learning', label: 'Find learning', composer: { type: 'feed', subtype: 'connection', initialBody: 'I am looking to learn…' } },
      { id: 'share_shiur', label: 'Share a shiur', composer: { type: 'event', subtype: 'shiur', initialBody: '' } },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    description: 'Buy, sell, give, and find useful things locally.',
    icon: 'ShoppingBag',
    accent: 'teal',
    card: { shortLabel: 'Marketplace', tone: 'teal', emptyLabel: 'Browse or post a local listing' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'browse_marketplace', label: 'Browse listings', destination: '/Marketplace' },
      { id: 'post_listing', label: 'Post a listing', composer: { type: 'marketplace', subtype: 'marketplace', initialBody: '' } },
    ],
  },
  {
    id: 'jobs_business',
    label: 'Jobs & Business',
    description: 'Local work, services, referrals, and opportunities.',
    icon: 'BriefcaseBusiness',
    accent: 'slate',
    card: { shortLabel: 'Jobs', tone: 'slate', emptyLabel: 'Share work or ask for a referral' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'share_job', label: 'Share an opportunity', composer: { type: 'feed', subtype: 'job', initialBody: '' } },
      { id: 'ask_business', label: 'Ask for a referral', composer: { type: 'feed', subtype: 'recommendation', initialBody: '' } },
    ],
  },
  {
    id: 'sports_social',
    label: 'Sports & Social',
    description: 'Games, meetups, and easy ways to connect.',
    icon: 'Dumbbell',
    accent: 'lime',
    card: { shortLabel: 'Social', tone: 'rose', emptyLabel: 'Find or plan something social' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'find_activity', label: 'Find an activity', composer: { type: 'feed', subtype: 'connection', initialBody: 'Who wants to…' } },
      { id: 'plan_activity', label: 'Plan an activity', composer: { type: 'event', subtype: 'plan', initialBody: '' } },
    ],
  },
  {
    id: 'shabbos_plans',
    label: 'Shabbos Plans',
    description: 'Hosting, meals, rides, and plans for Shabbos.',
    icon: 'Wine',
    accent: 'fuchsia',
    card: { shortLabel: 'Shabbos', tone: 'fuchsia', emptyLabel: 'Find a host or offer a seat' },
    tabs: STANDARD_TABS,
    actions: [
      { id: 'find_host', label: 'Find a host', composer: { type: 'help', subtype: 'shabbos', initialBody: 'For Shabbos, I am looking for…' } },
      { id: 'offer_seat', label: 'Offer a seat', composer: { type: 'feed', subtype: 'offer_help', initialBody: 'For Shabbos, I can host…' } },
    ],
  },
];

export const BRIEF_CATEGORY_IDS = BRIEF_CATEGORIES.map(({ id }) => id);

export const DEFAULT_BRIEF_CATEGORY_IDS = ['local', 'helping', 'events', 'jewish_times'];

export function getBriefCategory(categoryId) {
  return BRIEF_CATEGORIES.find(({ id }) => id === categoryId) || null;
}
