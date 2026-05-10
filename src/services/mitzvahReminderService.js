import { storageService } from './storageService';

const SENT_KEY = 'junited_daily_mitzvah_reminders_sent';
const activeTimers = new Set();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function sentMap() {
  return storageService.getJson(SENT_KEY, {});
}

function markSent(key) {
  storageService.setJson(SENT_KEY, { ...sentMap(), [key]: new Date().toISOString() });
}

function wasSent(key) {
  return Boolean(sentMap()[key]);
}

async function showNotification(title, body) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;

  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: '/MitzvahCircle?tab=log' },
    tag: 'daily-mitzvah-tracker',
  };

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
      return true;
    }
  }

  new Notification(title, options);
  return true;
}

function scheduleDaily(hour, minute, id, title, body) {
  const now = new Date();
  const runAt = new Date();
  runAt.setHours(hour, minute, 0, 0);
  if (runAt <= now) return;

  const key = `${todayKey()}:${id}`;
  if (wasSent(key)) return;

  const timer = window.setTimeout(async () => {
    activeTimers.delete(timer);
    if (wasSent(key)) return;
    const delivered = await showNotification(title, body);
    if (delivered) markSent(key);
  }, runAt.getTime() - now.getTime());
  activeTimers.add(timer);
}

export const mitzvahReminderService = {
  stop() {
    activeTimers.forEach((timer) => window.clearTimeout(timer));
    activeTimers.clear();
  },

  start({ enabled = true } = {}) {
    this.stop();
    if (!enabled || typeof window === 'undefined' || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    scheduleDaily(
      10,
      0,
      'morning',
      'Two mitzvot today?',
      'Start your daily mitzvah tracker with one small act of good.'
    );
    scheduleDaily(
      19,
      30,
      'evening',
      'Keep your mitzvah streak alive',
      'Log today’s mitzvot and write a quick reflection before the day ends.'
    );
  },
};

export default mitzvahReminderService;
