import {
  createFeedEngagementEvent,
  createFeedUserPreference,
  filterDailyFeedPrompt,
  filterFeedEngagementEvent,
  filterFeedUserPreference,
  filterFiveTownsBrief,
  updateFeedUserPreference,
} from '@/services/entityServices';
import { BRIEF_CATEGORY_IDS } from '@/lib/feed/briefCategories';
import {
  getCategoryPreference,
  getCategoryPreferenceAdjustment,
  normalizePreferenceProfile,
} from '@/lib/feed/feedPreferenceModel';
import { classifyBriefCategory } from '@/lib/feed/briefRanking';

const PROMPT_LIBRARY = [
  {
    id: 'shabbos-prep',
    prompt_type: 'shabbos',
    question: 'What do you need or what can you offer before Shabbos?',
    cta_label: 'Post Shabbos need',
    suggested_post_type: 'help',
    suggested_post_subtype: 'shabbos',
    initial_body: 'Before Shabbos I am looking for / can help with...',
  },
  {
    id: 'local-recommendation',
    prompt_type: 'recommendation',
    question: 'Who do you recommend locally this week?',
    cta_label: 'Ask or recommend',
    suggested_post_type: 'feed',
    suggested_post_subtype: 'recommendation',
    initial_body: 'Who do you recommend locally for...',
  },
  {
    id: 'connection',
    prompt_type: 'connection',
    question: 'Looking for a chavrusa, host, ride, meetup, or new local circle?',
    cta_label: 'Connect locally',
    suggested_post_type: 'feed',
    suggested_post_subtype: 'connection',
    initial_body: 'I am looking to connect around...',
  },
  {
    id: 'tonight',
    prompt_type: 'events',
    question: 'What is happening tonight in the Five Towns?',
    cta_label: 'Share an event',
    suggested_post_type: 'event',
    suggested_post_subtype: 'local_event',
    initial_body: 'Tonight in the Five Towns...',
  },
];

const lower = (value) => String(value || '').toLowerCase();
const todayKey = () => new Date().toISOString().slice(0, 10);
const VALID_CATEGORY_IDS = new Set(BRIEF_CATEGORY_IDS);
const CATEGORY_EVENT_TYPES = new Set(['save', 'reply', 'join', 'category_open', 'show_less']);

export function normalizeFeedPreferences(preferences, userId = null) {
  return normalizePreferenceProfile(preferences, userId);
}

function sanitizePreferencePatch(patch = {}) {
  const sanitized = { ...patch };
  const normalized = normalizePreferenceProfile(patch);
  if (Object.hasOwn(patch, 'interests')) {
    sanitized.interests = normalized.interests;
  }
  if (Object.hasOwn(patch, 'engagement_level')) {
    sanitized.engagement_level = normalized.engagement_level;
  }
  if (Object.hasOwn(patch, 'interest_groups')) {
    sanitized.interest_groups = normalized.interest_groups;
  }
  if (Object.hasOwn(patch, 'category_preferences')) {
    sanitized.category_preferences = normalized.category_preferences;
  }
  if (Object.hasOwn(patch, 'catch_up_windows')) {
    sanitized.catch_up_windows = normalized.catch_up_windows;
  }
  if (Object.hasOwn(patch, 'preference_setup_version')) {
    sanitized.preference_setup_version = normalized.preference_setup_version;
  }
  if (Object.hasOwn(patch, 'preference_setup_completed_at')) {
    sanitized.preference_setup_completed_at = normalized.preference_setup_completed_at;
  }
  return sanitized;
}

const stableIndex = (seed, size) => {
  const total = String(seed).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return total % size;
};

const postText = (post) => `${post.title || ''} ${post.body || ''} ${post.content || ''} ${post.type || ''} ${post.post_subtype || ''}`;

function classifyPost(post) {
  const text = lower(postText(post));
  if (post.type === 'event' || /event|shiur|class|meetup|dinner|melave|concert|tonight/.test(text)) return 'event';
  if (post.type === 'help' || /chesed|volunteer|meal|ride|help|errand|pickup/.test(text)) return 'help';
  if (/lost|found|missing|returned/.test(text)) return 'lost_found';
  if (/minyan|maariv|shacharis|shiur|shul|kiddush/.test(text)) return 'shul';
  if (/recommend|restaurant|food|store|gemach|vendor|babysitter|tutor/.test(text)) return 'recommendation';
  return 'discussion';
}

export const feedRetentionService = {
  async getPreferences(userId) {
    if (!userId) return null;
    const existing = await filterFeedUserPreference({ user_id: userId }, '-updated_date', 1);
    return normalizeFeedPreferences(existing?.[0], userId);
  },

  async savePreferences(userId, patch) {
    if (!userId) return null;
    const existing = await this.getPreferences(userId);
    const sanitizedPatch = sanitizePreferencePatch(patch);
    const saved = existing?.id
      ? await updateFeedUserPreference(existing.id, sanitizedPatch)
      : await createFeedUserPreference({ user_id: userId, ...sanitizedPatch });
    return normalizeFeedPreferences(saved, userId);
  },

  async getCategorySignals(userId) {
    if (!userId) return [];
    const events = await filterFeedEngagementEvent({ user_id: userId }, '-created_at', 100);
    return (events || []).filter(({ event_type }) => CATEGORY_EVENT_TYPES.has(event_type));
  },

  async recordEvent({ userId, post, eventType, metadata = {} }) {
    if (!eventType) return null;
    const safeMetadata = { ...metadata };
    if (!VALID_CATEGORY_IDS.has(safeMetadata.category_id)) delete safeMetadata.category_id;
    return createFeedEngagementEvent({
      user_id: userId || null,
      post_id: post?.id || null,
      community_id: post?.community_id || null,
      event_type: eventType,
      post_type: post?.type || null,
      post_subtype: post?.post_subtype || null,
      neighborhood: post?.location_text || post?.city || null,
      metadata: safeMetadata,
    });
  },

  async getDailyPrompt({ network = 'Five Towns', userId } = {}) {
    const promptDate = todayKey();
    try {
      const prompts = await filterDailyFeedPrompt({ prompt_date: promptDate, network, active: true }, 'prompt_type', 10);
      if (prompts?.length) return prompts[stableIndex(`${promptDate}-${userId || 'guest'}`, prompts.length)];
    } catch {
      // Fall through to local prompt library.
    }
    return PROMPT_LIBRARY[stableIndex(`${promptDate}-${userId || 'guest'}`, PROMPT_LIBRARY.length)];
  },

  async getPublishedBrief({ network = 'Five Towns' } = {}) {
    const briefDate = todayKey();
    try {
      const briefs = await filterFiveTownsBrief({ brief_date: briefDate, network }, '-updated_at', 1);
      return briefs?.[0] || null;
    } catch {
      return null;
    }
  },

  buildBrief({ posts = [], communityGroups = [], networkLabel = 'Five Towns', curatedBrief = null } = {}) {
    const classified = posts.map((post) => ({ post, bucket: classifyPost(post) }));
    const count = (bucket) => classified.filter((item) => item.bucket === bucket).length;
    const activeThreads = [...posts]
      .sort((a, b) => ((b.comments_count || 0) + (b.likes_count || 0)) - ((a.comments_count || 0) + (a.likes_count || 0)))
      .slice(0, 3);

    const payload = curatedBrief?.payload || {};
    const curatedUpdates = Array.isArray(payload.top_local_updates) ? payload.top_local_updates.slice(0, 3) : [];

    return {
      title: curatedBrief?.title || `Today in ${networkLabel}`,
      subtitle: 'Your daily Jewish local brief.',
      topLocalUpdates: curatedUpdates,
      verifiedLocalBrief: Boolean(curatedBrief && curatedUpdates.length),
      rotatingDailyBrief: !curatedUpdates.length,
      metrics: [
        { label: 'Events', value: count('event'), detail: 'today and coming up' },
        { label: 'Chesed', value: count('help'), detail: 'needs and offers' },
        { label: 'Lost/found', value: count('lost_found'), detail: 'local items' },
        { label: 'Shul pulse', value: count('shul'), detail: 'minyanim and learning' },
      ],
      activeThreads,
      joinedCommunityCount: communityGroups.length,
      shabbosChecklist: [
        'Check rides and hosting',
        'Scan urgent chesed needs',
        'Review shul and event updates',
        'Ask one local recommendation',
      ],
    };
  },

  scorePost(post, context = {}) {
    const {
      joinedCommunityIds = new Set(),
      primaryNetwork,
      userInterests = [],
      interestSignals = { types: {}, subtypes: {}, keywords: [] },
      preferences = null,
      currentUserId = null,
    } = context;

    const likes = post.likes_count || 0;
    const comments = post.comments_count || 0;
    const parsed = new Date(post.created_date || post.created_at || Date.now()).getTime();
    // A malformed date must not poison the score with NaN — treat it as "now".
    const created = Number.isFinite(parsed) ? parsed : Date.now();
    const ageHours = Math.max(0, (Date.now() - created) / 3600000);
    const timeDecay = Math.max(0.2, 1 - ageHours / 72);
    let score = (likes + comments * 4 + 4) * timeDecay;
    if (preferences) {
      const categoryId = classifyBriefCategory(post);
      const categoryAdjustment = getCategoryPreferenceAdjustment(getCategoryPreference(preferences, categoryId));
      const cannotHide = post.post_subtype === 'alert'
        || post.category === 'safety'
        || post.urgency === 'emergency'
        || post.user_id === currentUserId
        || post.moderation_notice
        || post.is_moderation_notice
        || post.legal_notice
        || post.is_legally_required;
      score += categoryAdjustment === Number.NEGATIVE_INFINITY && cannotHide ? 0 : categoryAdjustment;
    }

    if (post.community_id && joinedCommunityIds.has(post.community_id)) score = score * 3 + 60;
    if (comments >= 5) score += 18;
    if (comments >= 10) score += 28;

    const text = lower(postText(post));
    userInterests.forEach((interest) => {
      if (interest && text.includes(lower(interest))) score += 12;
    });

    const typeBoost = interestSignals.types?.[post.type] || 0;
    const subtypeBoost = post.post_subtype ? (interestSignals.subtypes?.[post.post_subtype] || 0) : 0;
    score *= (1 + typeBoost * 0.08 + subtypeBoost * 0.12);

    const location = lower(post.city || post.location_text || '');
    if (primaryNetwork?.cityPreset && location.includes(lower(primaryNetwork.cityPreset))) score += 24;
    if (primaryNetwork?.neighborhoods?.some((neighborhood) => location.includes(lower(neighborhood)))) score += 18;

    return score;
  },

  explainPost(post, context = {}) {
    const {
      joinedCommunityIds = new Set(),
      primaryNetwork,
      userInterests = [],
    } = context;

    const text = lower(postText(post));
    const reasons = [];
    if (post.community_id && joinedCommunityIds.has(post.community_id)) {
      reasons.push(`From ${post.community_name || 'a community you joined'}`);
    }

    const location = lower(post.city || post.location_text || '');
    if (
      primaryNetwork?.cityPreset && location.includes(lower(primaryNetwork.cityPreset))
    ) {
      reasons.push(`Near ${primaryNetwork.shortLabel || primaryNetwork.cityPreset}`);
    } else if (
      primaryNetwork?.neighborhoods?.some((neighborhood) => location.includes(lower(neighborhood)))
    ) {
      reasons.push('Near your local network');
    }

    const matchedInterest = userInterests.find((interest) => interest && text.includes(lower(interest)));
    if (matchedInterest) reasons.push(`Matches ${matchedInterest}`);

    if ((post.comments_count || 0) >= 10) reasons.push('Active discussion');
    if ((post.likes_count || 0) >= 20) reasons.push('Trending now');

    return reasons.slice(0, 2);
  },
};

export default feedRetentionService;
