/**
 * Hebrew date utilities using the Hebcal API.
 * All functions return promises.
 */

const HEBCAL_BASE = 'https://www.hebcal.com';

function formatDateForTimeZone(date = new Date(), timeZone = 'America/New_York') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

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
export async function getZmanim(lat, lng, date = new Date(), tzid = 'America/New_York') {
  const dateStr = formatDateForTimeZone(date, tzid);
  try {
    const res = await fetch(
      `${HEBCAL_BASE}/zmanim?cfg=json&latitude=${lat}&longitude=${lng}&date=${dateStr}&tzid=${encodeURIComponent(tzid)}`
    );
    const data = await res.json();
    return data.times || null;
  } catch {
    return null;
  }
}

// Standard Ashkenazi candle-lighting offset (minutes before sunset).
// Used as the `b` parameter in Hebcal API calls.
export const CANDLE_LIGHTING_MINUTES = 18;
export const HAVDALAH_MINUTES = 50;

/**
 * Get candle-lighting and Havdalah times for any lat/lng.
 * tzid should be an IANA timezone string (e.g. 'America/New_York').
 */
export async function getShabbatTimes(lat, lng, tzid = 'America/New_York', date = new Date(), havdalahMinutes = HAVDALAH_MINUTES, offsetMinutes = CANDLE_LIGHTING_MINUTES) {
  const dateStr = formatDateForTimeZone(date, tzid);
  try {
    const res = await fetch(
      `${HEBCAL_BASE}/shabbat?cfg=json&geo=pos&latitude=${lat}&longitude=${lng}&tzid=${encodeURIComponent(tzid)}&m=${havdalahMinutes}&b=${offsetMinutes}&date=${dateStr}`
    );
    const data = await res.json();
    const items = data.items || [];

    // All candles/havdalah items sorted chronologically — needed for multi-day Yom Tov.
    // Hebcal's own b=18/m=havdalahMinutes params already compute these correctly
    // server-side, so we use its values directly rather than re-deriving them from
    // a second /zmanim call (which risks drift between the two endpoints).
    const allCandles  = items.filter(i => i.category === 'candles').sort((a, b) => new Date(a.date) - new Date(b.date));
    const allHavdalah = items.filter(i => i.category === 'havdalah').sort((a, b) => new Date(a.date) - new Date(b.date));

    // Major Yom Tov items for holiday labeling. Excludes "Erev X" (eve-of notices)
    // since we want the holiday name itself ("Shavuot I"), not the eve marker.
    const majorHolidays = items
      .filter(i => i.category === 'holiday' && i.subcat === 'major' && !i.title?.startsWith('Erev '))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      location: data.location?.title || null,
      // Scalar fields kept for backwards compat (shabbatReminderService etc.)
      candleLighting:        allCandles[0]?.date  || null,
      candleTitle:           allCandles[0]?.title || 'Candle lighting',
      havdalah:              allHavdalah[0]?.date  || null,
      havdalahTitle:         allHavdalah[0]?.title || 'Havdalah',
      parsha: items.find(i => i.category === 'parashat')?.title || null,
      candleLightingMinutes: offsetMinutes,
      // Full item arrays for multi-event weeks (2-day Yom Tov, holiday + Shabbat)
      allCandles,
      allHavdalah,
      majorHolidays,
    };
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
 * Get this week's parsha with the Torah leyning range for Sefaria text lookup.
 */
export async function getWeeklyParshaReading(date = new Date(), tzid = 'America/New_York') {
  const dateStr = formatDateForTimeZone(date, tzid);
  try {
    const res = await fetch(`${HEBCAL_BASE}/shabbat?cfg=json&geo=none&m=50&date=${dateStr}`);
    const data = await res.json();
    const parsha = data.items?.find(i => i.category === 'parashat');
    if (!parsha) return null;

    return {
      title: parsha.title,
      hebrew: parsha.hebrew,
      date: parsha.date,
      hdate: parsha.hdate,
      torah: parsha.leyning?.torah || null,
      aliyot: parsha.leyning || null,
      link: parsha.link,
    };
  } catch {
    return null;
  }
}

/**
 * Get the Daf Yomi for a given date from Hebcal.
 */
export async function getDafYomi(date = new Date(), tzid = 'America/New_York') {
  const dateStr = formatDateForTimeZone(date, tzid);
  try {
    const res = await fetch(
      `${HEBCAL_BASE}/hebcal?v=1&cfg=json&F=on&maj=off&min=off&mod=off&nx=off&ss=off&mf=off&start=${dateStr}&end=${dateStr}`
    );
    const data = await res.json();
    const daf = data.items?.find(i => i.category === 'dafyomi');
    if (!daf) return null;

    return {
      title: daf.title,
      hebrew: daf.hebrew,
      date: daf.date,
      hdate: daf.hdate,
      link: daf.link,
    };
  } catch {
    return null;
  }
}

/**
 * Get daily learning references from Hebcal without embedding source text.
 */
export async function getDailyLearning(date = new Date(), tzid = 'America/New_York') {
  const dateStr = formatDateForTimeZone(date, tzid);
  try {
    const res = await fetch(
      `${HEBCAL_BASE}/hebcal?v=1&cfg=json&F=on&myomi=on&dr1=on&maj=off&min=off&mod=off&nx=off&ss=off&mf=off&start=${dateStr}&end=${dateStr}`
    );
    const data = await res.json();
    const items = data.items || [];
    const byCategory = (category) => items.find(i => i.category === category) || null;

    return [
      { id: 'daf-yomi', label: 'Daf Yomi', item: byCategory('dafyomi') },
      { id: 'mishnah-yomi', label: 'Mishnah Yomi', item: byCategory('mishnayomi') },
      { id: 'daily-rambam', label: 'Daily Rambam', item: byCategory('dailyRambam1') },
    ].map(({ id, label, item }) => ({
      id,
      label,
      title: item?.title || null,
      hebrew: item?.hebrew || null,
      date: item?.date || dateStr,
      hdate: item?.hdate || null,
      link: item?.link || null,
      category: item?.category || null,
    }));
  } catch {
    return null;
  }
}

/**
 * Five Towns convenience wrapper — kept for backwards compatibility.
 * Prefer getShabbatTimes() for location-aware calls.
 */
export async function getFiveTownsShabbatTimes(date = new Date()) {
  return getShabbatTimes(40.6157, -73.7296, 'America/New_York', date);
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
 * Get a short English summary for the weekly parsha from Sefaria's topics API.
 * Returns null if the request fails or no description is available.
 */
export async function getParshaDescription(parshaTitle) {
  if (!parshaTitle) return null;
  // Convert "Parashat Pinchas" → "parashat-pinchas"
  const slug = parshaTitle.toLowerCase().replace(/\s+/g, '-');
  try {
    const res = await fetch(`https://www.sefaria.org/api/v2/topics/${slug}?with_html=0`);
    if (!res.ok) return null;
    const data = await res.json();
    const desc = data?.description?.en || data?.categoryDescription?.en || null;
    if (!desc) return null;
    // Trim to ~180 chars, end on a word boundary
    if (desc.length <= 180) return desc;
    return desc.slice(0, desc.lastIndexOf(' ', 180)) + '…';
  } catch {
    return null;
  }
}

/**
 * Get today's special Jewish calendar events (holidays, fasts, Rosh Chodesh, etc.)
 */
export async function getTodayEvents(date = new Date(), tzid = 'America/New_York') {
  const dateStr = formatDateForTimeZone(date, tzid);
  try {
    const res = await fetch(
      `${HEBCAL_BASE}/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&ss=on&mf=on&start=${dateStr}&end=${dateStr}&tzid=${encodeURIComponent(tzid)}`
    );
    const data = await res.json();
    return (data.items || []).filter(i => i.category !== 'dafyomi' && i.category !== 'mishnayomi');
  } catch {
    return [];
  }
}

/**
 * Hebrew month names (Tishrei=1 … Adar II=13)
 */
export const HEBREW_MONTHS = [
  '', 'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
  'Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul', 'Adar II'
];
