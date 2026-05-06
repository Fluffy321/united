import { getAuthRedirectUrl, shouldUseSupabase, supabase } from '@/api/supabaseClient';

const STORAGE_PREFIX = 'junited_local_entity_';
const SUPABASE_ENTITY_TABLES = {
  User: 'profiles',
  Profile: 'profiles',
  Community: 'communities',
  UnifiedPost: 'posts',
  Post: 'posts',
  Conversation: 'conversations',
  Message: 'messages',
};

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
  full_name: row.full_name || row.display_name || row.email,
});

const toDbPatch = (data = {}) => {
  const patch = { ...data };
  if (patch.created_date && !patch.created_at) patch.created_at = patch.created_date;
  if (patch.updated_date && !patch.updated_at) patch.updated_at = patch.updated_date;
  delete patch.created_date;
  delete patch.updated_date;
  delete patch.full_name;
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

const runWithLocalFallback = async (action, fallback, label) => {
  try {
    return await action();
  } catch (error) {
    if (shouldFallbackToLocal(error)) {
      console.warn(`Using local ${label} data because Supabase is not ready yet.`, error);
      return fallback();
    }
    throw error;
  }
};

const createSupabaseEntityApi = (entityName) => {
  const table = SUPABASE_ENTITY_TABLES[entityName];
  const localApi = createEntityApi(entityName);

  if (!table || !supabase) return localApi;

  return {
    async list(sort, limit = 100, offset = 0) {
      return runWithLocalFallback(async () => {
        let query = supabase.from(table).select('*').range(offset, offset + limit - 1);
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
        let query = supabase.from(table).select('*').limit(limit);
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
        const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
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
      }, () => localApi.create(data), entityName);
    },

    async bulkCreate(items = []) {
      return runWithLocalFallback(async () => {
        const { data, error } = await supabase
          .from(table)
          .insert(items.map(toDbPatch))
          .select();
        if (error) throw error;
        return (data || []).map(toAppRow);
      }, () => localApi.bulkCreate(items), entityName);
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
      }, () => localApi.update(id, patch), entityName);
    },

    async delete(idOrIds) {
      return runWithLocalFallback(async () => {
        const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
        const { error } = await supabase.from(table).delete().in('id', ids);
        if (error) throw error;
        return true;
      }, () => localApi.delete(idOrIds), entityName);
    },

    subscribe(callback) {
      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
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
  if (profile) return toAppRow(profile);

  const createdProfile = {
    id: data.user.id,
    email: data.user.email,
    display_name: data.user.email?.split('@')[0] || 'User',
  };

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert(createdProfile)
    .select()
    .single();

  if (createError) throw createError;
  return toAppRow(created);
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
        const { data, error } = await supabase
          .from('profiles')
          .update({ ...toDbPatch(patch), updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .select()
          .single();
        if (error) throw error;
        return toAppRow(data);
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
          email: data.user.email,
          display_name: displayName || data.user.email?.split('@')[0] || 'User',
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
      console.info(`Local function stub: ${name}`, payload);
      return { data: { results: { posts: [], communities: [], events: [], people: [] } } };
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
