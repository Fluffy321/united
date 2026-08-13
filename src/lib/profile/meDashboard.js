const DAILY_TIME_FIELDS = [
  ['sunrise', 'Sunrise'],
  ['sofZmanShma', 'Latest Shema'],
  ['minchaGedola', 'Mincha gedola'],
  ['sunset', 'Sunset'],
];

const PLAN_PRIORITY = {
  mitzvah_offer: 0,
  mitzvah_accepted: 0,
  verification_request: 0,
  new_message: 1,
  marketplace_message: 1,
  community_activity: 2,
  announcement: 2,
};

const URGENT_TYPES = new Set(['mitzvah_offer', 'mitzvah_accepted', 'verification_request']);

function validFutureDate(value, now) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date <= now ? null : date;
}

function notificationTime(notification) {
  const date = new Date(notification.updated_at || notification.created_date || notification.created_at || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function notificationHasRoute(notification) {
  return Boolean(notification?.link_url || notification?.post_id || (notification?.type === 'new_message' && notification?.conversation_id));
}

export function selectNextJewishTime(zmanim, shabbatTimes, now = new Date()) {
  const daily = DAILY_TIME_FIELDS
    .map(([key, label]) => ({ label, date: zmanim?.[key], parsed: validFutureDate(zmanim?.[key], now) }))
    .filter((item) => item.parsed)
    .sort((a, b) => a.parsed - b.parsed)[0];

  if (daily) return { label: daily.label, date: daily.date };

  const candleDate = validFutureDate(shabbatTimes?.candleLighting, now);
  if (!candleDate) return null;
  return {
    label: shabbatTimes?.candleTitle || 'Candle lighting',
    date: shabbatTimes.candleLighting,
  };
}

export function rankPersonalAlerts(notifications = [], limit = 3) {
  return [...notifications]
    .sort((a, b) => {
      if (Boolean(a.is_read) !== Boolean(b.is_read)) return a.is_read ? 1 : -1;
      return notificationTime(b) - notificationTime(a);
    })
    .slice(0, limit);
}

export function selectNextPersonalPlan(notifications = []) {
  return notifications
    .filter((notification) => !notification.is_read && notificationHasRoute(notification) && PLAN_PRIORITY[notification.type] !== undefined)
    .sort((a, b) => {
      const priority = PLAN_PRIORITY[a.type] - PLAN_PRIORITY[b.type];
      return priority || notificationTime(b) - notificationTime(a);
    })[0] || null;
}

export function isUrgentPersonalAlert(notification) {
  return URGENT_TYPES.has(notification?.type);
}
