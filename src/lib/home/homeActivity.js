const HOME_TIME_ZONE = 'America/New_York';
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

const localParts = (date, timeZone) => Object.fromEntries(
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
);

const dateKey = (value, timeZone) => {
  const literal = String(value || '').match(DATE_ONLY);
  if (literal) return `${literal[1]}-${literal[2]}-${literal[3]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = localParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const dateOrdinal = (key) => {
  const match = key.match(DATE_ONLY);
  return match ? Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86_400_000) : NaN;
};

const clockMinutes = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (meridiem === 'AM') hour %= 12;
  if (meridiem === 'PM') hour = (hour % 12) + 12;
  return hour * 60 + minute;
};

export const communityRoute = (id) => `/Communities?community=${encodeURIComponent(String(id || ''))}`;

export function buildCircleActivity({ communities = [], posts = [], limit = 3 } = {}) {
  const joinedById = new Map(communities.filter((item) => item?.id).map((item) => [String(item.id), item]));
  const latestByCommunity = new Map();

  [...posts]
    .filter((post) => joinedById.has(String(post?.community_id || '')))
    .sort((left, right) => new Date(right.updated_date || right.created_date || 0) - new Date(left.updated_date || left.created_date || 0))
    .forEach((post) => {
      const communityId = String(post.community_id);
      if (!latestByCommunity.has(communityId)) latestByCommunity.set(communityId, post);
    });

  const active = [...latestByCommunity.entries()].slice(0, limit).map(([communityId, post]) => ({
    community: joinedById.get(communityId),
    post,
    href: communityRoute(communityId),
  }));

  return {
    active,
    quiet: active.length ? [] : communities.slice(0, limit).map((community) => ({
      community,
      href: communityRoute(community.id),
    })),
  };
}

export function buildHomeEventWindow({
  events = [],
  now = new Date(),
  timeZone = HOME_TIME_ZONE,
  limit = 3,
} = {}) {
  const nowParts = localParts(now, timeZone);
  const todayKey = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
  const todayOrdinal = dateOrdinal(todayKey);
  const nowMinutes = Number(nowParts.hour) * 60 + Number(nowParts.minute);

  const candidates = events.map((event, index) => {
    const key = dateKey(event?.event_date || event?.start_date, timeZone);
    const ordinal = dateOrdinal(key);
    return {
      event,
      index,
      key,
      ordinal,
      startMinutes: clockMinutes(event?.event_time || event?.start_time) ?? Number.MAX_SAFE_INTEGER,
      endMinutes: clockMinutes(event?.event_end_time || event?.end_time),
    };
  }).filter(({ event, ordinal, key, endMinutes }) => (
    event?.type === 'event'
    && Number.isFinite(ordinal)
    && ordinal >= todayOrdinal
    && ordinal <= todayOrdinal + 7
    && !(key === todayKey && endMinutes !== null && endMinutes < nowMinutes)
  )).sort((left, right) => (
    left.ordinal - right.ordinal
    || left.startMinutes - right.startMinutes
    || left.index - right.index
  ));

  const tonight = candidates.filter((item) => item.key === todayKey);
  if (tonight.length) return { mode: 'tonight', items: tonight.slice(0, limit).map((item) => item.event) };
  if (candidates.length) return { mode: 'upcoming', items: candidates.slice(0, limit).map((item) => item.event) };
  return { mode: 'empty', items: [] };
}
