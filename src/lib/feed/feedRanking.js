import { CalendarDays, Car, Handshake, MessageCircle, Store } from 'lucide-react';

export const FEED_LOAD_TIMEOUT_MS = 4500;
export const withFeedTimeout = (promise, ms = FEED_LOAD_TIMEOUT_MS) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Feed request timed out')), ms);
  }),
]);
export const getPostLivePriority = (post) => {
  const text = `${post.title || ''} ${post.body || ''} ${post.post_subtype || ''}`.toLowerCase();
  const created = new Date(post.created_date || post.created_at || post.updated_date || Date.now()).getTime();
  const ageHours = Math.max(0, (Date.now() - created) / 3600000);
  let score = 0;

  if (post.type === 'help' || post.board === 'help' || /urgent|need|ride|meal|help|tonight|today/.test(text)) score += 80;
  if (post.type === 'event' || post.event_date) {
    const eventTime = new Date(post.event_date || post.created_date || Date.now()).getTime();
    const hoursUntil = (eventTime - Date.now()) / 3600000;
    if (hoursUntil >= 0 && hoursUntil <= 12) score += 70;
    else score += 35;
  }
  if (/tonight|today|now|soon|before shabbos|ending/.test(text)) score += 45;
  if (ageHours < 2) score += 25;
  else if (ageHours < 8) score += 12;
  score += Math.min(35, Number(post.comments_count || 0) * 2 + Number(post.likes_count || 0));

  return score;
};
export const postDate = (post) => post?.updated_date || post?.updated_at || post?.created_date || post?.created_at;

export const formatPostAge = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(time)) return 'Just now';
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
};

export const feedText = (post) => post?.title || post?.body || 'Community update';

export const feedBody = (post) => {
  const body = post?.body || post?.description || '';
  if (post?.title && body.toLowerCase().trim() === post.title.toLowerCase().trim()) return '';
  return body;
};

export const matchesText = (post, pattern) => pattern.test(`${post?.type || ''} ${post?.post_subtype || ''} ${post?.title || ''} ${post?.body || ''} ${post?.community_name || ''}`);

export const postText = (post) => `${post?.type || ''} ${post?.post_subtype || ''} ${post?.title || ''} ${post?.body || ''} ${post?.community_name || ''} ${post?.location_text || ''}`.toLowerCase();

export const getEventTimeLabel = (post) => {
  const rawDate = post?.event_date || post?.starts_at || post?.needed_by || post?.deadline;
  if (!rawDate) return null;
  const time = new Date(rawDate).getTime();
  if (!Number.isFinite(time)) return null;
  const deltaMinutes = Math.round((time - Date.now()) / 60000);
  let clock = '';
  try {
    clock = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(time));
  } catch {
    return null; // date is out of Intl range (e.g. year 0001 from bad DB value)
  }
  if (deltaMinutes <= 0) return 'Happening now';
  if (deltaMinutes < 60) return `Starts in ${deltaMinutes} min`;
  if (deltaMinutes < 180) return `Starts at ${clock}`;
  if (deltaMinutes < 1440) return `Today at ${clock}`;
  return `Upcoming ${clock}`;
};

export const getAliveCue = (post) => {
  const text = postText(post);
  const timeLabel = getEventTimeLabel(post);
  if (/minyan|maariv|mincha|shacharis/.test(text)) return timeLabel || 'Minyan needs people';
  if (/ride|carpool|pickup|jfk|seat|drive/.test(text)) return 'Ride available';
  if (post?.type === 'event' || /event|shiur|game|meetup|class|tonight/.test(text)) return timeLabel || 'Event coming up';
  if (post?.type === 'help' || /need|help|volunteer|meal|chesed|favor|urgent/.test(text)) return 'Volunteer request';
  if (/business|restaurant|shop|menu|opening|sale|marketplace/.test(text)) return 'Local business update';
  if (/recommend|best|where|anyone|question|looking/.test(text)) return 'Neighbor question';
  return 'Open discussion';
};

export const getCardIntent = (post) => {
  const text = postText(post);
  if (post?.type === 'help' || /need|help|meal|ride|chesed|urgent|favor|tehillim|volunteer/.test(text)) {
    return { label: 'Help needed', cta: "I'll help", tone: 'red', icon: Handshake };
  }
  if (/carpool|ride|drive|seat|pickup|jfk/.test(text)) {
    return { label: 'Carpool', cta: 'Join', tone: 'blue', icon: Car };
  }
  if (post?.type === 'event' || post?.event_date || /event|shiur|tonight|meetup|game|cleanup/.test(text)) {
    return { label: 'Event', cta: 'RSVP', tone: 'orange', icon: CalendarDays };
  }
  if (/business|restaurant|shop|marketplace|menu|sale|free|pickup|borrow/.test(text)) {
    return { label: 'Local listing', cta: 'Message', tone: 'teal', icon: Store };
  }
  if (/question|rec|recommend|looking|where|anyone|best/.test(text)) {
    return { label: 'Question', cta: 'Reply', tone: 'purple', icon: MessageCircle };
  }
  return { label: 'Local post', cta: 'Reply', tone: 'slate', icon: MessageCircle };
};

export const toneClasses = {
  red: {
    pill: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
    cta: 'text-red-700',
    bar: 'from-red-500 to-orange-400',
  },
  orange: {
    pill: 'border-orange-200 bg-orange-50 text-orange-700',
    dot: 'bg-orange-500',
    cta: 'text-orange-700',
    bar: 'from-orange-500 to-amber-400',
  },
  teal: {
    pill: 'border-teal-200 bg-teal-50 text-teal-700',
    dot: 'bg-teal-500',
    cta: 'text-teal-700',
    bar: 'from-teal-500 to-emerald-400',
  },
  blue: {
    pill: 'border-blue-200 bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
    cta: 'text-blue-700',
    bar: 'from-blue-500 to-indigo-500',
  },
  purple: {
    pill: 'border-violet-200 bg-violet-50 text-violet-700',
    dot: 'bg-violet-500',
    cta: 'text-violet-700',
    bar: 'from-violet-500 to-fuchsia-500',
  },
  slate: {
    pill: 'border-slate-200 bg-slate-50 text-slate-700',
    dot: 'bg-slate-400',
    cta: 'text-blue-700',
    bar: 'from-blue-500 to-indigo-500',
  },
};
