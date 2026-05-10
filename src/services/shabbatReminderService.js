import { getFiveTownsShabbatTimes } from '@/lib/hebrewDate';
import { storageService } from './storageService';

const SENT_KEY = 'junited_shabbat_reminders_sent';
const TWENTY_MINUTES = 20 * 60 * 1000;
const MAX_TIMEOUT = 2147483647;

const activeTimers = new Set();

function sentMap() {
  return storageService.getJson(SENT_KEY, {});
}

function markSent(key) {
  storageService.setJson(SENT_KEY, { ...sentMap(), [key]: new Date().toISOString() });
}

function wasSent(key) {
  return Boolean(sentMap()[key]);
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

async function showNotification({ title, body, url = '/Feed' }) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url },
        tag: title,
      });
      return true;
    }
  }

  new Notification(title, { body, icon: '/icons/icon-192.png', data: { url } });
  return true;
}

function scheduleAt(runAt, callback) {
  const delay = runAt.getTime() - Date.now();
  if (delay <= 0 || delay > MAX_TIMEOUT) return null;
  const timer = window.setTimeout(async () => {
    activeTimers.delete(timer);
    await callback();
  }, delay);
  activeTimers.add(timer);
  return timer;
}

function scheduleReminder({ key, runAt, title, body }) {
  if (wasSent(key)) return;
  scheduleAt(runAt, async () => {
    if (wasSent(key)) return;
    const delivered = await showNotification({ title, body });
    if (delivered) markSent(key);
  });
}

export const shabbatReminderService = {
  stop() {
    activeTimers.forEach((timer) => window.clearTimeout(timer));
    activeTimers.clear();
  },

  async start({ enabled = true } = {}) {
    this.stop();
    if (!enabled || typeof window === 'undefined' || typeof Notification === 'undefined') return null;
    if (Notification.permission !== 'granted') return null;

    const times = await getFiveTownsShabbatTimes();
    if (!times?.candleLighting || !times?.havdalah) return null;

    const candleLighting = new Date(times.candleLighting);
    const preShabbat = new Date(candleLighting.getTime() - TWENTY_MINUTES);
    const havdalah = new Date(times.havdalah);
    const weekKey = candleLighting.toISOString().slice(0, 10);

    scheduleReminder({
      key: `${weekKey}:before`,
      runAt: preShabbat,
      title: 'Shabbat starts soon',
      body: `Candle lighting is at ${formatTime(times.candleLighting)} in the Five Towns. Wrap up posts, rides, and chesed plans.`,
    });

    scheduleReminder({
      key: `${weekKey}:after`,
      runAt: havdalah,
      title: 'Shabbat has ended',
      body: `Havdalah was at ${formatTime(times.havdalah)}. JUnited is ready when you are.`,
    });

    return times;
  },
};

export default shabbatReminderService;
