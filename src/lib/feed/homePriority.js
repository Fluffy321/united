import { BRIEF_CATEGORIES } from './briefCategories';
import { aggregateCategorySignals, classifyBriefCategory } from './briefRanking';

const CLOSED_STATES = new Set(['closed', 'filled', 'completed', 'cancelled', 'canceled', 'resolved']);
const ENGAGEMENT_LIMITS = { quiet: 1, balanced: 2, active: 3, all_in: 3 };
const EMERGENCY_OVERRIDE_SCORE = 10_000;
export const DOMINANT_PRIORITY_THRESHOLD = 130;

const textOf = (item) => String(item?.title || item?.body || item?.content || '').trim();
const lower = (value) => String(value || '').toLowerCase();

function timestampOf(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function dateOf(item) {
  return timestampOf(item.created_at || item.created_date || item.updated_at || item.updated_date);
}

function expiryOf(item) {
  return timestampOf(item.expires_at || item.deadline_at || item.end_at || item.end_date);
}

function deadlineHours(item, now) {
  const deadline = timestampOf(item.deadline_at || item.expires_at || item.start_at || item.start_date);
  if (!deadline) return Number.POSITIVE_INFINITY;
  return (deadline - now.getTime()) / 3_600_000;
}

function isEmergency(item) {
  return item.post_subtype === 'alert'
    || item.category === 'safety'
    || item.urgency === 'emergency';
}

function isOpenHelp(item, categoryId) {
  if (categoryId !== 'helping') return false;
  const status = lower(item.status || item.request_status || item.help_status || 'open');
  return !CLOSED_STATES.has(status);
}

function matchesNetwork(item, primaryNetwork) {
  if (!primaryNetwork) return false;
  const locality = lower([item.city, item.location_text, item.network].filter(Boolean).join(' '));
  if (!locality) return false;

  const labels = [
    primaryNetwork.cityPreset,
    primaryNetwork.shortLabel,
    ...(primaryNetwork.neighborhoods || []),
  ].filter(Boolean).map(lower);

  return labels.some((label) => locality.includes(label));
}

function isEligible(item, { blockedUserIds, now }) {
  if (!item?.id || !textOf(item)) return false;
  if (blockedUserIds.has(item.user_id)) return false;
  if (item.reported || item.is_reported || item.moderation_status === 'removed') return false;

  const status = lower(item.status || item.request_status || item.help_status);
  if (CLOSED_STATES.has(status)) return false;
  if (item.listing_status && item.listing_status !== 'available') return false;

  const expiry = expiryOf(item);
  return !expiry || expiry > now.getTime();
}

function addReason(reasons, id, label, priority) {
  if (!label || reasons.some((reason) => reason.id === id)) return;
  reasons.push({ id, label, priority });
}

function scoreHomeItem(item, context) {
  const {
    selectedCategoryIds,
    categorySignals,
    primaryNetwork,
    currentUserId,
    now,
  } = context;
  const categoryId = classifyBriefCategory(item);
  const reasons = [];
  const hoursRemaining = deadlineHours(item, now);
  const emergency = isEmergency(item);
  const openHelp = isOpenHelp(item, categoryId);
  const nearby = matchesNetwork(item, primaryNetwork);
  const owned = Boolean(currentUserId && item.user_id === currentUserId);
  const unreadReplies = Math.max(0, Number(item.unread_reply_count || 0));
  const verified = Boolean(item.verified || item.provenance === 'editor');
  let score = 0;

  if (selectedCategoryIds.includes(categoryId)) score += 30;
  score += Math.min(20, Math.max(-20, (Number(categorySignals[categoryId]) || 0) * 4));

  if (hoursRemaining <= 6) {
    score += 100;
    addReason(reasons, 'ends_soon', `Ends in ${Math.max(1, Math.ceil(hoursRemaining))}h`, 100);
  } else if (hoursRemaining <= 24) {
    score += 65;
    addReason(reasons, 'ends_today', 'Time-sensitive', 95);
  }

  if (owned) {
    score += 70;
    addReason(reasons, 'yours', 'Yours', 90);
  }
  if (unreadReplies > 0) {
    score += 60;
    addReason(reasons, 'new_replies', `${unreadReplies} new`, 88);
  }
  if (nearby) {
    score += 30;
    addReason(reasons, 'nearby', 'Nearby', 80);
  }
  if (verified) {
    score += 25;
    addReason(reasons, 'verified', 'Verified', 70);
  }
  if (openHelp) {
    score += 40;
    addReason(reasons, 'needs_action', 'Needs action', 60);
  }

  const ageHours = Math.max(0, (now.getTime() - dateOf(item)) / 3_600_000);
  if (ageHours <= 24) score += 15;
  else if (ageHours <= 72) score += 8;

  if (emergency) {
    score += EMERGENCY_OVERRIDE_SCORE;
    addReason(reasons, 'emergency', 'Emergency alert', 110);
  }

  const actionable = emergency || openHelp || Number.isFinite(hoursRemaining) || owned || unreadReplies > 0;
  return {
    ...item,
    category_id: categoryId,
    priority_score: score,
    priority_reasons: reasons
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 2)
      .map(({ id, label }) => ({ id, label })),
    is_dominant: emergency || (actionable && score >= DOMINANT_PRIORITY_THRESHOLD),
  };
}

function compareHomeItems(a, b) {
  if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
  const timeDelta = dateOf(b) - dateOf(a);
  if (timeDelta) return timeDelta;
  return String(a.id).localeCompare(String(b.id));
}

function belongsInQuietPriority(item) {
  const reasonIds = new Set(item.priority_reasons.map(({ id }) => id));
  return item.is_dominant
    || reasonIds.has('emergency')
    || reasonIds.has('yours')
    || reasonIds.has('new_replies');
}

export function buildCategoryLeads(rankedItems, excludedIds = new Set()) {
  return BRIEF_CATEGORIES.map((category) => {
    const allMatches = rankedItems.filter((item) => item.category_id === category.id);
    const leadItem = allMatches.find((item) => !excludedIds.has(item.id)) || null;
    return {
      category,
      item: leadItem,
      count: allMatches.length,
      stateLabel: allMatches.length ? `${allMatches.length} current` : null,
      action: leadItem ? null : category.actions[0],
    };
  }).sort((a, b) => {
    const scoreDelta = (b.item?.priority_score || 0) - (a.item?.priority_score || 0);
    if (scoreDelta) return scoreDelta;
    return BRIEF_CATEGORIES.findIndex(({ id }) => id === a.category.id)
      - BRIEF_CATEGORIES.findIndex(({ id }) => id === b.category.id);
  });
}

export function buildHomePriorityModel({
  items = [],
  selectedCategoryIds = [],
  events = [],
  categorySignals = aggregateCategorySignals(events),
  primaryNetwork = null,
  currentUserId = null,
  engagementLevel = 'balanced',
  blockedUserIds = [],
  now = new Date(),
  limit = ENGAGEMENT_LIMITS[engagementLevel] || 2,
} = {}) {
  const blocked = new Set(blockedUserIds);
  const seen = new Set();
  const eligible = items.filter((item) => {
    if (seen.has(item?.id)) return false;
    if (item?.id) seen.add(item.id);
    return isEligible(item, { blockedUserIds: blocked, now });
  });

  const ranked = eligible
    .map((item) => scoreHomeItem(item, {
      selectedCategoryIds,
      categorySignals,
      primaryNetwork,
      currentUserId,
      now,
    }))
    .sort(compareHomeItems);
  const priorityPool = engagementLevel === 'quiet'
    ? ranked.filter(belongsInQuietPriority)
    : ranked;
  const priorities = priorityPool.slice(0, Math.max(0, limit));
  const priorityIds = new Set(priorities.map(({ id }) => id));

  return {
    priorities,
    categoryLeads: buildCategoryLeads(ranked, priorityIds),
    priorityIds,
  };
}
