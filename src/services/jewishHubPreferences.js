import { storageService } from '@/services/storageService';
import { setCandleLocation } from '@/lib/shabbatLocation';

const EVENT_NAME = 'junited:jewish-hub-preferences-updated';
const STORAGE_PREFIX = 'junited:jewishHubPreferences';

export const JEWISH_HUB_SECTION_IDS = ['calendar', 'tehillim', 'parsha', 'shiurim', 'daily-learning', 'siddur', 'tanakh', 'divrei-torah'];
export const LEARNING_CYCLE_IDS = ['daf-yomi', 'mishnah-yomi', 'daily-rambam'];

export const DEFAULT_JEWISH_HUB_PREFERENCES = {
  location: null,
  nusach: 'ashkenaz',
  learningCycles: LEARNING_CYCLE_IDS,
  sectionOrder: JEWISH_HUB_SECTION_IDS,
  hiddenSections: [],
};

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${userId || 'guest'}`;
}

function normalizePreferences(value = {}) {
  const sectionOrder = Array.isArray(value.sectionOrder)
    ? [
        ...value.sectionOrder.filter((id) => JEWISH_HUB_SECTION_IDS.includes(id)),
        ...JEWISH_HUB_SECTION_IDS.filter((id) => !value.sectionOrder.includes(id)),
      ]
    : DEFAULT_JEWISH_HUB_PREFERENCES.sectionOrder;

  const learningCycles = Array.isArray(value.learningCycles)
    ? value.learningCycles.filter((id) => LEARNING_CYCLE_IDS.includes(id))
    : DEFAULT_JEWISH_HUB_PREFERENCES.learningCycles;

  return {
    ...DEFAULT_JEWISH_HUB_PREFERENCES,
    ...value,
    sectionOrder,
    learningCycles,
    hiddenSections: Array.isArray(value.hiddenSections)
      ? value.hiddenSections.filter((id) => JEWISH_HUB_SECTION_IDS.includes(id))
      : [],
    nusach: ['ashkenaz', 'sefard', 'edot-mizrach'].includes(value.nusach)
      ? value.nusach
      : DEFAULT_JEWISH_HUB_PREFERENCES.nusach,
  };
}

export function loadJewishHubPreferences(userId) {
  return normalizePreferences(storageService.getJson(storageKey(userId), DEFAULT_JEWISH_HUB_PREFERENCES));
}

export function saveJewishHubPreferences(userId, preferences) {
  const next = normalizePreferences(preferences);
  storageService.setJson(storageKey(userId), next);
  if (next.location?.lat && next.location?.lng && next.location?.label) {
    setCandleLocation({ type: 'manual', ...next.location });
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { userId, preferences: next } }));
  return next;
}

export function subscribeJewishHubPreferences(callback) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
