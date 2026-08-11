import { BRIEF_CATEGORY_IDS, DEFAULT_BRIEF_CATEGORY_IDS } from './briefCategories';

export const INTEREST_GROUPS = Object.freeze([
  { id: 'local', label: 'Around you', categoryIds: ['local'] },
  { id: 'plans', label: 'Things to do', categoryIds: ['events', 'sports_social', 'shabbos_plans'] },
  { id: 'food', label: 'Food and new spots', categoryIds: ['kosher_food'] },
  { id: 'help', label: 'Help out or get help', categoryIds: ['helping'] },
  { id: 'learning', label: 'Jewish ideas', categoryIds: ['torah_learning'] },
  { id: 'minyan', label: 'Minyanim and times', categoryIds: ['minyanim', 'jewish_times'] },
  { id: 'people', label: 'People to know', categoryIds: [] },
  { id: 'market', label: 'Deals, jobs and giveaways', categoryIds: ['marketplace', 'jobs_business'] },
  { id: 'family', label: 'School and family', categoryIds: ['parents_schools'] },
]);

export const CATEGORY_PREFERENCE_VALUES = Object.freeze(['more', 'normal', 'less', 'hide']);
export const CATCH_UP_WINDOWS = Object.freeze(['morning', 'daytime', 'evening', 'important_only']);
export const DEFAULT_SETUP_DRAFT = Object.freeze({
  interest_groups: Object.freeze(['local', 'plans']),
  engagement_level: 'balanced',
  catch_up_windows: Object.freeze(['morning', 'evening']),
});

const ENGAGEMENT_LEVELS = new Set(['quiet', 'balanced', 'active', 'all_in']);
const GROUP_IDS = new Set(INTEREST_GROUPS.map(({ id }) => id));
const CATEGORY_IDS = new Set(BRIEF_CATEGORY_IDS);
const CATEGORY_VALUES = new Set(CATEGORY_PREFERENCE_VALUES);
const WINDOW_IDS = new Set(CATCH_UP_WINDOWS);

function uniqueValid(values, allowed) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value) => allowed.has(value)))];
}

function normalizeCatchUpWindows(windows) {
  const valid = uniqueValid(windows, WINDOW_IDS);
  return valid.includes('important_only') ? ['important_only'] : valid;
}

function normalCategoryPreferences() {
  return Object.fromEntries(BRIEF_CATEGORY_IDS.map((categoryId) => [categoryId, 'normal']));
}

export function normalizeSetupDraft(draft = {}) {
  return {
    interest_groups: uniqueValid(draft.interest_groups, GROUP_IDS),
    engagement_level: ENGAGEMENT_LEVELS.has(draft.engagement_level)
      ? draft.engagement_level
      : 'balanced',
    catch_up_windows: normalizeCatchUpWindows(draft.catch_up_windows),
  };
}

export function buildPreferencePatch(draft, { completedAt = new Date().toISOString() } = {}) {
  const normalized = normalizeSetupDraft(draft);
  const interests = [...new Set(normalized.interest_groups.flatMap((groupId) => (
    INTEREST_GROUPS.find(({ id }) => id === groupId)?.categoryIds || []
  )))];
  const categoryPreferences = normalCategoryPreferences();
  interests.forEach((categoryId) => {
    categoryPreferences[categoryId] = 'more';
  });

  return {
    interests,
    engagement_level: normalized.engagement_level,
    interest_groups: normalized.interest_groups,
    category_preferences: categoryPreferences,
    catch_up_windows: normalized.catch_up_windows,
    preference_setup_version: 1,
    preference_setup_completed_at: completedAt,
  };
}

export function normalizePreferenceProfile(preferences, userId = null) {
  const hasStoredRow = Boolean(preferences);
  const interests = hasStoredRow
    ? uniqueValid(preferences?.interests, CATEGORY_IDS)
    : [...DEFAULT_BRIEF_CATEGORY_IDS];
  const categoryPreferences = normalCategoryPreferences();

  if (preferences?.category_preferences && typeof preferences.category_preferences === 'object') {
    BRIEF_CATEGORY_IDS.forEach((categoryId) => {
      const value = preferences.category_preferences[categoryId];
      if (CATEGORY_VALUES.has(value)) categoryPreferences[categoryId] = value;
    });
  } else if (hasStoredRow) {
    interests.forEach((categoryId) => {
      categoryPreferences[categoryId] = 'more';
    });
  }

  return {
    ...(preferences || {}),
    user_id: preferences?.user_id || userId,
    interests,
    engagement_level: ENGAGEMENT_LEVELS.has(preferences?.engagement_level)
      ? preferences.engagement_level
      : 'balanced',
    interest_groups: uniqueValid(preferences?.interest_groups, GROUP_IDS),
    category_preferences: categoryPreferences,
    catch_up_windows: normalizeCatchUpWindows(preferences?.catch_up_windows),
    preference_setup_version: Number.isInteger(preferences?.preference_setup_version)
      && preferences.preference_setup_version >= 0
      ? preferences.preference_setup_version
      : 0,
    preference_setup_completed_at: typeof preferences?.preference_setup_completed_at === 'string'
      ? preferences.preference_setup_completed_at
      : null,
  };
}

export function applyCatchUpSelection(currentWindows, nextWindow) {
  if (!WINDOW_IDS.has(nextWindow)) return normalizeCatchUpWindows(currentWindows);
  if (nextWindow === 'important_only') return ['important_only'];

  const selected = normalizeCatchUpWindows(currentWindows).filter((window) => window !== 'important_only');
  return selected.includes(nextWindow)
    ? selected.filter((window) => window !== nextWindow)
    : [...selected, nextWindow];
}

export function getActiveCatchUpWindow(windows, now = new Date()) {
  const selected = new Set(normalizeCatchUpWindows(windows));
  if (selected.has('important_only')) return null;

  const hour = now.getHours();
  const currentWindow = hour >= 5 && hour <= 10
    ? 'morning'
    : hour >= 11 && hour <= 16
      ? 'daytime'
      : hour >= 17 && hour <= 22
        ? 'evening'
        : null;

  return currentWindow && selected.has(currentWindow) ? currentWindow : null;
}

export function getCategoryPreference(preferences, categoryId) {
  if (!CATEGORY_IDS.has(categoryId)) return 'normal';
  const value = preferences?.category_preferences?.[categoryId];
  return CATEGORY_VALUES.has(value) ? value : 'normal';
}

export function getCategoryPreferenceAdjustment(value) {
  if (value === 'more') return 30;
  if (value === 'less') return -20;
  if (value === 'hide') return Number.NEGATIVE_INFINITY;
  return 0;
}

export function matchesInterestGroup(item, groupId) {
  if (!GROUP_IDS.has(groupId) || !item) return false;
  if (groupId === 'people') {
    return Boolean(
      item.community_id
      || item.communityId
      || item.group_id
      || item.groupId
      || item.source?.community_id
      || item.source?.group_id,
    );
  }

  const group = INTEREST_GROUPS.find(({ id }) => id === groupId);
  const categoryId = item.category_id || item.brief_category_id || item.category;
  return group.categoryIds.includes(categoryId);
}
