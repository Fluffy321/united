/**
 * Hebrew date utilities using the Hebcal API.
 * All functions return promises.
 */

const HEBCAL_BASE = 'https://www.hebcal.com';

/**
 * Convert a Gregorian date to Hebrew date string.
 * Returns e.g. "כ״ז בניסן תשפ״ו" or "27 Nisan 5786"
 */
export async function gregorianToHebrew(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  try {
    const res = await fetch(`${HEBCAL_BASE}/converter?cfg=json&gy=${y}&gm=${m}&gd=${d}&g2h=1`);
    const data = await res.json();
    return {
      hebrewString: data.hebrew,   // e.g. "כ״ז בניסן תשפ״ו"
      hd: data.hd,
      hm: data.hm,
      hy: data.hy,
      display: `${data.hd} ${data.hm} ${data.hy}`,
    };
  } catch {
    return null;
  }
}

/**
 * Get today's Hebrew date (cached for the session).
 */
let _todayCache = null;
let _todayCacheDate = null;

export async function getTodayHebrew() {
  const today = new Date().toDateString();
  if (_todayCache && _todayCacheDate === today) return _todayCache;
  const result = await gregorianToHebrew(new Date());
  _todayCache = result;
  _todayCacheDate = today;
  return result;
}

/**
 * Format a date with both civil and Hebrew date.
 * Returns e.g. "Sun, Apr 19 · 21 Nisan 5786"
 */
export async function formatDualDate(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const civil = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const heb = await gregorianToHebrew(date);
  if (!heb) return civil;
  return `${civil} · ${heb.display}`;
}

/**
 * Get zmanim for a location on a given date.
 */
export async function getZmanim(lat, lng, date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  try {
    const res = await fetch(
      `${HEBCAL_BASE}/zmanim?cfg=json&latitude=${lat}&longitude=${lng}&date=${dateStr}&tzid=America/New_York`
    );
    const data = await res.json();
    return data.times || null;
  } catch {
    return null;
  }
}

/**
 * Get this week's parsha.
 */
export async function getParsha() {
  try {
    const res = await fetch(`${HEBCAL_BASE}/shabbat?cfg=json&geo=none&m=50`);
    const data = await res.json();
    const parsha = data.items?.find(i => i.category === 'parashat');
    return parsha ? { name: parsha.title, hebrew: parsha.hebrew, link: parsha.link } : null;
  } catch {
    return null;
  }
}

/**
 * Get the next Shabbat candle lighting and Havdalah times for the Five Towns.
 */
export async function getFiveTownsShabbatTimes(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  try {
    const res = await fetch(
      `${HEBCAL_BASE}/shabbat?cfg=json&geo=pos&latitude=40.6157&longitude=-73.7296&tzid=America/New_York&m=20&b=18&date=${dateStr}`
    );
    const data = await res.json();
    const candle = data.items?.find((item) => item.category === 'candles');
    const havdalah = data.items?.find((item) => item.category === 'havdalah');
    return {
      location: data.location?.title || 'Five Towns',
      candleLighting: candle?.date || null,
      candleTitle: candle?.title || 'Candle lighting',
      havdalah: havdalah?.date || null,
      havdalahTitle: havdalah?.title || 'Havdalah',
      parsha: data.items?.find((item) => item.category === 'parashat')?.title || null,
    };
  } catch {
    return null;
  }
}

/**
 * Format a time string (ISO or HH:MM:SS) as 12-hour time.
 */
export function formatZmanTime(timeStr) {
  if (!timeStr) return '—';
  try {
    const d = new Date(timeStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return timeStr;
  }
}

/**
 * Hebrew month names (Tishrei=1 … Adar II=13)
 */
export const HEBREW_MONTHS = [
  '', 'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
  'Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul', 'Adar II'
];
