import { getAuthRedirectUrl, shouldUseSupabase, supabase } from '@/api/supabaseClient';

const STORAGE_PREFIX = 'junited_local_entity_';
const SUPABASE_ENTITY_TABLES = {
  // Core — migration 001_core.sql
  User: 'profiles',
  Profile: 'profiles',
  Community: 'communities',
  UnifiedPost: 'posts',
  Post: 'posts',
  // Messaging — migration 002_messages.sql
  Conversation: 'conversations',
  Message: 'messages',
  // Feature tables — migration 004_core_feature_tables.sql
  UserCommunity: 'community_memberships',
  Comment: 'comments',
  Reaction: 'reactions',
  Notification: 'notifications',
  MitzvahRequest: 'mitzvah_requests',
  MitzvahCompletion: 'mitzvah_completions',
  VerificationRequest: 'verification_requests',
  ChesedLog: 'chesed_hours_logs',
  // Feed retention — migration 007_feed_retention.sql
  FeedUserPreference: 'feed_user_preferences',
  FeedEngagementEvent: 'feed_engagement_events',
  DailyFeedPrompt: 'daily_feed_prompts',
  FiveTownsBrief: 'five_towns_briefs',
  // HelpOffer / MitzvahSignup intentionally omitted: both map to mitzvah_offers,
  // but the app sends user_id while the DB column is volunteer_id. Adding the
  // mapping without a field translation would cause silent localStorage fallbacks
  // on every write. Fix by adding a user_id compat column to mitzvah_offers first.
};

const PUBLIC_PROFILE_ENTITIES = new Set(['User', 'Profile']);
const PUBLIC_PROFILE_SELECT = 'id,display_name,avatar_url,username,public_community,city,bio,is_profile_complete,created_at,updated_at';

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
    id: 'demo-sarah',
    full_name: 'Sarah Cohen',
    display_name: 'Sarah',
    email: 'sarah@junited.local',
    avatar_url: '',
    age_range: '18+',
    message_settings: { searchable: true, allowMessagesFrom: 'everyone' },
  },
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
    id: 'local-conv-sarah',
    participant_ids: ['local-demo', 'demo-sarah'],
    participant_names: ['Demo', 'Sarah Cohen'],
    participant_ages: ['18+', '18+'],
    participant_avatars: ['', ''],
    last_message: 'Can you send me the event details?',
    last_message_at: new Date(now - 18 * 60 * 1000).toISOString(),
    updated_date: new Date(now - 18 * 60 * 1000).toISOString(),
    unread_count: { 'local-demo': 1 },
    request_type: 'general',
  },
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
    id: 'local-msg-1',
    conversation_id: 'local-conv-sarah',
    sender_id: 'demo-sarah',
    sender_name: 'Sarah',
    recipient_id: 'local-demo',
    content: 'Hi! Are you going to the community dinner tonight?',
    created_date: new Date(now - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'local-msg-2',
    conversation_id: 'local-conv-sarah',
    sender_id: 'local-demo',
    sender_name: 'Demo',
    recipient_id: 'demo-sarah',
    content: 'I think so. What time does it start?',
    created_date: new Date(now - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'local-msg-3',
    conversation_id: 'local-conv-sarah',
    sender_id: 'demo-sarah',
    sender_name: 'Sarah',
    recipient_id: 'local-demo',
    content: 'Can you send me the event details?',
    created_date: new Date(now - 18 * 60 * 1000).toISOString(),
  },
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
      category: 'Food',
      status: 'open',
      locationLabel: 'Woodmere',
      approxLat: 40.6323,
      approxLng: -73.7129,
      created_by_user_id: 'demo-sarah',
      created_by_name: 'Sarah',
      offers_count: 1,
      views_count: 24,
      created_date: new Date(now - 45 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'local-mitzvah-2',
      title: 'Ride to doctor appointment',
      description: 'Looking for a ride from Cedarhurst to a local appointment tomorrow morning.',
      category: 'Community',
      status: 'open',
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
      category: 'Torah Study',
      status: 'open',
      locationLabel: 'Lawrence',
      approxLat: 40.6157,
      approxLng: -73.7296,
      created_by_user_id: 'demo-sarah',
      created_by_name: 'Sarah',
      offers_count: 2,
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
      user_id: 'demo-sarah',
      user_name: 'Sarah',
      status: 'JOINED',
      created_date: new Date(now - 70 * 60 * 1000).toISOString(),
      updated_date: new Date(now - 70 * 60 * 1000).toISOString(),
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
      longest_streak: 5,
      last_activity_date: new Date(now).toISOString().slice(0, 10),
      badge_level: 'starter',
      created_date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_date: new Date(now).toISOString(),
    },
  ],
};

const ensureSeeded = (name) => {
  if (typeof localStorage === 'undefined') return;
  const key = `${STORAGE_PREFIX}${name}`;
  if (!localStorage.getItem(key) && seedData[name]) {
    localStorage.setItem(key, JSON.stringify(seedData[name]));
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

const toAppRow = (row = {}) => ({
  ...row,
  created_date: row.created_date || row.created_at,
  updated_date: row.updated_date || row.updated_at,
  full_name: row.full_name || row.display_name || 'User',
  cityPreset: row.cityPreset || row.city,
});

const toDbPatch = (data = {}) => {
  const patch = { ...data };
  if (patch.created_date && !patch.created_at) patch.created_at = patch.created_date;
  if (patch.updated_date && !patch.updated_at) patch.updated_at = patch.updated_date;
  if (patch.cityPreset && !patch.city) patch.city = patch.cityPreset;
  if (patch.community_settings?.primaryNeighborhood && !patch.public_community) {
    patch.public_community = patch.community_settings.primaryNeighborhood;
  }
  delete patch.created_date;
  delete patch.updated_date;
  delete patch.full_name;
  delete patch.email;
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
  const dbPatch = { ...toDbPatch(patch), updated_at: new Date().toISOString() };
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

const createSupabaseEntityApi = (entityName) => {
  const table = SUPABASE_ENTITY_TABLES[entityName];
  const readTable = PUBLIC_PROFILE_ENTITIES.has(entityName) ? 'public_profiles' : table;
  const readSelect = PUBLIC_PROFILE_ENTITIES.has(entityName) ? PUBLIC_PROFILE_SELECT : '*';
  const localApi = createEntityApi(entityName);

  if (!table || !supabase) return localApi;

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
        const { data: created, error } = await supabase
          .from(table)
          .insert(toDbPatch(data))
          .select()
          .single();
        if (error) throw error;
        return toAppRow(created);
      }, () => localApi.create(data), entityName, true);
    },

    async bulkCreate(items = []) {
      return runWithLocalFallback(async () => {
        const { data, error } = await supabase
          .from(table)
          .insert(items.map(toDbPatch))
          .select();
        if (error) throw error;
        return (data || []).map(toAppRow);
      }, () => localApi.bulkCreate(items), entityName, true);
    },

    async update(id, patch) {
      return runWithLocalFallback(async () => {
        const { data, error } = await supabase
          .from(table)
          .update({ ...toDbPatch(patch), updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
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
      const channel = supabase
        .channel(`${table}-changes`)
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
  if (!needle) return { posts: [], communities: [], events: [], people: [] };

  // Local / demo mode: filter tiny in-memory datasets on the client.
  if (!shouldUseSupabase) {
    const [postsResult, communitiesResult, peopleResult] = await Promise.allSettled([
      activeEntities.UnifiedPost.list('-created_date', 120),
      activeEntities.Community.list('-follower_count', 80),
      activeEntities.User.list('-created_date', 80),
    ]);

    const allPosts = postsResult.status === 'fulfilled' ? postsResult.value : [];
    const allCommunities = communitiesResult.status === 'fulfilled' ? communitiesResult.value : [];
    const allPeople = peopleResult.status === 'fulfilled' ? peopleResult.value : [];

    const postMatches = allPosts
      .filter((post) => {
        if (filters.post_type && post.type !== filters.post_type) return false;
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

  if (filters.post_type) postsQuery = postsQuery.eq('type', filters.post_type);
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
    .select('id,display_name,avatar_url,username,public_community,city,bio,is_profile_complete,created_at,updated_at')
    .or(`display_name.ilike.%${esc}%,username.ilike.%${esc}%,bio.ilike.%${esc}%,city.ilike.%${esc}%,public_community.ilike.%${esc}%`)
    .limit(12);

  const [postsResult, communitiesResult, peopleResult] = await Promise.allSettled([
    postsQuery,
    communitiesQuery,
    peopleQuery,
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

  const createdProfile = {
    id: data.user.id,
    display_name: data.user.email?.split('@')[0] || 'User',
  };

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert(createdProfile)
    .select()
    .single();

  if (createError) throw createError;

  await supabase.from('account_private').upsert({
    id: data.user.id,
    email: data.user.email,
    updated_at: new Date().toISOString(),
  });

  return toAppRow({
    ...created,
    email: data.user.email,
  });
};

export const base44 = {
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
    redirectToLogin(fromUrl = '/') {
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

      if (name === 'create-checkout') {
        return {
          data: {
            url: null,
            checkoutUrl: null,
            paymentLive: false,
            error: 'Payments are not connected yet.',
          },
        };
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
