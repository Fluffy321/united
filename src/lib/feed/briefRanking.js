import { BRIEF_CATEGORY_IDS } from './briefCategories';

const CATEGORY_IDS = new Set(BRIEF_CATEGORY_IDS);
const POSITIVE_EVENT_TYPES = new Set(['save', 'reply', 'join', 'category_open']);
const EMERGENCY_OVERRIDE_SCORE = 10_000;

const textOf = (item) => String([
  item?.title,
  item?.body,
  item?.content,
  item?.type,
  item?.post_subtype,
].filter(Boolean).join(' ')).toLowerCase();

export function classifyBriefCategory(item = {}) {
  if (CATEGORY_IDS.has(item.category_id)) return item.category_id;

  const text = textOf(item);
  if (item.type === 'help') return 'helping';
  if (item.type === 'event') return 'events';
  if (item.type === 'marketplace') return 'marketplace';
  if (/\b(help|chesed|volunteer|meal train|ride needed|gemach)\b/.test(text)) return 'helping';
  if (/\b(sell|selling|free item|marketplace|for sale)\b/.test(text)) return 'marketplace';
  if (/\b(minyan|shacharis|mincha|maariv|davening)\b/.test(text)) return 'minyanim';
  if (/\b(zmanim|candle lighting|havdalah|sunset)\b/.test(text)) return 'jewish_times';
  if (/\b(kosher|restaurant|catering|pizza|bakery|food)\b/.test(text)) return 'kosher_food';
  if (/\b(school|yeshiva|day school|parent|carpool|teacher)\b/.test(text)) return 'parents_schools';
  if (/\b(shiur|torah|chavrusa|learning|daf yomi)\b/.test(text)) return 'torah_learning';
  if (/\b(job|hiring|business|service|referral|resume)\b/.test(text)) return 'jobs_business';
  if (/\b(basketball|softball|pickleball|sports|game|workout|social)\b/.test(text)) return 'sports_social';
  if (/\b(shabbos|shabbat|hosting|host family|friday night)\b/.test(text)) return 'shabbos_plans';
  if (/\b(event|tonight|concert|dinner|meetup)\b/.test(text)) return 'events';
  return 'local';
}

export function aggregateCategorySignals(events = []) {
  return events.reduce((signals, event) => {
    const categoryId = event?.metadata?.category_id;
    if (!CATEGORY_IDS.has(categoryId)) return signals;

    let delta = 0;
    if (POSITIVE_EVENT_TYPES.has(event.event_type)) delta = 1;
    if (event.event_type === 'show_less') delta = -1;
    if (!delta) return signals;

    signals[categoryId] = (signals[categoryId] || 0) + delta;
    return signals;
  }, {});
}

function matchesNetwork(item, primaryNetwork) {
  if (!primaryNetwork) return false;
  const locality = String([item.city, item.location_text, item.network].filter(Boolean).join(' ')).toLowerCase();
  if (!locality) return false;

  const labels = [
    primaryNetwork.cityPreset,
    primaryNetwork.shortLabel,
    ...(primaryNetwork.neighborhoods || []),
  ].filter(Boolean).map((value) => String(value).toLowerCase());

  return labels.some((label) => locality.includes(label));
}

function ageInHours(item, now) {
  const created = new Date(item.created_at || item.created_date || item.updated_at || item.updated_date).getTime();
  if (!Number.isFinite(created)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - created) / 3_600_000);
}

export function scoreBriefItem(item, context = {}) {
  const {
    selectedCategoryIds = [],
    categorySignals = {},
    primaryNetwork = null,
    now = new Date(),
  } = context;
  const categoryId = classifyBriefCategory(item);
  const categorySignal = Number(categorySignals[categoryId]) || 0;
  const score =
    (selectedCategoryIds.includes(categoryId) ? 60 : 0) +
    Math.min(25, Math.max(-25, categorySignal * 5)) +
    (item.verified || item.provenance === 'editor' ? 5 : 0) +
    (item.urgency === 'urgent' ? 5 : 0) +
    (ageInHours(item, now) <= 24 ? 3 : 0) +
    (matchesNetwork(item, primaryNetwork) ? 2 : 0);

  const isEmergency = item.post_subtype === 'alert'
    || item.category === 'safety'
    || item.urgency === 'emergency';
  return isEmergency ? EMERGENCY_OVERRIDE_SCORE + score : score;
}

export function rankBriefItems({
  items = [],
  selectedCategoryIds = [],
  events = [],
  categorySignals = aggregateCategorySignals(events),
  primaryNetwork = null,
  now = new Date(),
  limit = 3,
} = {}) {
  const uniqueItems = [];
  const seenIds = new Set();

  for (const candidate of items) {
    if (!candidate?.id || seenIds.has(candidate.id)) continue;
    seenIds.add(candidate.id);
    uniqueItems.push(candidate);
  }

  return uniqueItems
    .map((candidate) => ({
      ...candidate,
      category_id: classifyBriefCategory(candidate),
      brief_score: scoreBriefItem(candidate, {
        selectedCategoryIds,
        categorySignals,
        primaryNetwork,
        now,
      }),
    }))
    .sort((a, b) => {
      if (b.brief_score !== a.brief_score) return b.brief_score - a.brief_score;
      const bTime = new Date(b.created_at || b.created_date || 0).getTime() || 0;
      const aTime = new Date(a.created_at || a.created_date || 0).getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, Math.max(0, limit));
}
