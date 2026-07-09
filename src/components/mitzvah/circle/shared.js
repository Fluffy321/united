import {
  Car,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  HandHeart,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

export const CATEGORIES = [
  'Transportation',
  'Errands',
  'Food / Meals',
  'Simcha Help',
  'Shul Help',
  'Tutoring',
  'Elderly Support',
  'Babysitting',
  'Tech Help',
  'Other',
];

export const CATEGORY_GROUPS = [
  {
    id: 'all',
    label: 'All Needs',
    shortLabel: 'All',
    description: 'Every open mitzvah request',
    categories: null,
    icon: HandHeart,
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  {
    id: 'meals',
    label: 'Meals',
    shortLabel: 'Meals',
    description: 'Food, meals, and hospitality',
    categories: ['Food / Meals'],
    icon: Utensils,
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  {
    id: 'rides',
    label: 'Rides',
    shortLabel: 'Rides',
    description: 'Rides, pickup, and carpool help',
    categories: ['Transportation'],
    icon: Car,
    tone: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  {
    id: 'errands',
    label: 'Errands',
    shortLabel: 'Errands',
    description: 'Shopping, pickup, and quick favors',
    categories: ['Errands'],
    icon: ShoppingBag,
    tone: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  {
    id: 'care',
    label: 'Care & Check-ins',
    shortLabel: 'Care',
    description: 'Visits, elderly support, and babysitting',
    categories: ['Elderly Support', 'Babysitting'],
    icon: Users,
    tone: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  {
    id: 'hands_on',
    label: 'Hands-On Help',
    shortLabel: 'Hands-On',
    description: 'Shul, simcha, setup, and physical help',
    categories: ['Simcha Help', 'Shul Help'],
    icon: HandHeart,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  {
    id: 'skills',
    label: 'Learning & Tech',
    shortLabel: 'Skills',
    description: 'Tutoring, tech help, and skill-based chesed',
    categories: ['Tutoring', 'Tech Help'],
    icon: GraduationCap,
    tone: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  },
  {
    id: 'other',
    label: 'Other Chesed',
    shortLabel: 'Other',
    description: 'Everything else the community can help with',
    categories: ['Other'],
    icon: Sparkles,
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
  },
];

export const getCategoryGroup = (groupId) =>
  CATEGORY_GROUPS.find((group) => group.id === groupId) || CATEGORY_GROUPS[0];

export const requestMatchesCategoryGroup = (request, groupId) => {
  const group = getCategoryGroup(groupId);
  return !group.categories || group.categories.includes(request.category);
};

export const MITZVAH_MAP_LOCATION_FALLBACKS = {
  cedarhurst: { lat: 40.6224, lng: -73.7268, label: 'Cedarhurst' },
  lawrence: { lat: 40.6134, lng: -73.7302, label: 'Lawrence' },
  woodmere: { lat: 40.6326, lng: -73.7162, label: 'Woodmere' },
  hewlett: { lat: 40.6412, lng: -73.7012, label: 'Hewlett' },
  inwood: { lat: 40.6223, lng: -73.7462, label: 'Inwood' },
  'five towns': { lat: 40.6249, lng: -73.7178, label: 'Five Towns' },
};

export const STATUSES = {
  OPEN:      'Open',
  OFFERED:   'Offered',
  ACCEPTED:  'Accepted',
  IN_PROG:   'In Progress',
  PENDING:   'Pending Verify',
  VERIFIED:  'Verified',
  CANCELLED: 'Cancelled',
};

// Normalize lowercase DB status values to the title-case UI values.
export const DB_TO_UI_STATUS = {
  open:                STATUSES.OPEN,
  offered:             STATUSES.OFFERED,
  volunteer_offered:   STATUSES.OFFERED,
  accepted:            STATUSES.ACCEPTED,
  in_progress:         STATUSES.IN_PROG,
  pending_verify:      STATUSES.PENDING,
  pending_verification: STATUSES.PENDING,
  verified:            STATUSES.VERIFIED,
  completed:           STATUSES.VERIFIED,
  cancelled:           STATUSES.CANCELLED,
  closed:              STATUSES.CANCELLED,
  // Legacy title-case values from old local-state
  Open:       STATUSES.OPEN,
  Offered:    STATUSES.OFFERED,
  Accepted:   STATUSES.ACCEPTED,
  'In Progress': STATUSES.IN_PROG,
  Claimed:    STATUSES.ACCEPTED,
  Completed:  STATUSES.VERIFIED,
  Cancelled:  STATUSES.CANCELLED,
};

export const REQUEST_EXPIRY_DAYS = 7;
export const REQUEST_EXPIRY_MS = REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// Single source of truth for the workflow tabs — both the VALID_VIEWS whitelist
// and the tab-bar UI derive from this so they can't drift out of sync (see
// junited-self-check Check 6: a tab offered in the UI but missing from the
// whitelist silently bounces users to the default tab).
export const WORKFLOW_TABS = [
  { id: 'browse', label: 'Needs' },
  { id: 'rides', label: 'Rides' },
  { id: 'mine', label: 'My activity' },
  { id: 'completed', label: 'Completed' },
];

export const VALID_VIEWS = WORKFLOW_TABS.map((tab) => tab.id);

export const normalizeUrgency = (value) => {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('urgent') || raw === 'high') return 'Urgent';
  if (raw.includes('today') || raw === 'medium') return 'Today';
  return 'Flexible';
};

export const resolveMapLocation = (neighborhood = '') => {
  const key = Object.keys(MITZVAH_MAP_LOCATION_FALLBACKS).find((place) =>
    String(neighborhood || '').toLowerCase().includes(place)
  );
  return MITZVAH_MAP_LOCATION_FALLBACKS[key || 'five towns'];
};

export const getCreatedTime = (request) => {
  const time = new Date(request.created_at || request.created_date || request.updated_at || Date.now()).getTime();
  return Number.isFinite(time) ? time : Date.now();
};

export const isRequestExpired = (request) => {
  const explicitExpiry = request.expires_at || request.expiresAt;
  if (explicitExpiry) {
    const expiryTime = new Date(explicitExpiry).getTime();
    if (Number.isFinite(expiryTime)) return expiryTime <= Date.now();
  }
  return Date.now() - getCreatedTime(request) >= REQUEST_EXPIRY_MS;
};

export const getUrgencyInfo = (request) => {
  const urgency = normalizeUrgency(request.urgency);
  const created = getCreatedTime(request);
  const now = Date.now();
  const tonight = new Date(now);
  tonight.setHours(22, 0, 0, 0);
  if (tonight.getTime() < now) tonight.setDate(tonight.getDate() + 1);

  const dueAt = urgency === 'Urgent'
    ? created + 2 * 60 * 60 * 1000
    : urgency === 'Today'
      ? tonight.getTime()
      : null;

  const remainingMs = dueAt ? Math.max(0, dueAt - now) : null;
  const remainingHours = remainingMs === null ? null : Math.max(1, Math.ceil(remainingMs / 3600000));
  const overdue = remainingMs === 0;

  if (urgency === 'Urgent') {
    return {
      label: 'Urgent',
      tone: 'border-red-200 bg-red-50 text-red-700',
      dot: 'bg-red-500',
      detail: overdue ? 'Needed now' : `Happening in ${remainingHours} hour${remainingHours === 1 ? '' : 's'}`,
      remaining: overdue ? 'Act now' : `${remainingHours}h left`,
    };
  }

  if (urgency === 'Today') {
    return {
      label: 'Today',
      tone: 'border-orange-200 bg-orange-50 text-orange-700',
      dot: 'bg-orange-500',
      detail: 'Needed by tonight',
      remaining: overdue ? 'Tonight' : `${remainingHours}h left`,
    };
  }

  return {
    label: 'Flexible',
    tone: 'border-slate-200 bg-slate-50 text-slate-600',
    dot: 'bg-slate-400',
    detail: 'Flexible timing',
    remaining: 'No rush',
  };
};

export const normalizeRequest = (row) => {
  if (!row) return row;
  return {
    ...row,
    status: DB_TO_UI_STATUS[row.status] || row.status || STATUSES.OPEN,
    poster_id: row.requester_id || row.created_by_user_id,
    postedById: row.requester_id || row.created_by_user_id,
    poster_name: row.requester_name || row.created_by_name || 'Community member',
    postedBy: row.requester_name || row.created_by_name || 'Community member',
    neighborhood: row.neighborhood || row.location_label || row.locationLabel || 'Five Towns',
    estimatedHours: parseFloat(row.estimated_hours || row.estimatedHours || 1),
    urgency: normalizeUrgency(row.urgency),
    accepted_volunteer_id: row.claimed_by_user_id,
  };
};

export const normalizeOffer = (row) => {
  if (!row) return row;
  return {
    ...row,
    requestId: row.request_id,
    volunteerId: row.volunteer_id || row.user_id,
    volunteerName: row.volunteer_name || row.user_name || 'Volunteer',
  };
};

const extractRideDetail = (description = '', label) => {
  const match = String(description).match(new RegExp(`${label}:\\s*([^|]+)`, 'i'));
  return match?.[1]?.trim() || '';
};

export const normalizeCarpoolRide = (request) => ({
  ...request,
  locationLabel: request.location_label || request.locationLabel || request.neighborhood || 'Five Towns',
  pickup_window: request.pickup_window || extractRideDetail(request.description, 'Pickup') || 'Coordinate time',
  direction: request.ride_direction || extractRideDetail(request.description, 'Type').toLowerCase() || 'needed',
});

export const getRequestProgress = (request, helperCount) => {
  const text = `${request.title || ''} ${request.description || ''} ${request.category || ''}`.toLowerCase();
  const explicitTarget = Number(request.goal_count || request.target_count || request.volunteers_needed || request.seats_needed || request.meals_needed);
  const firstNumber = Number((text.match(/\b(\d+)\b/) || [])[1]);
  const inferredTarget = Number.isFinite(explicitTarget) && explicitTarget > 0
    ? explicitTarget
    : Number.isFinite(firstNumber) && firstNumber > 1
      ? firstNumber
      : /meal|food|dinner|lunch|supper|shabbos/.test(text)
        ? 5
        : /ride|carpool|seat|drive|pickup/.test(text)
          ? 1
          : 3;
  const target = Math.max(1, Math.min(inferredTarget, 20));
  const filled = Math.min(helperCount, target);
  const remaining = Math.max(0, target - filled);
  const percent = Math.round((filled / target) * 100);

  if (/meal|food|dinner|lunch|supper|shabbos/.test(text)) {
    return {
      filled,
      target,
      remaining,
      percent,
      title: `${filled}/${target} meals covered`,
      detail: remaining === 0 ? 'Meals fully covered' : `${remaining} meal${remaining === 1 ? '' : 's'} still needed`,
      tone: 'emerald',
    };
  }

  if (/ride|carpool|seat|drive|pickup/.test(text)) {
    return {
      filled,
      target,
      remaining,
      percent,
      title: remaining === 0 ? 'Ride covered' : `Ride still needs ${remaining} seat${remaining === 1 ? '' : 's'}`,
      detail: `${filled}/${target} seat${target === 1 ? '' : 's'} covered`,
      tone: 'blue',
    };
  }

  return {
    filled,
    target,
    remaining,
    percent,
    title: `${filled}/${target} volunteers found`,
    detail: remaining === 0 ? 'Volunteer goal complete' : `${remaining} more helper${remaining === 1 ? '' : 's'} needed`,
    tone: 'violet',
  };
};

export const getHelpCta = (request) => {
  const options = ["I'll help", 'Count me in', 'I can take this'];
  const seed = String(request.id || request.title || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return options[seed % options.length];
};

export const getApproxDistance = (request) => {
  const text = `${request.neighborhood || ''} ${request.location_label || ''} ${request.locationLabel || ''}`.toLowerCase();
  if (text.includes('cedarhurst')) return '0.5 miles away';
  if (text.includes('woodmere')) return '1.2 miles away';
  if (text.includes('lawrence')) return '1.6 miles away';
  if (text.includes('hewlett')) return '2.1 miles away';
  if (text.includes('inwood')) return '2.8 miles away';
  return 'Nearby';
};

export const getUpdatedLabel = (request) => {
  const updatedAt = request.updated_at || request.updated_date || request.created_at || request.created_date;
  if (!updatedAt) return 'Updated just now';
  const minutes = Math.max(1, Math.round((Date.now() - new Date(updatedAt).getTime()) / 60000));
  if (!Number.isFinite(minutes) || minutes < 2) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`;
};

export const getUrgencyHeadline = (request, urgencyInfo) => {
  const text = `${request.title || ''} ${request.description || ''} ${request.category || ''}`.toLowerCase();
  if (/meal|food|dinner|supper|lunch|shabbos|challah/.test(text)) {
    if (urgencyInfo.label === 'Urgent') return 'Need food in next 30 min';
    if (urgencyInfo.label === 'Today') return 'Dinner needed tonight';
    return 'Meal help needed';
  }
  if (/ride|carpool|seat|drive|pickup|airport/.test(text)) {
    if (urgencyInfo.label === 'Urgent') return 'Ride needed soon';
    if (urgencyInfo.label === 'Today') return 'Ride needed today';
    return 'Ride help requested';
  }
  if (/errand|pickup|store|pharmacy|delivery/.test(text)) {
    if (urgencyInfo.label === 'Urgent') return 'Errand needed right away';
    if (urgencyInfo.label === 'Today') return 'Errand needed today';
    return 'Errand help requested';
  }
  if (urgencyInfo.label === 'Urgent') return 'Community need right now';
  if (urgencyInfo.label === 'Today') return 'Help needed today';
  return 'Flexible mitzvah opportunity';
};

export const getPrimaryActionLabel = (request, fallback) => {
  const text = `${request.title || ''} ${request.description || ''} ${request.category || ''}`.toLowerCase();
  if (/meal|food|dinner|supper|lunch|shabbos|challah/.test(text)) return 'Bring food';
  if (/ride|carpool|seat|drive|pickup|airport/.test(text)) return "I'll drive";
  if (/errand|pickup|store|pharmacy|delivery/.test(text)) return 'Run errand';
  return fallback || 'Take this mitzvah';
};

export const STATUS_CONFIGS = {
  [STATUSES.OPEN]:      { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: HandHeart,    label: 'Open' },
  [STATUSES.OFFERED]:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',          Icon: Eye,          label: 'Offered' },
  [STATUSES.ACCEPTED]:  { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',    Icon: UserCheck,    label: 'Accepted' },
  [STATUSES.IN_PROG]:   { cls: 'bg-amber-50 text-amber-700 border-amber-200',       Icon: Clock,        label: 'In Progress' },
  [STATUSES.PENDING]:   { cls: 'bg-purple-50 text-purple-700 border-purple-200',    Icon: ShieldCheck,  label: 'Pending Verify' },
  [STATUSES.VERIFIED]:  { cls: 'bg-slate-950 text-white border-slate-950',          Icon: CheckCircle2, label: 'Verified' },
  [STATUSES.CANCELLED]: { cls: 'bg-slate-100 text-slate-500 border-slate-200',      Icon: X,            label: 'Cancelled' },
};
