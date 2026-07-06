import { getAuthRedirectUrl, shouldUseSupabase, supabase } from '@/api/supabaseClient';

const STORAGE_PREFIX = 'junited_local_entity_';
const SUPABASE_ENTITY_TABLES = {
  // Core — migration 001_core.sql
  User: 'profiles',
  Profile: 'profiles',
  Community: 'communities',
  UnifiedPost: 'posts',
  Post: 'posts',
  PostFeedView: 'posts_feed_view',
  // Messaging — migration 002_messages.sql
  Conversation: 'conversations',
  Message: 'messages',
  // Feature tables — migration 004_core_feature_tables.sql
  UserCommunity: 'community_memberships',
  Comment: 'comments',
  Reaction: 'reactions',
  Notification: 'notifications',
  MitzvahRequest: 'mitzvah_requests',
  MitzvahRequestComment: 'mitzvah_request_comments',
  HelpOffer: 'mitzvah_offers',
  MitzvahSignup: 'mitzvah_offers',
  MitzvahCompletion: 'mitzvah_completions',
  VerificationRequest: 'verification_requests',
  ChesedLog: 'chesed_hours_logs',
  UserStreak: 'user_streaks',
  MitzvahLog: 'mitzvah_logs',
  MitzvahAction: 'mitzvah_actions',
  MitzvahPoints: 'mitzvah_points',
  Block: 'user_blocks',
  FriendRequest: 'friend_requests',
  Friendship: 'friendships',
  // Messaging permissions — migration 20260517033459_message_requests.sql
  MessageRequest: 'message_requests',
  // Bookmarks — migration 20260517030617_bookmarks.sql
  Bookmark: 'bookmarks',
  // In-app feedback — migration 20260516170012_app_feedback.sql
  AppFeedback: 'app_feedback',
  // Community feature backbone — migration 020_community_feature_backbone.sql
  CommunityEvent: 'community_events',
  CommunityEventRSVP: 'community_event_rsvps',
  RSVP: 'community_event_rsvps',
  CommunityResource: 'community_resources',
  CommunityListing: 'community_listings',
  CommunityGroupChat: 'community_group_chats',
  CommunityPost: 'posts',
  // Feed retention — migration 007_feed_retention.sql
  FeedUserPreference: 'feed_user_preferences',
  FeedEngagementEvent: 'feed_engagement_events',
  DailyFeedPrompt: 'daily_feed_prompts',
  FiveTownsBrief: 'five_towns_briefs',
  // Admin tables — migration 008_admin_rls.sql + 013_admin_entity_columns.sql
  Report: 'reports',
  ClaimRequest: 'claim_requests',
  ModerationAuditLog: 'moderation_audit_logs',
  // Community admin center — migration 024_community_admin_center.sql
  CommunityMemberRemoval: 'community_member_removals',
  CommunityMemberAppeal: 'community_member_appeals',
  CommunityAdminAuditLog: 'community_admin_audit_log',
  // Poll votes — migration 030_poll_votes.sql
  PollVote: 'poll_votes',
  // Local updates automation — migration 20260515180122_local_updates_automation.sql
  LocalUpdateSource: 'local_update_sources',
  LocalUpdateItem: 'local_update_items',
  // Business directory MVP — migration 20260516011532_business_directory_mvp.sql
  BusinessListing: 'business_listings',
  BusinessClaimRequest: 'business_claim_requests',
  BusinessManager: 'business_managers',
  BusinessReview: 'business_reviews',
  RetentionEvent: 'retention_events',
  // Stripe payments — migration transactions.sql
  Transaction: 'transactions',
  // Premium Community Plans — migration 20260517204500_premium_community_plans.sql
  CommunityPlanSubscription: 'community_plan_subscriptions',
  // Community Groups — migration 20260517221000_community_groups.sql
  CommunityGroup:    'community_groups',
  GroupMember:       'group_members',
  GroupPost:         'group_posts',
  GroupJoinRequest:  'group_join_requests',
  // Community invites — migration 20260519220000_invite_links.sql
  InviteLink: 'invite_links',
  // Activity digest — migration 20260519000000_community_last_visits.sql
  CommunityLastVisit: 'community_last_visits',
  // Meal trains — migration 20260622223000_meal_trains.sql
  MealTrainRequest: 'meal_train_requests',
  // Yahrzeits & refuah — migration 20260701130000_yahrzeits_refuah.sql
  Yahrzeit: 'yahrzeits',
  RefuahRequest: 'refuah_requests',
  MealSlot: 'meal_slots',
  // Eruv/gemach/simcha — migration 20260701160000_eruv_gemach_simcha.sql
  Gemach: 'gemachs',
  SimchaAnnouncement: 'simcha_announcements',
  // Community forms — migration 20260520025433_community_forms.sql
  CommunityForm: 'community_forms',
  CommunityFormField: 'community_form_fields',
  CommunityFormSubmission: 'community_form_submissions',
  // Volunteer slots — migration 20260520200328_community_volunteer_slots.sql
  CommunityVolunteerSlot: 'community_volunteer_slots',
  // All other entities (Shul, etc.) are
  // intentionally unmapped — their DB tables do not exist yet. Each unmapped
  // entity will throw clearly in production rather than silently using localStorage.
  // See the UNMAPPED ENTITIES section below for the full list and
  // the required migrations.
};

const PUBLIC_PROFILE_ENTITIES = new Set(['User', 'Profile']);
const PUBLIC_PROFILE_SELECT = 'id,display_name,avatar_url,cover_url,username,public_community,city,bio,age_range,is_verified,verified_type,communities_joined_count,helper_actions_count,is_profile_complete,created_at,updated_at';

const demoUser = {
  id: 'local-demo',
  full_name: 'Local Demo User',
  display_name: 'Demo',
  email: 'demo@junited.local',
  cityPreset: 'Five Towns',
  role: 'user',
  age_range: '18+',
  is_profile_complete: true,
  interests: ['chesed', 'events', 'community'],
  message_settings: {
    allow_messages_from: 'members',
    show_online_status: true,
  },
};

const demoUsers = [
  demoUser,
  {
    id: 'demo-avi',
    full_name: 'Avi Rosen',
    display_name: 'Avi',
    email: 'avi@junited.local',
    avatar_url: '',
    age_range: '18+',
    message_settings: { searchable: true, allowMessagesFrom: 'everyone' },
  },
];

const now = Date.now();
const demoConversations = [
  {
    id: 'local-conv-avi',
    participant_ids: ['local-demo', 'demo-avi'],
    participant_names: ['Demo', 'Avi Rosen'],
    participant_ages: ['18+', '18+'],
    participant_avatars: ['', ''],
    last_message: 'Thanks again for helping with the meal delivery.',
    last_message_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    updated_date: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    unread_count: {},
    request_type: 'general',
  },
];

const demoMessages = [
  {
    id: 'local-msg-4',
    conversation_id: 'local-conv-avi',
    sender_id: 'demo-avi',
    sender_name: 'Avi',
    recipient_id: 'local-demo',
    content: 'Thanks again for helping with the meal delivery.',
    created_date: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
  },
];

const DAILY_TORAH_COMMUNITY_ID = 'seed-daily-torah';
const DAILY_TORAH_SOURCES = [
  {
    slot: 'morning',
    hour: 7,
    ref: 'Pirkei Avot 1:2',
    title: 'Morning Torah: the three pillars',
    text: 'Shimon the Righteous taught that the world stands on Torah, avodah, and acts of chesed.',
    action: 'Choose one small act of Torah, tefillah, or chesed that can shape the tone of your day.',
    source_url: 'https://www.sefaria.org/Pirkei_Avot.1.2',
  },
  {
    slot: 'afternoon',
    hour: 13,
    ref: 'Proverbs 3:6',
    title: 'Midday Torah: bring Hashem into the route',
    text: 'Mishlei teaches, "Know Him in all your ways," calling us to bring Hashem into ordinary choices.',
    action: 'Before the next decision, pause and name what a more honest, Jewish choice would look like.',
    source_url: 'https://www.sefaria.org/Proverbs.3.6',
  },
  {
    slot: 'evening',
    hour: 20,
    ref: 'Psalms 121:1',
    title: 'Evening Torah: lift your eyes',
    text: 'Tehillim begins this chapter by lifting eyes toward the mountains and asking where help comes from.',
    action: 'Write one sentence about where you needed help today, and where you noticed help arrive.',
    source_url: 'https://www.sefaria.org/Psalms.121.1',
  },
];

function getLocalDailyTorahParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const read = (type) => parts.find((part) => part.type === type)?.value || '';
  return {
    dateKey: `${read('year')}-${read('month')}-${read('day')}`,
    weekday: read('weekday'),
    hour: Number(read('hour') || '0'),
  };
}

async function publishLocalDailyTorah(payload = {}) {
  const { dateKey, weekday, hour } = getLocalDailyTorahParts();
  const requestedSlot = payload.slot || null;
  const existing = await activeEntities.UnifiedPost.filter({ community_id: DAILY_TORAH_COMMUNITY_ID }, '-created_date', 80);
  const seen = new Set((existing || []).map((post) => `${post.migrated_from || ''} ${post.title || ''}`));
  const candidates = DAILY_TORAH_SOURCES
    .filter((source) => (requestedSlot ? requestedSlot === source.slot : hour >= source.hour))
    .map((source) => ({
      migrated_from: `daily-torah:${dateKey}:${source.slot}`,
      title: source.title,
      type: 'announcement',
      body: [
        `${source.ref}: ${source.text}`,
        '',
        `Reflect: ${source.action}`,
        '',
        `Verified source: Sefaria (${source.ref})`,
        source.source_url,
      ].join('\n'),
      source_name: 'Sefaria',
      source_ref: source.ref,
      source_url: source.source_url,
    }));

  if (requestedSlot === 'friday-parsha' || (!requestedSlot && weekday === 'Fri' && hour >= 12)) {
    candidates.push(
      {
        migrated_from: `daily-torah:${dateKey}:friday-parsha-1`,
        title: 'Friday Parsha: source-backed table thought',
        type: 'announcement',
        body: [
          'Friday parsha posts are published from Hebcal’s weekly parsha calendar in production.',
          '',
          'Dvar Torah prompt: What is one idea from this week’s parsha that can become one real action before Shabbos?',
          '',
          'Verified source: Hebcal Shabbat API',
          'https://www.hebcal.com/home/developer-apis',
        ].join('\n'),
        source_name: 'Hebcal',
        source_ref: 'Weekly parsha',
        source_url: 'https://www.hebcal.com/home/developer-apis',
      },
      {
        migrated_from: `daily-torah:${dateKey}:friday-parsha-2`,
        title: 'Friday Parsha: one question for the table',
        type: 'question',
        body: [
          'Use this at the table: Where does this week’s parsha ask us to take more responsibility for the people around us?',
          '',
          'Verified source: Hebcal Shabbat API',
          'https://www.hebcal.com/home/developer-apis',
        ].join('\n'),
        source_name: 'Hebcal',
        source_ref: 'Weekly parsha',
        source_url: 'https://www.hebcal.com/home/developer-apis',
      },
    );
  }

  const created = [];
  for (const candidate of candidates) {
    if ([...seen].some((text) => text.includes(candidate.migrated_from))) continue;
    const post = await activeEntities.UnifiedPost.create({
      ...candidate,
      user_id: 'official-daily-torah',
      user_name: 'JUnited Torah Desk',
      author_name: 'JUnited Torah Desk',
      community_id: DAILY_TORAH_COMMUNITY_ID,
      community_name: 'Daily Torah',
      board: 'feed',
      post_type: candidate.type,
      content: candidate.body,
      is_official: true,
      is_pinned: candidate.type === 'announcement',
    });
    created.push(post);
    seen.add(candidate.migrated_from);
  }

  return { ok: true, localPreview: true, created: created.length, skipped: candidates.length - created.length };
}

const seedData = {
  User: demoUsers,
  Conversation: demoConversations,
  Message: demoMessages,
  Community: [
    {
      id: 'demo-community',
      name: 'Five Towns',
      type: 'Neighborhood',
      follower_count: 128,
      updated_date: new Date(now - 60 * 60 * 1000).toISOString(),
    },
  ],
  UserCommunity: [
    { id: 'local-membership-1', user_id: 'local-demo', community_id: 'demo-community', role: 'Member' },
  ],
  MitzvahRequest: [
    {
      id: 'local-mitzvah-1',
      title: 'Deliver Shabbos meals',
      description: 'A family in Woodmere could use help delivering two prepared meals before Shabbos.',
      category: 'Food / Meals',
      status: 'open',
      urgency: 'today',
      meals_needed: 5,
      locationLabel: 'Woodmere',
      approxLat: 40.6323,
      approxLng: -73.7129,
      created_by_user_id: 'local-chesed-desk',
      created_by_name: 'Five Towns Chesed Desk',
      offers_count: 1,
      comments_count: 2,
      views_count: 24,
      created_date: new Date(now - 45 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'local-mitzvah-2',
      title: 'Ride to doctor appointment',
      description: 'Looking for a ride from Cedarhurst to a local appointment tomorrow morning.',
      category: 'Transportation',
      status: 'open',
      urgency: 'urgent',
      seats_needed: 1,
      locationLabel: 'Cedarhurst',
      approxLat: 40.6223,
      approxLng: -73.7246,
      created_by_user_id: 'demo-avi',
      created_by_name: 'Avi',
      offers_count: 0,
      views_count: 18,
      created_date: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'local-mitzvah-3',
      title: 'Set up chairs for learning night',
      description: 'Need two volunteers to help set up before the evening shiur.',
      category: 'Shul Help',
      status: 'open',
      urgency: 'flexible',
      volunteers_needed: 2,
      locationLabel: 'Lawrence',
      approxLat: 40.6157,
      approxLng: -73.7296,
      created_by_user_id: 'local-shul-coordinator',
      created_by_name: 'Shul Coordinator',
      offers_count: 2,
      comments_count: 1,
      views_count: 31,
      created_date: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'local-mitzvah-completed-1',
      title: 'Grocery pickup completed',
      description: 'Helped a neighbor pick up groceries before Yom Tov.',
      category: 'Chesed',
      status: 'completed',
      locationLabel: 'Five Towns',
      claimed_by_user_id: 'local-demo',
      claimed_by_name: 'Demo',
      created_by_user_id: 'demo-avi',
      created_by_name: 'Avi',
      created_date: new Date(now - 28 * 60 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
  MitzvahSignup: [
    {
      id: 'local-mitzvah-signup-1',
      request_id: 'local-mitzvah-1',
      user_id: 'demo-avi',
      user_name: 'Avi',
      status: 'JOINED',
      created_date: new Date(now - 25 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'local-mitzvah-signup-2',
      request_id: 'local-mitzvah-3',
      user_id: 'local-shul-volunteer',
      user_name: 'Shul Volunteer',
      status: 'JOINED',
      created_date: new Date(now - 70 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 70 * 60 * 1000).toISOString(),
    },
  ],
  HelpOffer: [
    {
      id: 'local-help-offer-1',
      request_id: 'local-mitzvah-1',
      volunteer_id: 'demo-avi',
      volunteer_name: 'Avi',
      status: 'offered',
      note: 'I can take the Woodmere drop-off before candle lighting.',
      created_date: new Date(now - 25 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'local-help-offer-2',
      request_id: 'local-mitzvah-3',
      volunteer_id: 'local-shul-volunteer',
      volunteer_name: 'Shul Volunteer',
      status: 'offered',
      note: 'I can come early and help set up one side of the room.',
      created_date: new Date(now - 70 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 70 * 60 * 1000).toISOString(),
    },
  ],
  MitzvahRequestComment: [
    {
      id: 'local-mitzvah-comment-1',
      request_id: 'local-mitzvah-1',
      author_id: 'local-chesed-desk',
      author_name: 'Five Towns Chesed Desk',
      body: 'Pickup is ready after 3:30. One bag is marked dairy.',
      created_date: new Date(now - 18 * 60 * 1000).toISOString(),
    },
    {
      id: 'local-mitzvah-comment-2',
      request_id: 'local-mitzvah-1',
      author_id: 'demo-avi',
      author_name: 'Avi',
      body: 'I can do the Woodmere side if someone else can handle Cedarhurst.',
      created_date: new Date(now - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'local-mitzvah-comment-3',
      request_id: 'local-mitzvah-3',
      author_id: 'local-shul-coordinator',
      author_name: 'Shul Coordinator',
      body: 'Two people should be enough. Chairs are stacked near the back door.',
      created_date: new Date(now - 55 * 60 * 1000).toISOString(),
    },
  ],
  MitzvahLog: [
    {
      id: 'local-mitzvah-log-1',
      user_id: 'local-demo',
      user_name: 'Demo',
      description: 'Delivered a meal to a neighbor.',
      category: 'Chesed',
      reflection: 'Small help can make a big day easier.',
      date: new Date(now - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      hours_completed: 1,
      created_date: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  UserStreak: [
    {
      id: 'local-streak-1',
      user_id: 'local-demo',
      current_streak: 3,
      best_streak: 5,
      last_activity_date: new Date(now).toISOString().slice(0, 10),
      badge_level: 'starter',
      created_date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_date: new Date(now).toISOString(),
    },
  ],
};

const SARAH_DEMO_USER_ID = 'demo-sarah';
const SARAH_DEMO_CONVERSATION_ID = 'local-conv-sarah';
const SARAH_DEMO_REPLACEMENT_ID = 'local-community-member';
const SARAH_DEMO_REPLACEMENT_NAME = 'Community Member';
const SARAH_NAME_FIELDS = [
  'created_by_name',
  'user_name',
  'volunteer_name',
  'author_name',
  'sender_name',
  'recipient_name',
  'display_name',
  'full_name',
];
const SARAH_ID_FIELDS = [
  'created_by_user_id',
  'user_id',
  'volunteer_id',
  'author_id',
  'sender_id',
  'recipient_id',
  'requester_id',
  'friend_id',
];

const stripSarahDemoSeed = (name, items = []) => {
  const filtered = items.filter((item) => {
    if (!item) return false;
    if (name === 'User' && item.id === SARAH_DEMO_USER_ID) return false;
    if (name === 'Conversation') {
      return item.id !== SARAH_DEMO_CONVERSATION_ID && !item.participant_ids?.includes(SARAH_DEMO_USER_ID);
    }
    if (name === 'Message') {
      return item.conversation_id !== SARAH_DEMO_CONVERSATION_ID &&
        item.sender_id !== SARAH_DEMO_USER_ID &&
        item.recipient_id !== SARAH_DEMO_USER_ID;
    }
    if (name === 'FriendRequest') {
      return item.requester_id !== SARAH_DEMO_USER_ID && item.recipient_id !== SARAH_DEMO_USER_ID;
    }
    if (name === 'Friendship') {
      return item.user_id !== SARAH_DEMO_USER_ID && item.friend_id !== SARAH_DEMO_USER_ID;
    }
    return true;
  });

  return filtered.map((item) => {
    let changed = false;
    const next = { ...item };

    SARAH_ID_FIELDS.forEach((field) => {
      if (next[field] === SARAH_DEMO_USER_ID) {
        next[field] = SARAH_DEMO_REPLACEMENT_ID;
        changed = true;
      }
    });

    SARAH_NAME_FIELDS.forEach((field) => {
      if (typeof next[field] === 'string' && next[field].toLowerCase().startsWith('sarah')) {
        next[field] = SARAH_DEMO_REPLACEMENT_NAME;
        changed = true;
      }
    });

    return changed ? next : item;
  });
};

const ensureSeeded = (name) => {
  if (typeof localStorage === 'undefined') return;
  const key = `${STORAGE_PREFIX}${name}`;
  if (!localStorage.getItem(key) && seedData[name]) {
    localStorage.setItem(key, JSON.stringify(seedData[name]));
  }
  const stored = localStorage.getItem(key);
  if (!stored) return;
  try {
    const current = JSON.parse(stored);
    const cleaned = stripSarahDemoSeed(name, current);
    if (cleaned.length !== current.length || JSON.stringify(cleaned) !== stored) {
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
  } catch {
    // Keep local demo storage resilient even if a user manually edits it.
  }
};

const readCollection = (name) => {
  ensureSeeded(name);
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${name}`) || '[]');
  } catch {
    return [];
  }
};

const writeCollection = (name, items) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(items));
};

const matchesFilter = (item, filter = {}) => (
  Object.entries(filter || {}).every(([key, value]) => {
    const itemValue = item[key];
    if (Array.isArray(value) && Array.isArray(itemValue)) {
      return value.every(entry => itemValue.includes(entry));
    }
    if (Array.isArray(value)) return value.includes(itemValue);
    if (Array.isArray(itemValue)) return itemValue.includes(value);
    return item[key] === value;
  })
);

const sortItems = (items, sort) => {
  if (!sort) return items;
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');
  return [...items].sort((a, b) => {
    const aValue = a[field] ?? '';
    const bValue = b[field] ?? '';
    return String(aValue).localeCompare(String(bValue)) * direction;
  });
};

const createEntityApi = (name) => ({
  async list(sort, limit = 100, offset = 0) {
    return sortItems(readCollection(name), sort).slice(offset, offset + limit);
  },

  async filter(filter = {}, sort, limit = 100) {
    return sortItems(readCollection(name).filter(item => matchesFilter(item, filter)), sort).slice(0, limit);
  },

  async get(id) {
    const item = readCollection(name).find(entry => entry.id === id);
    if (!item) throw new Error(`${name} not found`);
    return item;
  },

  async create(data) {
    const now = new Date().toISOString();
    const item = {
      id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_date: now,
      updated_date: now,
      ...data,
    };
    writeCollection(name, [item, ...readCollection(name)]);
    return item;
  },

  async bulkCreate(items = []) {
    const created = await Promise.all(items.map(item => this.create(item)));
    return created;
  },

  async update(id, patch) {
    let updatedItem = null;
    const items = readCollection(name).map(item => {
      if (item.id !== id) return item;
      updatedItem = { ...item, ...patch, updated_date: new Date().toISOString() };
      return updatedItem;
    });
    writeCollection(name, items);
    return updatedItem;
  },

  async delete(idOrIds) {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    writeCollection(name, readCollection(name).filter(item => !ids.includes(item.id)));
    return true;
  },

  subscribe() {
    return () => {};
  },
});

const entities = new Proxy({}, {
  get(target, entityName) {
    if (!target[entityName]) target[entityName] = createEntityApi(entityName);
    return target[entityName];
  },
});

const firstPresent = (...values) => values.find(value => value !== undefined && value !== null);

const toAppRow = (row = {}) => ({
  ...row,
  created_date: row.created_date || row.created_at,
  updated_date: row.updated_date || row.updated_at,
  full_name: row.full_name || row.display_name || 'User',
  user_name: row.user_name || row.author_name,
  // Prefer fresh JOIN data from posts_feed_view when available
  author_name: row.profile_display_name || row.author_name,
  author_avatar_url: row.profile_avatar_url || row.author_avatar_url,
  community_name: row.community_name_fresh || row.community_name,
  cityPreset: row.cityPreset || row.city,
  locationLabel: row.locationLabel || row.location_label || row.location_label_legacy,
  approxLat: firstPresent(row.approxLat, row.approx_lat),
  approxLng: firstPresent(row.approxLng, row.approx_lng),
  best_streak: row.best_streak,
  link_url: row.link_url || row.url,
  url: row.url || row.link_url,
  uploaded_by_id: row.uploaded_by_id || row.created_by,
  created_by: row.created_by || row.uploaded_by_id,
  message: row.message || row.body,
  body: row.body || row.message || row.content,
  content: row.content || row.body || row.message,
  post_type: row.post_type || row.type || row.post_kind,
  post_kind: row.post_kind || row.post_type || row.type,
});

const toDbPatch = (data = {}, entityName) => {
  const patch = { ...data };
  if (patch.created_date && !patch.created_at) patch.created_at = patch.created_date;
  if (patch.updated_date && !patch.updated_at) patch.updated_at = patch.updated_date;
  if (patch.cityPreset && !patch.city) patch.city = patch.cityPreset;
  if (patch.community_settings?.primaryNeighborhood && !patch.public_community) {
    patch.public_community = patch.community_settings.primaryNeighborhood;
  }

  if (entityName === 'MitzvahRequest') {
    if (patch.created_by_user_id && !patch.requester_id) patch.requester_id = patch.created_by_user_id;
    if (patch.created_by_name && !patch.requester_name) patch.requester_name = patch.created_by_name;
    if (patch.locationLabel && !patch.location_label) patch.location_label = patch.locationLabel;
    if (patch.locationLabel && !patch.location_label_legacy) patch.location_label_legacy = patch.locationLabel;
    if (patch.approxLat !== undefined && patch.approx_lat === undefined) patch.approx_lat = patch.approxLat;
    if (patch.approxLng !== undefined && patch.approx_lng === undefined) patch.approx_lng = patch.approxLng;
    delete patch.locationLabel;
    delete patch.approxLat;
    delete patch.approxLng;
  }

  if (entityName === 'HelpOffer' || entityName === 'MitzvahSignup') {
    if ((patch.user_id || patch.helper_user_id) && !patch.volunteer_id) {
      patch.volunteer_id = patch.user_id || patch.helper_user_id;
    }
    if ((patch.user_name || patch.helper_name) && !patch.volunteer_name) {
      patch.volunteer_name = patch.user_name || patch.helper_name;
    }
  }

  if (entityName === 'ChesedLog') {
    if (patch.user_id && !patch.volunteer_id) patch.volunteer_id = patch.user_id;
    if (patch.user_name && !patch.volunteer_name) patch.volunteer_name = patch.user_name;
    if (patch.title && !patch.task_title) patch.task_title = patch.title;
    if (patch.date && !patch.date_completed) patch.date_completed = patch.date;
    if (patch.hours !== undefined && patch.hours_completed === undefined) patch.hours_completed = patch.hours;
    if (patch.notes && !patch.description) patch.description = patch.notes;
  }

  if (entityName === 'Comment') {
    if (patch.reply_to_comment_id && !patch.parent_comment_id) {
      patch.parent_comment_id = patch.reply_to_comment_id;
    }
    if (patch.parent_comment_id && !patch.reply_to_comment_id) {
      patch.reply_to_comment_id = patch.parent_comment_id;
    }
    if (!patch.thread_type) patch.thread_type = 'feed_reply';
  }

  if (entityName === 'UnifiedPost' || entityName === 'Post' || entityName === 'CommunityPost') {
    if (patch.content && !patch.body) patch.body = patch.content;
    if (patch.body && !patch.content) patch.content = patch.body;
    if (patch.type && !patch.post_type) patch.post_type = patch.type;
    if (patch.post_type && !patch.type) patch.type = patch.post_type;
    if ((patch.post_kind || patch.post_type || patch.type) && !patch.post_kind) {
      patch.post_kind = patch.post_type || patch.type;
    }
    if (patch.author_user_id && !patch.user_id) patch.user_id = patch.author_user_id;
    if (patch.user_id && !patch.author_user_id) patch.author_user_id = patch.user_id;
    // posts counts likes via likes_count; normalizeUnifiedActivity's
    // reactions_count has no posts column and costs a failed-insert retry
    delete patch.reactions_count;
  }

  if (entityName === 'CommunityEvent') {
    if (patch.location && !patch.location_text) patch.location_text = patch.location;
    if (patch.location_text && !patch.location) patch.location = patch.location_text;
    if (patch.start_date && !patch.event_date) patch.event_date = patch.start_date;
    if (patch.start_time && !patch.event_time) patch.event_time = patch.start_time;
    if (patch.created_by_user_id && !patch.created_by) patch.created_by = patch.created_by_user_id;
  }

  if (entityName === 'CommunityEventRSVP') {
    if (patch.status === 'not_going') patch.status = 'not_attending';
  }

  if (entityName === 'CommunityResource') {
    if (patch.link_url && !patch.url) patch.url = patch.link_url;
    if (patch.url && !patch.link_url) patch.link_url = patch.url;
    if (patch.uploaded_by_id && !patch.created_by) patch.created_by = patch.uploaded_by_id;
    if (patch.created_by && !patch.uploaded_by_id) patch.uploaded_by_id = patch.created_by;
    if (patch.resource_type === 'document') patch.resource_type = 'file';
  }

  if (entityName === 'CommunityGroupChat') {
    if (patch.body && !patch.message) patch.message = patch.body;
    if (patch.message && !patch.body) patch.body = patch.message;
  }

  if (entityName === 'UserCommunity') {
    if (patch.role) patch.role = String(patch.role).toLowerCase();
    if (!patch.status) patch.status = 'active';
  }

  delete patch.created_date;
  delete patch.updated_date;
  delete patch.full_name;
  delete patch.email;
  if (entityName === 'User' || entityName === 'Profile') delete patch.role;
  delete patch.cityPreset;
  return patch;
};

const toDbField = (field) => {
  if (field === 'created_date') return 'created_at';
  if (field === 'updated_date') return 'updated_at';
  return field;
};

const shouldFallbackToLocal = (error) => {
  const text = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return (
    text.includes('not signed in') ||
    text.includes('permission denied') ||
    text.includes('row-level security') ||
    text.includes('relation') ||
    text.includes('does not exist')
  );
};

const getMissingSchemaColumn = (error) => {
  const text = `${error?.message || ''} ${error?.details || ''}`;
  const match = text.match(/Could not find the '([^']+)' column/i)
    || text.match(/column "([^"]+)" of relation/i)
    || text.match(/column ([a-zA-Z0-9_]+) does not exist/i);
  return match?.[1] || null;
};

const updateProfileWithSchemaRetry = async (userId, patch) => {
  const dbPatch = { ...toDbPatch(patch, 'User'), updated_at: new Date().toISOString() };
  const removedColumns = new Set();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabase
      .from('profiles')
      .update(dbPatch)
      .eq('id', userId)
      .select()
      .single();

    if (!error) return data;

    const missingColumn = getMissingSchemaColumn(error);
    if (!missingColumn || removedColumns.has(missingColumn) || !(missingColumn in dbPatch)) {
      throw error;
    }

    removedColumns.add(missingColumn);
    delete dbPatch[missingColumn];
    console.warn(`Skipping profile column "${missingColumn}" because it is not in the current Supabase schema cache yet.`);
  }

  throw new Error('Could not update profile because Supabase schema cache is missing required columns.');
};

const createWithSchemaRetry = async (table, entityName, data) => {
  const dbPatch = toDbPatch(data, entityName);
  const removedColumns = new Set();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data: created, error } = await supabase
      .from(table)
      .insert(dbPatch)
      .select()
      .single();

    if (!error) return created;

    const missingColumn = getMissingSchemaColumn(error);
    if (!missingColumn || removedColumns.has(missingColumn) || !(missingColumn in dbPatch)) {
      throw error;
    }

    removedColumns.add(missingColumn);
    delete dbPatch[missingColumn];
    console.warn(`Skipping ${entityName} column "${missingColumn}" because it is not in the current Supabase schema cache yet.`);
  }

  throw new Error(`Could not create ${entityName} because Supabase schema cache is missing required columns.`);
};

const updateWithSchemaRetry = async (table, entityName, id, patch) => {
  const dbPatch = { ...toDbPatch(patch, entityName), updated_at: new Date().toISOString() };
  const removedColumns = new Set();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();

    if (!error) return data;

    const missingColumn = getMissingSchemaColumn(error);
    if (!missingColumn || removedColumns.has(missingColumn) || !(missingColumn in dbPatch)) {
      throw error;
    }

    removedColumns.add(missingColumn);
    delete dbPatch[missingColumn];
    console.warn(`Skipping ${entityName} column "${missingColumn}" because it is not in the current Supabase schema cache yet.`);
  }

  throw new Error(`Could not update ${entityName} because Supabase schema cache is missing required columns.`);
};

const runWithLocalFallback = async (action, fallback, label, isWrite = false) => {
  try {
    return await action();
  } catch (error) {
    if (!shouldFallbackToLocal(error)) throw error;

    // Writes never fall back in any environment. A write that silently succeeds
    // against localStorage while Supabase is configured means the user believes
    // their data was saved when it was not. Always surface the real error.
    if (isWrite) {
      console.error(`[${label}] Supabase write failed — not falling back to local:`, error?.message || error);
      const err = new Error(`Failed to save ${label}: ${error?.message || 'unknown Supabase error'}`);
      err.cause = error;
      throw err;
    }

    // Reads: in development fall back so local work isn't blocked by an
    // unfinished Supabase setup. In production surface the real error.
    if (import.meta.env.DEV) {
      console.warn(`[dev] Using local ${label} data — Supabase not ready:`, error?.message || error);
      return fallback();
    }

    console.error(`[${label}] Supabase read failed:`, error?.message || error);
    const err = new Error(`Failed to load ${label}: ${error?.message || 'unknown Supabase error'}`);
    err.cause = error;
    throw err;
  }
};

const normalizeRealtimeEvent = (event = {}) => {
  const eventType = String(event.eventType || '').toLowerCase();
  const typeMap = {
    insert: 'create',
    update: 'update',
    delete: 'delete',
  };

  return {
    type: typeMap[eventType] || eventType || event.type,
    data: event.new || event.old || event.data,
    raw: event,
  };
};

// ─── Unmapped entity guard ────────────────────────────────────────────────────
//
// In Supabase mode, any entity not listed in SUPABASE_ENTITY_TABLES has no
// backing table.  Silently falling back to localStorage in production means
// users believe their data was saved when it was not.
//
// Instead:
//   • DEV  — warn once per entity name and return the localStorage API so local
//             development isn't blocked by missing migrations.
//   • PROD — every CRUD method throws a clear error.  subscribe() is a no-op
//             because subscription failures are harder to surface in the UI.
//
// Required DB tables and the entities that need them:
//
//   GroupMember       → group_members     (community groups)
//   Shul              → shuls             (shul directory)
//   ShulMember        → shul_members
//   ShulPost          → shul_posts
//   ShulSchedule      → shul_schedules
//   UserConnection    → user_connections
//   NotificationPreference → notification_preferences
//   CommunityFollow   → community_follows
//   CommunityGroup    → community_groups
//   GroupDiscussion   → group_discussions
//   GroupJoinRequest  → group_join_requests
//   GroupPost         → group_posts
//   GroupResource     → group_resources
//   Bookmark          → bookmarks
//   SavedSearch       → saved_searches
//   Organization      → organizations
//   RideRequest       → ride_requests
//   MinyanAttendance  → minyan_attendances
//   RefuahDavening    → refuah_davenings
//   RefuahRequest     → refuah_requests
//   Yahrzeit          → yahrzeits
//   YahrzeitCandle    → yahrzeit_candles
//   NewsItem          → news_items
//   NewsSource        → news_sources
//   NewsletterLog     → newsletter_logs
//   NewsletterSubscriber → newsletter_subscribers
//   VolunteerOpportunity → volunteer_opportunities
//   VolunteerSignup   → volunteer_signups
//   MitzvahOpportunity → mitzvah_opportunities
//   EventAttendee     → event_attendees
//   RSVP              → rsvps
//   InviteLink        → invite_links
//   Like              → (use togglePostLike RPC — not a generic entity)
//   UserConnection    → user_connections
//   WeeklyStats       → weekly_stats
//   Transaction       → transactions  (mapped — see SUPABASE_ENTITY_TABLES)
//   ChalkboardPost    → chalkboard_posts
//   CommunityAlert    → community_alerts
//   DailyPrompt       → daily_prompts
//   DiscussionComment → discussion_comments
//   DiscussionLike    → discussion_likes
//   SubGroup          → sub_groups
//   SubGroupMember    → sub_group_members

const _warnedUnmapped = new Set();

const createUnmappedEntityApi = (entityName) => {
  if (!_warnedUnmapped.has(entityName)) {
    _warnedUnmapped.add(entityName);
    const msg =
      `[JUnited] Entity "${entityName}" has no SUPABASE_ENTITY_TABLES mapping. ` +
      (import.meta.env.DEV
        ? 'Using localStorage in dev — add a migration + mapping before shipping this feature.'
        : 'All reads/writes will throw in production. See supabaseRepository.js for required migrations.');
    import.meta.env.DEV ? console.warn(msg) : console.error(msg);
  }

  if (import.meta.env.DEV) {
    return createEntityApi(entityName);
  }

  const throwUnmapped = () => {
    throw new Error(
      `Entity "${entityName}" is not mapped to a Supabase table. ` +
      `A migration and a SUPABASE_ENTITY_TABLES entry are required before this feature can persist data in production.`
    );
  };

  return {
    list: throwUnmapped,
    filter: throwUnmapped,
    get: throwUnmapped,
    create: throwUnmapped,
    bulkCreate: throwUnmapped,
    update: throwUnmapped,
    delete: throwUnmapped,
    subscribe: () => () => {},
  };
};

const createSupabaseEntityApi = (entityName) => {
  const table = SUPABASE_ENTITY_TABLES[entityName];

  if (!supabase) return createEntityApi(entityName);
  if (!table) return createUnmappedEntityApi(entityName);

  const readTable = PUBLIC_PROFILE_ENTITIES.has(entityName) ? 'public_profiles' : table;
  const readSelect = PUBLIC_PROFILE_ENTITIES.has(entityName) ? PUBLIC_PROFILE_SELECT : '*';
  const localApi = createEntityApi(entityName);

  return {
    async list(sort, limit = 100, offset = 0) {
      return runWithLocalFallback(async () => {
        let query = supabase.from(readTable).select(readSelect).range(offset, offset + limit - 1);
        if (sort) {
          const ascending = !sort.startsWith('-');
          query = query.order(toDbField(sort.replace(/^-/, '')), { ascending });
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(toAppRow);
      }, () => localApi.list(sort, limit, offset), entityName);
    },

    async filter(filter = {}, sort, limit = 100) {
      return runWithLocalFallback(async () => {
        let query = supabase.from(readTable).select(readSelect).limit(limit);
        Object.entries(filter || {}).forEach(([key, value]) => {
          const dbKey = toDbField(key);
          if (Array.isArray(value)) query = query.contains(dbKey, value);
          else query = query.eq(dbKey, value);
        });
        if (sort) {
          const ascending = !sort.startsWith('-');
          query = query.order(toDbField(sort.replace(/^-/, '')), { ascending });
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(toAppRow);
      }, () => localApi.filter(filter, sort, limit), entityName);
    },

    async get(id) {
      return runWithLocalFallback(async () => {
        const { data, error } = await supabase.from(readTable).select(readSelect).eq('id', id).single();
        if (error) throw error;
        return toAppRow(data);
      }, () => localApi.get(id), entityName);
    },

    async create(data) {
      return runWithLocalFallback(async () => {
        const created = await createWithSchemaRetry(table, entityName, data);
        return toAppRow(created);
      }, () => localApi.create(data), entityName, true);
    },

    async bulkCreate(items = []) {
      return runWithLocalFallback(async () => {
        const { data, error } = await supabase
          .from(table)
          .insert(items.map(item => toDbPatch(item, entityName)))
          .select();
        if (error) throw error;
        return (data || []).map(toAppRow);
      }, () => localApi.bulkCreate(items), entityName, true);
    },

    async update(id, patch) {
      return runWithLocalFallback(async () => {
        const data = await updateWithSchemaRetry(table, entityName, id, patch);
        return toAppRow(data);
      }, () => localApi.update(id, patch), entityName, true);
    },

    async delete(idOrIds) {
      return runWithLocalFallback(async () => {
        const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
        const { error } = await supabase.from(table).delete().in('id', ids);
        if (error) throw error;
        return true;
      }, () => localApi.delete(idOrIds), entityName, true);
    },

    subscribe(callback) {
      const channelName = `${table}-changes-${Math.random().toString(36).slice(2, 8)}`;
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (event) => {
          callback(normalizeRealtimeEvent(event));
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
};

const supabaseEntities = new Proxy({}, {
  get(target, entityName) {
    if (!target[entityName]) target[entityName] = createSupabaseEntityApi(entityName);
    return target[entityName];
  },
});

const activeEntities = shouldUseSupabase ? supabaseEntities : entities;

const includesSearchText = (row = {}, fields = [], query = '') => {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return false;
  return fields.some((field) => String(row[field] || '').toLowerCase().includes(needle));
};

// Escape characters that have special meaning in a LIKE/ILIKE pattern.
// Commas are replaced with spaces because PostgREST parses the .or() filter
// string on commas — a literal comma in the query would break the filter.
const escapeIlikePattern = (str) =>
  str.replace(/[\\%_]/g, '\\$&').replace(/,/g, ' ');

const runUniversalSearch = async ({ query = '', filters = {} } = {}) => {
  const needle = query.trim();
  if (!needle) return { posts: [], communities: [], events: [], people: [], mitzvahRequests: [], businesses: [], marketplace: [] };

  // Local / demo mode: filter tiny in-memory datasets on the client.
  if (!shouldUseSupabase) {
    const [postsResult, communitiesResult, peopleResult, mitzvahResult, businessResult] = await Promise.allSettled([
      activeEntities.UnifiedPost.list('-created_date', 120),
      activeEntities.Community.list('-follower_count', 80),
      activeEntities.User.list('-created_date', 80),
      activeEntities.MitzvahRequest.list('-created_date', 120),
      activeEntities.BusinessListing.list('-created_date', 120),
    ]);

    const allPosts = postsResult.status === 'fulfilled' ? postsResult.value : [];
    const allCommunities = communitiesResult.status === 'fulfilled' ? communitiesResult.value : [];
    const allPeople = peopleResult.status === 'fulfilled' ? peopleResult.value : [];
    const allMitzvahRequests = mitzvahResult.status === 'fulfilled' ? mitzvahResult.value : [];
    const allBusinesses = businessResult.status === 'fulfilled' ? businessResult.value : [];

    const postMatches = allPosts
      .filter((post) => {
        if (filters.post_type === 'marketplace_listing') {
          if (post.activity_kind !== 'marketplace_listing' && post.type !== 'marketplace') return false;
        } else if (filters.post_type && post.type !== filters.post_type) return false;
        if (filters.community_id && post.community_id !== filters.community_id) return false;
        if (filters.date_from && post.created_date < filters.date_from) return false;
        if (filters.date_to && post.created_date > filters.date_to) return false;
        return includesSearchText(post, ['title', 'body', 'community_name', 'author_name', 'location_text'], needle);
      })
      .slice(0, 20);

    const events = postMatches
      .filter((post) => post.type === 'event')
      .map((post) => ({
        ...post,
        start_date: post.start_date || post.event_date || post.created_date,
        location: post.location || post.location_text || post.city,
      }))
      .slice(0, 10);

    return {
      posts: postMatches.filter((post) => post.type !== 'event').slice(0, 20),
      communities: allCommunities
        .filter((community) => includesSearchText(community, ['name', 'description', 'type', 'city', 'neighborhood'], needle))
        .slice(0, 12),
      events,
      people: allPeople
        .filter((person) => includesSearchText(person, ['full_name', 'display_name', 'username', 'bio', 'public_community', 'city'], needle))
        .slice(0, 12),
      mitzvahRequests: allMitzvahRequests
        .filter((request) => includesSearchText(request, ['title', 'description', 'category', 'location_label', 'location_text', 'neighborhood', 'urgency'], needle))
        .slice(0, 12),
      businesses: allBusinesses
        .filter((business) => includesSearchText(business, ['name', 'description', 'category', 'address', 'neighborhood', 'city', 'source_label'], needle))
        .slice(0, 12),
      marketplace: postMatches
        .filter((post) => post.activity_kind === 'marketplace_listing' || post.type === 'marketplace')
        .slice(0, 12),
    };
  }

  // Supabase mode: push all filtering to the database.
  // Each query matches only relevant rows server-side; no full-table scans in JS.
  const esc = escapeIlikePattern(needle);

  let postsQuery = supabase
    .from('posts')
    .select('*')
    .or(`title.ilike.%${esc}%,content.ilike.%${esc}%`)
    .order('created_at', { ascending: false })
    .limit(30);

  if (filters.post_type === 'marketplace_listing') {
    // Marketplace rows carry type 'marketplace' with activity_kind 'marketplace_listing'
    postsQuery = postsQuery.or('activity_kind.eq.marketplace_listing,type.eq.marketplace');
  } else if (filters.post_type) {
    postsQuery = postsQuery.eq('type', filters.post_type);
  }
  if (filters.community_id) postsQuery = postsQuery.eq('community_id', filters.community_id);
  if (filters.date_from) postsQuery = postsQuery.gte('created_at', filters.date_from);
  if (filters.date_to) postsQuery = postsQuery.lte('created_at', `${filters.date_to}T23:59:59.999Z`);

  const communitiesQuery = supabase
    .from('communities')
    .select('*')
    .or(`name.ilike.%${esc}%,description.ilike.%${esc}%`)
    .order('follower_count', { ascending: false })
    .limit(12);

  const peopleQuery = supabase
    .from('public_profiles')
    .select(PUBLIC_PROFILE_SELECT)
    .or(`display_name.ilike.%${esc}%,username.ilike.%${esc}%,bio.ilike.%${esc}%,city.ilike.%${esc}%,public_community.ilike.%${esc}%`)
    .is('deleted_at', null)
    .limit(12);
  const businessesQuery = supabase
    .from('business_listings')
    .select('*')
    .eq('status', 'published')
    .or(`name.ilike.%${esc}%,description.ilike.%${esc}%,category.ilike.%${esc}%,address.ilike.%${esc}%,neighborhood.ilike.%${esc}%,city.ilike.%${esc}%`)
    .order('updated_at', { ascending: false })
    .limit(12);
  const mitzvahQuery = supabase
    .from('mitzvah_requests')
    .select('*')
    .or(`title.ilike.%${esc}%,description.ilike.%${esc}%,category.ilike.%${esc}%,location_label.ilike.%${esc}%,neighborhood.ilike.%${esc}%`)
    .order('created_at', { ascending: false })
    .limit(12);

  const [postsResult, communitiesResult, peopleResult, businessesResult, mitzvahResult] = await Promise.allSettled([
    postsQuery,
    communitiesQuery,
    peopleQuery,
    businessesQuery,
    mitzvahQuery,
  ]);

  const allPosts = (postsResult.status === 'fulfilled' && !postsResult.value.error)
    ? (postsResult.value.data || []).map(toAppRow)
    : [];
  const allCommunities = (communitiesResult.status === 'fulfilled' && !communitiesResult.value.error)
    ? (communitiesResult.value.data || []).map(toAppRow)
    : [];
  const allPeople = (peopleResult.status === 'fulfilled' && !peopleResult.value.error)
    ? (peopleResult.value.data || []).map(toAppRow)
    : [];
  const allBusinesses = (businessesResult.status === 'fulfilled' && !businessesResult.value.error)
    ? (businessesResult.value.data || []).map(toAppRow)
    : [];
  const allMitzvahRequests = (mitzvahResult.status === 'fulfilled' && !mitzvahResult.value.error)
    ? (mitzvahResult.value.data || []).map(toAppRow)
    : [];

  const events = allPosts
    .filter((post) => post.type === 'event')
    .map((post) => ({
      ...post,
      start_date: post.start_date || post.event_date || post.created_date,
      location: post.location || post.location_text || post.city,
    }))
    .slice(0, 10);

  return {
    posts: allPosts.filter((post) => post.type !== 'event').slice(0, 20),
    communities: allCommunities,
    events,
    people: allPeople,
    mitzvahRequests: allMitzvahRequests,
    businesses: allBusinesses,
    marketplace: allPosts.filter((post) => post.activity_kind === 'marketplace_listing' || post.type === 'marketplace').slice(0, 12),
  };
};

const getSupabaseUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (profile) {
    return toAppRow({
      ...profile,
      email: data.user.email,
    });
  }

  // Prefer the real name, email, and avatar from OAuth providers (Google, Apple, etc.).
  const userMetadata = data.user.user_metadata || {};
  const metaEmail = userMetadata.email || data.user.email;
  const metaDisplayName =
    userMetadata.full_name ||
    userMetadata.name ||
    userMetadata.display_name ||
    metaEmail?.split('@')[0] ||
    'User';
  const metaAvatarUrl = userMetadata.avatar_url || userMetadata.picture;
  const createdProfile = {
    id: data.user.id,
    email: metaEmail,
    display_name: metaDisplayName,
    onboarding_complete: false,
    is_profile_complete: false,
    ...(metaAvatarUrl ? { avatar_url: metaAvatarUrl } : {}),
  };

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert(createdProfile)
    .select()
    .single();

  if (createError) throw createError;

  await supabase.from('account_private').upsert({
    id: data.user.id,
    email: metaEmail,
    updated_at: new Date().toISOString(),
  });

  return toAppRow({
    ...created,
    email: metaEmail,
  });
};

// Map from SQL table name → localStorage entity name (for local/demo mode fallback).
const COUNTER_TABLE_TO_ENTITY = {
  posts: 'UnifiedPost',
  communities: 'Community',
  community_posts: 'CommunityPost',
  group_discussions: 'GroupDiscussion',
  community_groups: 'CommunityGroup',
  shuls: 'Shul',
};

// Tables that have a server-side increment_counter RPC in Supabase.
const SUPABASE_COUNTER_TABLES = new Set(['posts', 'communities', 'community_groups']);

/**
 * Atomically increment (positive delta) or decrement (negative delta) a counter
 * column.  In Supabase mode the update runs entirely in Postgres, so concurrent
 * actions on the same row cannot race.  In local/demo mode the update is applied
 * to localStorage (single-threaded JS, so no drift is possible there either).
 */
export const incrementCounter = async (table, column, id, delta = 1) => {
  if (shouldUseSupabase && supabase && SUPABASE_COUNTER_TABLES.has(table)) {
    const { error } = await supabase.rpc('increment_counter', {
      p_table: table, p_column: column, p_id: id, p_delta: delta,
    });
    if (error) throw error;
    return;
  }
  const entityName = COUNTER_TABLE_TO_ENTITY[table];
  if (!entityName) return;
  writeCollection(entityName, readCollection(entityName).map(item =>
    item.id === id
      ? { ...item, [column]: Math.max(0, (item[column] || 0) + delta) }
      : item
  ));
};

/**
 * Fetch multiple records by their primary-key IDs in a single round-trip.
 * In Supabase mode uses .in('id', ids) so only one query fires regardless of
 * how many IDs are requested.  In local/demo mode filters the in-memory
 * collection with a Set lookup.
 */
export const batchFetchByIds = async (entityName, ids) => {
  if (!ids || ids.length === 0) return [];
  if (shouldUseSupabase && supabase) {
    const table = SUPABASE_ENTITY_TABLES[entityName];
    if (table) {
      const readTable = PUBLIC_PROFILE_ENTITIES.has(entityName) ? 'public_profiles' : table;
      const readSelect = PUBLIC_PROFILE_ENTITIES.has(entityName) ? PUBLIC_PROFILE_SELECT : '*';
      const { data, error } = await supabase.from(readTable).select(readSelect).in('id', ids);
      if (error) throw error;
      return (data || []).map(toAppRow);
    }
  }
  const idSet = new Set(ids);
  return readCollection(entityName).filter(item => idSet.has(item.id));
};

/**
 * Atomically toggle a like on a post.
 * In Supabase mode the Like row and likes_count are written in one PL/pgSQL
 * transaction via the toggle_post_like() RPC — no partial failure possible.
 * In local mode both the Like localStorage entry and the post's likes_count
 * are updated together (single-threaded JS, so no partial state).
 *
 * Returns { liked: boolean } — the new like state after the toggle.
 * localUserId is only used in local/demo mode; Supabase uses auth.uid().
 */
export const togglePostLike = async (postId, localUserId = 'local-demo') => {
  if (shouldUseSupabase && supabase) {
    const { data, error } = await supabase.rpc('toggle_post_like', { p_post_id: postId });
    if (error) throw error;
    return data; // { liked: boolean }
  }
  // Local mode: simulate atomically in a single synchronous block.
  const likes = readCollection('Like');
  const idx = likes.findIndex(l => l.post_id === postId && l.user_id === localUserId);
  const liked = idx === -1;
  const next = liked
    ? [...likes, { id: `like-${Date.now()}`, post_id: postId, user_id: localUserId }]
    : likes.filter((_, i) => i !== idx);
  writeCollection('Like', next);
  writeCollection('UnifiedPost', readCollection('UnifiedPost').map(p =>
    p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + (liked ? 1 : -1)) } : p
  ));
  return { liked };
};

/**
 * Load the set of post IDs that a user has liked.
 * In Supabase mode reads from the post_likes table; in local mode reads the
 * Like localStorage entries.  Used on page mount to restore liked-indicator state.
 */
export const loadUserPostLikes = async (userId) => {
  if (shouldUseSupabase && supabase) {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(row => row.post_id);
  }
  return readCollection('Like')
    .filter(l => l.user_id === userId)
    .map(l => l.post_id);
};

// Rate-limit actions and their server-side windows/limits.
const RATE_LIMITS = {
  new_conversation: { limit: 10, windowSeconds: 86400 },  // 10/day
  send_message:     { limit: 60, windowSeconds: 60 },      // 60/minute
  react:            { limit: 30, windowSeconds: 60 },      // 30/minute
  create_post:      { limit: 20, windowSeconds: 3600 },    // 20/hour
};

export class RateLimitError extends Error {
  constructor(action) {
    const cfg = RATE_LIMITS[action];
    const window = cfg
      ? cfg.windowSeconds >= 86400 ? 'day'
        : cfg.windowSeconds >= 3600 ? 'hour'
        : 'minute'
      : 'window';
    super(`You're doing that too often. Please wait before trying again (limit: ${cfg?.limit ?? '?'} per ${window}).`);
    this.name = 'RateLimitError';
    this.action = action;
  }
}

/**
 * Checks the server-side rate limit for `action`.
 * Throws RateLimitError if the caller is over the limit.
 * No-ops in local (non-Supabase) mode so dev is unaffected.
 */
export const checkRateLimit = async (action) => {
  if (!shouldUseSupabase || !supabase) return;
  const cfg = RATE_LIMITS[action];
  if (!cfg) throw new Error(`Unknown rate-limit action: ${action}`);
  const { error } = await supabase.rpc('check_rate_limit', {
    p_action: action,
    p_limit: cfg.limit,
    p_window_seconds: cfg.windowSeconds,
  });
  if (error) {
    if (error.code === '42501' || error.message?.includes('Rate limit exceeded')) {
      throw new RateLimitError(action);
    }
    throw error;
  }
};

export const supabaseBackend = {
  auth: {
    async me() {
      if (shouldUseSupabase) return getSupabaseUser();
      return demoUser;
    },
    async updateMe(patch) {
      if (shouldUseSupabase) {
        const user = await getSupabaseUser();
        const data = await updateProfileWithSchemaRetry(user.id, patch);
        return toAppRow({
          ...data,
          email: user.email,
        });
      }
      Object.assign(demoUser, patch);
      return demoUser;
    },
    async signInWithPassword({ email, password }) {
      if (!shouldUseSupabase) return { user: demoUser };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async signin({ email, password }) {
      return this.signInWithPassword({ email, password });
    },
    async signIn({ email, password }) {
      return this.signInWithPassword({ email, password });
    },
    async login({ email, password }) {
      return this.signInWithPassword({ email, password });
    },
    async signUp({ email, password, displayName }) {
      if (!shouldUseSupabase) {
        Object.assign(demoUser, { email, display_name: displayName || email });
        return { user: demoUser };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email?.split('@')[0],
          },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });
      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName || data.user.email?.split('@')[0] || 'User',
          updated_at: new Date().toISOString(),
        });
        await supabase.from('account_private').upsert({
          id: data.user.id,
          email: data.user.email,
          updated_at: new Date().toISOString(),
        });
      }

      return data;
    },
    async signup({ email, password, displayName, fullName, name }) {
      return this.signUp({
        email,
        password,
        displayName: displayName || fullName || name,
      });
    },
    async logout() {
      if (shouldUseSupabase) {
        await supabase.auth.signOut();
        return true;
      }
      return true;
    },
    redirectToLogin(fromUrl = '/Feed') {
      if (shouldUseSupabase && typeof window !== 'undefined') {
        window.location.href = `/login?from_url=${encodeURIComponent(fromUrl || window.location.href)}`;
        return;
      }
      console.info('Login is not connected yet. Returning to local app mode.');
      if (typeof window !== 'undefined') {
        const target = new URL(fromUrl || '/', window.location.origin);
        window.history.replaceState({}, '', `${target.pathname}${target.search || ''}`);
      }
    },
  },

  entities: activeEntities,

  functions: {
    async invoke(name, payload = {}) {
      if (name === 'universalSearch') {
        return { data: { results: await runUniversalSearch(payload) } };
      }

      if (name === 'createFeedReply') {
        if (shouldUseSupabase && supabase) {
          const { data, error } = await supabase.rpc('create_feed_reply', {
            p_post_id: payload.post_id,
            p_body: payload.body,
            p_parent_comment_id: payload.parent_comment_id || payload.reply_to_comment_id || null,
            p_reply_to_comment_id: payload.reply_to_comment_id || payload.parent_comment_id || null,
            p_author_name: payload.author_name || null,
            p_author_avatar_url: payload.author_avatar_url || null,
            p_client_context: payload.client_context || {},
          });
          if (error) throw error;
          return { data: toAppRow(data) };
        }

        const comment = await activeEntities.Comment.create({
          ...payload,
          parent_comment_id: payload.parent_comment_id || payload.reply_to_comment_id || null,
          reply_to_comment_id: payload.reply_to_comment_id || payload.parent_comment_id || null,
          thread_type: 'feed_reply',
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        });
        await incrementCounter('posts', 'comments_count', payload.post_id, 1);
        return { data: comment };
      }

      if (name === 'publishDailyTorah') {
        return { data: await publishLocalDailyTorah(payload) };
      }

      if (name === 'create-checkout' || name === 'create-checkout-session') {
        // paymentsService.js calls supabase.functions.invoke() directly and bypasses
        // this router. This stub is a safety fallback only.
        if (shouldUseSupabase && supabase) {
          const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { ...payload, origin: typeof window !== 'undefined' ? window.location.origin : '' },
          });
          if (error) throw error;
          return { data };
        }
        return { data: { checkoutUrl: null, error: 'Payments require Supabase to be connected.' } };
      }

      if (name === 'deleteUserAccount') {
        throw new Error('Account deletion is not connected yet.');
      }

      console.info(`Local function stub: ${name}`, payload);
      return {
        data: {
          demoOnly: true,
          message: `${name} is not connected yet.`,
          results: { posts: [], communities: [], events: [], people: [] },
        },
      };
    },
  },

  integrations: {
    Core: {
      async UploadFile({ file, bucket = 'post-images' }) {
        if (shouldUseSupabase && file) {
          const safeName = file.name?.replace(/[^a-z0-9._-]/gi, '-') || 'upload';
          const path = `${Date.now()}-${safeName}`;
          const { error } = await supabase.storage.from(bucket).upload(path, file);
          if (error) throw error;
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          return { file_url: data.publicUrl };
        }
        return { file_url: file ? URL.createObjectURL(file) : '' };
      },
      async InvokeLLM() {
        return 'AI features are not connected yet. We can wire this to OpenAI next.';
      },
      async SendEmail(payload) {
        console.info('Local email stub', payload);
        return { success: true };
      },
    },
  },

  appLogs: {
    async logUserInApp() {
      return true;
    },
  },
};
