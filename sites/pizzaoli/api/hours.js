// Opening hours, shared by the ordering page and the checkout function.
// Close times are in minutes and may run past 1440 — 2 AM is 1560.

export const SCHEDULE = {
  Sun: [840, 1560],   // 2:00 PM – 2:00 AM
  Mon: [840, 1560],
  Tue: [840, 1560],
  Wed: [840, 1560],
  Thu: [840, 1560],
  Fri: [720, 960],    // 12:00 PM – 4:00 PM
  Sat: [1320, 1560]   // Motzei Shabbos, 10:00 PM – 2:00 AM
};

const ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmt(m) {
  m = m % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12; if (!h12) h12 = 12;
  return h12 + (mm ? ':' + String(mm).padStart(2, '0') : '') + ' ' + ap;
}

export function nowInShopTime(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(date || new Date());
  const o = {};
  parts.forEach(function (p) { o[p.type] = p.value; });
  return { day: o.weekday, mins: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
}

export function shopStatus(date) {
  const n = nowInShopTime(date);
  const i = ORDER.indexOf(n.day);

  const today = SCHEDULE[n.day];
  if (today && n.mins >= today[0] && n.mins < Math.min(today[1], 1440)) {
    return { open: true, closesAt: fmt(today[1]), next: 'open until ' + fmt(today[1]) };
  }

  // Yesterday's window may still be running past midnight.
  const y = SCHEDULE[ORDER[(i + 6) % 7]];
  if (y && y[1] > 1440 && n.mins < y[1] - 1440) {
    return { open: true, closesAt: fmt(y[1]), next: 'open until ' + fmt(y[1]) };
  }

  for (let s = 0; s <= 7; s++) {
    const d = ORDER[(i + s) % 7], sc = SCHEDULE[d];
    if (!sc) continue;
    if (s === 0 && n.mins >= sc[0]) continue;
    const when = s === 0 ? '' : (s === 1 ? 'tomorrow ' : d + ' ');
    return { open: false, next: 'we open ' + when + fmt(sc[0]) };
  }
  return { open: false, next: 'see our hours' };
}
