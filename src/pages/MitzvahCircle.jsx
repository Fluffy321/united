import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Award,
  Car,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  HandHeart,
  ListFilter,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Utensils,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { mitzvahService, notificationsService } from '@/services';
import { toast } from 'sonner';
import PageHelp from '@/components/common/PageHelp';
import CarpoolBoard from '@/components/mitzvah/CarpoolBoard';

const CATEGORIES = [
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

const CATEGORY_GROUPS = [
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

const getCategoryGroup = (groupId) =>
  CATEGORY_GROUPS.find((group) => group.id === groupId) || CATEGORY_GROUPS[0];

const requestMatchesCategoryGroup = (request, groupId) => {
  const group = getCategoryGroup(groupId);
  return !group.categories || group.categories.includes(request.category);
};

const MITZVAH_MAP_LOCATION_FALLBACKS = {
  cedarhurst: { lat: 40.6224, lng: -73.7268, label: 'Cedarhurst' },
  lawrence: { lat: 40.6134, lng: -73.7302, label: 'Lawrence' },
  woodmere: { lat: 40.6326, lng: -73.7162, label: 'Woodmere' },
  hewlett: { lat: 40.6412, lng: -73.7012, label: 'Hewlett' },
  inwood: { lat: 40.6223, lng: -73.7462, label: 'Inwood' },
  'five towns': { lat: 40.6249, lng: -73.7178, label: 'Five Towns' },
};

const STATUSES = {
  OPEN:      'Open',
  OFFERED:   'Offered',
  ACCEPTED:  'Accepted',
  IN_PROG:   'In Progress',
  PENDING:   'Pending Verify',
  VERIFIED:  'Verified',
  CANCELLED: 'Cancelled',
};

// Normalize lowercase DB status values to the title-case UI values.
const DB_TO_UI_STATUS = {
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

const UI_TO_DB_STATUS = {
  [STATUSES.OPEN]:      'open',
  [STATUSES.OFFERED]:   'offered',
  [STATUSES.ACCEPTED]:  'accepted',
  [STATUSES.IN_PROG]:   'in_progress',
  [STATUSES.PENDING]:   'pending_verify',
  [STATUSES.VERIFIED]:  'verified',
  [STATUSES.CANCELLED]: 'cancelled',
};

const normalizeUrgency = (value) => {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('urgent') || raw === 'high') return 'Urgent';
  if (raw.includes('today') || raw === 'medium') return 'Today';
  return 'Flexible';
};

const resolveMapLocation = (neighborhood = '') => {
  const key = Object.keys(MITZVAH_MAP_LOCATION_FALLBACKS).find((place) =>
    String(neighborhood || '').toLowerCase().includes(place)
  );
  return MITZVAH_MAP_LOCATION_FALLBACKS[key || 'five towns'];
};

const getCreatedTime = (request) => {
  const time = new Date(request.created_at || request.created_date || request.updated_at || Date.now()).getTime();
  return Number.isFinite(time) ? time : Date.now();
};

const getUrgencyInfo = (request) => {
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

const normalizeRequest = (row) => {
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

const normalizeOffer = (row) => {
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

const normalizeCarpoolRide = (request) => ({
  ...request,
  locationLabel: request.location_label || request.locationLabel || request.neighborhood || 'Five Towns',
  pickup_window: request.pickup_window || extractRideDetail(request.description, 'Pickup') || 'Coordinate time',
  direction: request.ride_direction || extractRideDetail(request.description, 'Type').toLowerCase() || 'needed',
});

const getRequestProgress = (request, helperCount) => {
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

const getHelpCta = (request) => {
  const options = ["I'll help", 'Count me in', 'I can take this'];
  const seed = String(request.id || request.title || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return options[seed % options.length];
};

const getApproxDistance = (request) => {
  const text = `${request.neighborhood || ''} ${request.location_label || ''} ${request.locationLabel || ''}`.toLowerCase();
  if (text.includes('cedarhurst')) return '0.5 miles away';
  if (text.includes('woodmere')) return '1.2 miles away';
  if (text.includes('lawrence')) return '1.6 miles away';
  if (text.includes('hewlett')) return '2.1 miles away';
  if (text.includes('inwood')) return '2.8 miles away';
  return 'Nearby';
};

const STATUS_CONFIGS = {
  [STATUSES.OPEN]:      { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: HandHeart,    label: 'Open' },
  [STATUSES.OFFERED]:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',          Icon: Eye,          label: 'Offered' },
  [STATUSES.ACCEPTED]:  { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',    Icon: UserCheck,    label: 'Accepted' },
  [STATUSES.IN_PROG]:   { cls: 'bg-amber-50 text-amber-700 border-amber-200',       Icon: Clock,        label: 'In Progress' },
  [STATUSES.PENDING]:   { cls: 'bg-purple-50 text-purple-700 border-purple-200',    Icon: ShieldCheck,  label: 'Pending Verify' },
  [STATUSES.VERIFIED]:  { cls: 'bg-slate-950 text-white border-slate-950',          Icon: CheckCircle2, label: 'Verified' },
  [STATUSES.CANCELLED]: { cls: 'bg-slate-100 text-slate-500 border-slate-200',      Icon: X,            label: 'Cancelled' },
};

function StatusPill({ status }) {
  const { cls, Icon, label } = STATUS_CONFIGS[status] || {
    cls: 'bg-slate-50 text-slate-600 border-slate-200',
    Icon: null,
    label: status,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${cls}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

function RequestCard({
  request,
  offers,
  comments = [],
  currentUser,
  onOffer,
  onAcceptOffer,
  onStart,
  onComplete,
  onVerify,
  onComment,
  onOpenMap,
  onQuickView,
  onUrgencyChange,
}) {
  const [discussionOpen, setDiscussionOpen] = React.useState(false);
  const [commentBody, setCommentBody] = React.useState('');
  const isPoster = request.poster_id === currentUser?.id;
  const acceptedOffer = offers.find(
    (o) => o.requestId === request.id && o.status === 'accepted'
  );
  const acceptedVolunteerId = acceptedOffer?.volunteerId || request.accepted_volunteer_id;
  const myOffer = offers.find(
    (o) => o.requestId === request.id && o.volunteerId === currentUser?.id
  );
  const isAcceptedVolunteer = acceptedVolunteerId === currentUser?.id;
  const canOffer = !isPoster && request.status === STATUSES.OPEN && !myOffer;
  const canStart = isAcceptedVolunteer && request.status === STATUSES.ACCEPTED;
  const canComplete = isAcceptedVolunteer && request.status === STATUSES.IN_PROG;
  const canVerify =
    isPoster &&
    acceptedVolunteerId !== currentUser?.id &&
    request.status === STATUSES.PENDING;
  const pendingOffers = offers.filter(
    (o) => o.requestId === request.id && o.status === 'offered'
  );
  const urgencyInfo = getUrgencyInfo(request);
  const helperOffers = offers.filter((o) => o.requestId === request.id);
  const helperNames = [...new Set(helperOffers.map((offer) => offer.volunteerName).filter(Boolean))];
  const savedOfferCount = Number(request.offers_count || request.helper_count || request.volunteer_count || 0);
  const visibleHelperCount = Math.max(helperOffers.length, Number.isFinite(savedOfferCount) ? savedOfferCount : 0);
  const helperPreviewNames = helperNames.length
    ? helperNames
    : Array.from({ length: Math.min(visibleHelperCount, 4) }, (_, index) => `Helper ${index + 1}`);
  const savedCommentCount = Number(request.comments_count || request.comment_count || request.replies_count || 0);
  const commentCount = Math.max(comments.length, Number.isFinite(savedCommentCount) ? savedCommentCount : 0);
  const progress = getRequestProgress(request, visibleHelperCount);
  const progressTone = {
    emerald: 'from-emerald-500 to-teal-500',
    blue: 'from-blue-500 to-sky-500',
    violet: 'from-violet-500 to-blue-500',
  }[progress.tone] || 'from-blue-500 to-sky-500';
  const helpCta = getHelpCta(request);
  const distanceLabel = getApproxDistance(request);
  const urgencyCardTone = {
    Urgent: 'border-red-200 bg-gradient-to-br from-red-50/80 via-white to-white',
    Today: 'border-orange-200 bg-gradient-to-br from-orange-50/80 via-white to-white',
    Flexible: 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white',
  }[urgencyInfo.label] || 'border-slate-200 bg-white';
  const urgencyRail = {
    Urgent: 'bg-red-500',
    Today: 'bg-orange-500',
    Flexible: 'bg-slate-400',
  }[urgencyInfo.label] || 'bg-slate-300';

  const submitComment = async (event) => {
    event.preventDefault();
    if (!commentBody.trim()) return;
    await onComment?.(request, commentBody.trim());
    setCommentBody('');
    setDiscussionOpen(true);
  };

  const handleCardClick = (event) => {
    if (!onOpenMap) return;
    if (event.target.closest('button, input, textarea, select, a')) return;
    onOpenMap(request);
  };

  const canAdjustUrgency = Boolean(isPoster && onUrgencyChange && ![STATUSES.VERIFIED, STATUSES.CANCELLED].includes(request.status));

  return (
    <article
      className={`relative cursor-pointer overflow-hidden rounded-[26px] border p-4 shadow-sm transition hover:shadow-md ${urgencyCardTone}`}
      onClick={handleCardClick}
      role={onOpenMap ? 'button' : undefined}
      tabIndex={onOpenMap ? 0 : undefined}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${urgencyRail}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-black text-slate-700 shadow-sm">
              {request.category}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${urgencyInfo.tone}`}>
              <span className={`h-2 w-2 rounded-full ${urgencyInfo.dot}`} />
              {urgencyInfo.label}
            </span>
            <StatusPill status={request.status} />
          </div>
          {canAdjustUrgency && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {['Urgent', 'Today', 'Flexible'].map((level) => {
                const selected = urgencyInfo.label === level;
                const levelClass = {
                  Urgent: selected ? 'border-red-500 bg-red-600 text-white' : 'border-red-200 bg-red-50 text-red-700',
                  Today: selected ? 'border-orange-500 bg-orange-500 text-white' : 'border-orange-200 bg-orange-50 text-orange-700',
                  Flexible: selected ? 'border-slate-500 bg-slate-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-600',
                }[level];
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onUrgencyChange(request.id, level)}
                    className={`motion-press rounded-full border px-3 py-1.5 text-[12px] font-black transition ${levelClass}`}
                    aria-pressed={selected}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          )}
          <h2 className="text-[18px] font-black leading-snug text-slate-950">{request.title}</h2>
          <p className="mt-2 line-clamp-3 text-[13px] font-medium leading-5 text-slate-600">
            {request.description}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-[0.9fr_1.1fr]">
            <div className={`rounded-2xl border px-3 py-2 ${urgencyInfo.tone}`}>
              <p className="flex items-center gap-2 text-[12px] font-black">
                <Clock className="h-4 w-4" />
                {urgencyInfo.label}: {urgencyInfo.detail}
              </p>
              <p className="mt-0.5 text-[11px] font-black opacity-80">{urgencyInfo.remaining}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white/85 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-black text-slate-950">{progress.title}</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{progress.detail}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">
                  {progress.percent}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${progressTone} transition-all duration-300`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          </div>

          {request.status === STATUSES.VERIFIED && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-3 py-2.5">
              <span className="text-base">⛓️</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                  Chesed Chain
                </p>
                <p className="text-[12px] font-semibold leading-5 text-emerald-900">
                  {request.estimatedHours}h contributed to the community
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1.5">
              <div className="flex -space-x-2">
                {helperPreviewNames.length > 0 ? helperPreviewNames.slice(0, 4).map((name) => (
                  <span
                    key={name}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-black text-white"
                    title={name}
                  >
                    {name.charAt(0).toUpperCase()}
                  </span>
                )) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-black text-slate-500">
                    +
                  </span>
                )}
              </div>
              <span className="text-[12px] font-black text-slate-700">
                {visibleHelperCount} {visibleHelperCount === 1 ? 'person offered help' : 'people offered help'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDiscussionOpen((value) => !value)}
              className="motion-press inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-black text-slate-600"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
            <button
              type="button"
              onClick={() => onOpenMap?.(request)}
              className="motion-press inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[12px] font-black text-blue-700"
            >
              <MapPin className="h-3.5 w-3.5" />
              {distanceLabel}
            </button>
          </div>
        </div>

        {onQuickView && (
          <button
            onClick={() => onQuickView(request)}
            className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 p-2 text-slate-400 transition-all hover:bg-slate-100 active:scale-95"
            title="Quick view"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] font-semibold text-slate-600 sm:grid-cols-4">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <MapPin className="h-3.5 w-3.5" />
          {distanceLabel}
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <Clock className="h-3.5 w-3.5" />
          {request.estimatedHours} hrs
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          {urgencyInfo.detail}
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <Users className="h-3.5 w-3.5" />
          {request.poster_name}
        </div>
      </div>

      {isPoster && pendingOffers.length > 0 && (
        <div className="mt-3 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-[12px] font-black uppercase text-blue-700">Volunteer offers</p>
          {pendingOffers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-2">
              <div className="min-w-0">
                <p className="text-[13px] font-black text-slate-950">{offer.volunteerName}</p>
                {offer.note && (
                  <p className="truncate text-[12px] font-medium text-slate-500">{offer.note}</p>
                )}
              </div>
              <button
                onClick={() => onAcceptOffer(request.id, offer.id, offer.volunteerId)}
                className="app-button-primary min-h-9 shrink-0 rounded-lg px-3 py-0 text-[12px]"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canOffer && (
          <button
            onClick={() => onOffer(request)}
            className="chesed-cta-pulse app-button-primary h-10 px-4 text-[13px]"
            style={{ background: '#556B2F' }}
          >
            <HandHeart className="h-4 w-4" />
            {helpCta}
          </button>
        )}
        {onOpenMap && (
          <button
            type="button"
            onClick={() => onOpenMap(request)}
            className="motion-press inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-[13px] font-black text-blue-700"
          >
            <MapPin className="h-4 w-4" />
            Open on map
          </button>
        )}
        {myOffer && myOffer.status === 'offered' && (
          <span className="inline-flex h-10 items-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-[13px] font-black text-blue-700">
            Offer sent ✓
          </span>
        )}
        {canStart && (
          <button
            onClick={() => onStart(request.id)}
            className="app-button-primary h-10 bg-indigo-600 px-4 text-[13px] hover:bg-indigo-700"
          >
            <UserCheck className="h-4 w-4" />
            Start Task
          </button>
        )}
        {canComplete && (
          <button
            onClick={() => onComplete(request.id)}
            className="app-button-primary h-10 bg-purple-600 px-4 text-[13px] hover:bg-purple-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Completed
          </button>
        )}
        {canVerify && (
          <button
            onClick={() => onVerify(request.id)}
            className="app-button-primary h-10 bg-emerald-600 px-4 text-[13px] hover:bg-emerald-700"
          >
            <ShieldCheck className="h-4 w-4" />
            Verify Completion
          </button>
        )}
        {isPoster && acceptedVolunteerId === currentUser?.id && request.status === STATUSES.PENDING && (
          <span className="inline-flex h-10 items-center rounded-xl border border-red-200 bg-red-50 px-4 text-[13px] font-black text-red-700">
            Cannot verify your own hours
          </span>
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
        <button
          type="button"
          onClick={() => setDiscussionOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="inline-flex items-center gap-2 text-[13px] font-black text-slate-800">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            Discussion
          </span>
          <span className="text-[12px] font-black text-slate-500">
            {commentCount > 0 ? `${commentCount} replies` : 'Start one'}
          </span>
        </button>

        {discussionOpen && (
          <div className="mt-3 space-y-2">
            {comments.length > 0 ? (
              comments.slice(-4).map((comment) => (
                <div key={comment.id} className="flex gap-2 rounded-2xl bg-white p-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[12px] font-black text-blue-700">
                    {comment.author_avatar_url ? (
                      <img src={comment.author_avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (comment.author_name || 'C').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-slate-800">{comment.author_name || 'Community member'}</p>
                    <p className="text-[12px] font-semibold leading-5 text-slate-600">{comment.body}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-white px-3 py-2 text-[12px] font-semibold text-slate-500">
                Ask a detail, coordinate timing, or encourage the helper chain.
              </p>
            )}

            <form onSubmit={submitComment} className="flex gap-2">
              <input
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder="Add a comment..."
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={!commentBody.trim()}
                className="motion-press flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-40"
                aria-label="Post comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}

function CreateRequestModal({ open, onClose, onCreate, isLoading }) {
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: 'Other',
    neighborhood: 'Five Towns',
    estimatedHours: 1,
    urgency: 'Today',
    postToMap: true,
  });

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    onCreate(form);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 motion-soft-in"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl motion-page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4">
          <div>
            <p className="text-[12px] font-black uppercase text-blue-600">New request</p>
            <h2 className="text-xl font-black text-slate-950">Post help needed</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="motion-stagger flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold text-slate-700">Title</span>
            <input
              autoFocus
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Example: Pick up groceries for elderly neighbor"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold text-slate-700">Description</span>
            <textarea
              required
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Describe what help is needed and any relevant details"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Category</span>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Neighborhood</span>
              <input
                value={form.neighborhood}
                onChange={(e) => update('neighborhood', e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Est. hours</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.estimatedHours}
                onChange={(e) => update('estimatedHours', parseFloat(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
            </label>
            <div className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">Urgency</span>
              <div className="grid h-11 grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {[
                  ['Urgent', 'border-red-500 bg-red-600 text-white', 'border-red-200 bg-red-50 text-red-700'],
                  ['Today', 'border-orange-500 bg-orange-500 text-white', 'border-orange-200 bg-orange-50 text-orange-700'],
                  ['Flexible', 'border-slate-500 bg-slate-700 text-white', 'border-slate-200 bg-slate-100 text-slate-600'],
                ].map(([level, activeClass, idleClass]) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => update('urgency', level)}
                    className={`motion-press rounded-lg border text-[12px] font-black transition ${
                      form.urgency === level ? activeClass : idleClass
                    }`}
                    aria-pressed={form.urgency === level}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[12px] font-black text-slate-800">
              {form.urgency === 'Urgent'
                ? 'Happening soon. Shows red with a 2-hour action window.'
                : form.urgency === 'Today'
                  ? 'Needed by tonight. Shows orange so people know to act today.'
                  : 'Flexible timing. Shows gray with no rush.'}
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3">
            <input
              type="checkbox"
              checked={form.postToMap}
              onChange={(e) => update('postToMap', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-black text-blue-900">Post this request to the map</span>
              <span className="mt-0.5 block text-[12px] font-semibold leading-5 text-blue-700">
                People nearby can discover it on the map and tap in to help.
              </span>
            </span>
          </label>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-black text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="app-button-primary h-11 flex-1 text-[13px]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Request'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function CreateCarpoolModal({ mode, onClose, onCreate, isLoading }) {
  const [form, setForm] = React.useState({
    from: 'Cedarhurst',
    to: 'Woodmere',
    pickup: '8:00 AM',
    seats: mode === 'offer' ? 2 : 1,
    notes: '',
  });

  React.useEffect(() => {
    setForm({
      from: 'Cedarhurst',
      to: 'Woodmere',
      pickup: '8:00 AM',
      seats: mode === 'offer' ? 2 : 1,
      notes: '',
    });
  }, [mode]);

  if (!mode || typeof document === 'undefined') return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const isOffer = mode === 'offer';
  const title = isOffer ? 'Offer carpool seats' : 'Request a ride';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 motion-soft-in sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(form, mode);
        }}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl motion-page-enter"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase text-sky-700">Carpool</p>
              <h2 className="text-xl font-black text-slate-950">{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {[
            ['from', 'Pickup from'],
            ['to', 'Destination'],
            ['pickup', 'Pickup time'],
            ['seats', isOffer ? 'Seats available' : 'Seats needed'],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[13px] font-bold text-slate-700">{label}</span>
              <input
                required
                type={key === 'seats' ? 'number' : 'text'}
                min={key === 'seats' ? '1' : undefined}
                value={form[key]}
                onChange={(event) => update(key, key === 'seats' ? Number(event.target.value || 1) : event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
          ))}

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[13px] font-bold text-slate-700">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Car seats, luggage, flexibility, exact timing, or anything the rider should know"
            />
          </label>
        </div>

        <div className="flex gap-2 border-t border-slate-100 p-4">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-black text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="app-button-primary h-11 flex-1 text-[13px]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isOffer ? 'Post Offer' : 'Post Ride Need')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="app-card flex flex-col items-center gap-3 p-8 text-center">
      <HandHeart className="h-10 w-10 text-slate-300" />
      <div>
        <p className="font-black text-slate-950">{title}</p>
        {text && <p className="mt-1 text-[13px] text-slate-500">{text}</p>}
      </div>
    </div>
  );
}

function QuickViewSheet({ request, offers, comments = [], currentUser, onClose, onOffer, onOpenMap }) {
  if (!request || typeof document === 'undefined') return null;
  const myOffer = offers.find(
    (o) => o.requestId === request.id && o.volunteerId === currentUser?.id
  );
  const canOffer = request.poster_id !== currentUser?.id && request.status === STATUSES.OPEN && !myOffer;
  const helperOffers = offers.filter((o) => o.requestId === request.id);
  const savedOfferCount = Number(request.offers_count || request.helper_count || request.volunteer_count || 0);
  const visibleHelperCount = Math.max(helperOffers.length, Number.isFinite(savedOfferCount) ? savedOfferCount : 0);
  const savedCommentCount = Number(request.comments_count || request.comment_count || request.replies_count || 0);
  const commentCount = Math.max(comments.length, Number.isFinite(savedCommentCount) ? savedCommentCount : 0);
  const urgencyInfo = getUrgencyInfo(request);
  const progress = getRequestProgress(request, visibleHelperCount);
  const helpCta = getHelpCta(request);
  const distanceLabel = getApproxDistance(request);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 motion-soft-in sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl motion-page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <StatusPill status={request.status} />
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${urgencyInfo.tone}`}>
                <span className={`h-2 w-2 rounded-full ${urgencyInfo.dot}`} />
                {urgencyInfo.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                {request.category}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-950">{request.title}</h2>
            <p className="mt-2 text-[13px] text-slate-600">{request.description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          <div className={`rounded-2xl border px-3 py-2 ${urgencyInfo.tone}`}>
            <p className="flex items-center gap-2 text-[12px] font-black">
              <Clock className="h-4 w-4" />
              {urgencyInfo.detail}
            </p>
            <p className="mt-0.5 text-[11px] font-black opacity-80">{urgencyInfo.remaining}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-black text-slate-950">{progress.title}</p>
                <p className="text-[12px] font-semibold text-slate-500">{progress.detail}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">
                {progress.percent}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[12px] font-black">
            <span className="rounded-full bg-blue-50 px-2.5 py-1.5 text-blue-700">
              {visibleHelperCount} {visibleHelperCount === 1 ? 'person offered help' : 'people offered help'}
            </span>
            <span className="rounded-full bg-slate-50 px-2.5 py-1.5 text-slate-700">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
              {distanceLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {canOffer && (
            <button
              onClick={() => { onOffer(request); onClose(); }}
              className="chesed-cta-pulse app-button-primary h-10 flex-1 text-[13px]"
              style={{ background: '#556B2F' }}
            >
              <HandHeart className="h-4 w-4" />
              {helpCta}
            </button>
          )}
          {onOpenMap && (
            <button
              onClick={() => { onOpenMap(request); onClose(); }}
              className="h-10 flex-1 rounded-xl border border-blue-200 bg-blue-50 text-[13px] font-black text-blue-700 hover:bg-blue-100"
            >
              Open map
            </button>
          )}
          <button
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-slate-200 text-[13px] font-black text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: 'border-blue-100 bg-blue-50/80 text-blue-700',
    amber: 'border-amber-100 bg-amber-50/80 text-amber-700',
    emerald: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
  };
  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wide opacity-75">{label}</p>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-1 text-2xl font-black leading-none">{value}</p>
    </div>
  );
}


export default function MitzvahCircle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();

  const VALID_VIEWS = ['browse', 'offers', 'posted', 'completed'];
  const [activeView, setActiveView] = React.useState(() => {
    const tab = searchParams.get('tab');
    if (tab === 'open' || tab === 'carpool') return 'browse';
    return VALID_VIEWS.includes(tab) ? tab : 'browse';
  });
  const [activeCategory, setActiveCategory] = React.useState(() =>
    searchParams.get('tab') === 'carpool' ? 'rides' : 'all'
  );
  const [query, setQuery] = React.useState('');
  const [detailCategoryFilter, setDetailCategoryFilter] = React.useState('All');
  const [showCreate, setShowCreate] = React.useState(false);
  const [carpoolCreateMode, setCarpoolCreateMode] = React.useState(null);
  const [quickViewRequest, setQuickViewRequest] = React.useState(null);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    const nextView = tab === 'open' || tab === 'carpool'
      ? 'browse'
      : VALID_VIEWS.includes(tab)
        ? tab
        : 'browse';
    if (nextView !== activeView) setActiveView(nextView);
    if (tab === 'carpool' && activeCategory !== 'rides') setActiveCategory('rides');
  }, [searchParams]);

  const changeView = (view) => {
    setActiveView(view);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (view === 'browse') next.delete('tab');
      else next.set('tab', view);
      return next;
    }, { replace: true });
  };

  const changeBrowseCategory = (categoryId) => {
    setActiveCategory(categoryId);
    if (activeView !== 'browse') changeView('browse');
  };

  const openRequestOnMap = (request) => {
    navigate(`/Map?requestId=${encodeURIComponent(request.id)}`);
  };

  // ── Data loading ───────────────────────────────────────────────────────────

  const { data: rawRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['mitzvah-requests'],
    queryFn: () => mitzvahService.listRequests({}, '-created_date', 200),
    staleTime: 30000,
    enabled: !!currentUser,
  });

  const { data: rawOffers = [] } = useQuery({
    queryKey: ['mitzvah-offers'],
    queryFn: () => mitzvahService.listOffers({}, '-created_date', 500),
    staleTime: 30000,
    enabled: !!currentUser,
  });

  const { data: rawComments = [] } = useQuery({
    queryKey: ['mitzvah-request-comments'],
    queryFn: () => mitzvahService.listRequestComments({}, 'created_date', 500),
    staleTime: 30000,
    enabled: !!currentUser,
  });

  const requests = React.useMemo(() => rawRequests.map(normalizeRequest), [rawRequests]);
  const offers = React.useMemo(() => rawOffers.map(normalizeOffer), [rawOffers]);
  const commentsByRequest = React.useMemo(() => {
    const groups = {};
    (Array.isArray(rawComments) ? rawComments : []).forEach((comment) => {
      if (!comment.request_id) return;
      if (!groups[comment.request_id]) groups[comment.request_id] = [];
      groups[comment.request_id].push(comment);
    });
    return groups;
  }, [rawComments]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['mitzvah-requests'] });
    queryClient.invalidateQueries({ queryKey: ['mitzvah-offers'] });
    queryClient.invalidateQueries({ queryKey: ['mitzvah-request-comments'] });
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const { mutateAsync: createRequestMutation, isPending: isCreating } = useMutation({
    mutationFn: (payload) => mitzvahService.createRequest(payload),
    onSuccess: invalidate,
  });

  const { mutateAsync: updateRequestMutation } = useMutation({
    mutationFn: ({ id, patch }) => mitzvahService.updateRequest(id, patch),
    onSuccess: invalidate,
  });

  const { mutateAsync: createOfferMutation, isPending: isOffering } = useMutation({
    mutationFn: (payload) => mitzvahService.createOffer(payload),
    onSuccess: invalidate,
  });

  const { mutateAsync: updateOfferMutation } = useMutation({
    mutationFn: ({ id, patch }) => mitzvahService.updateOffer(id, patch),
    onSuccess: invalidate,
  });

  const { mutateAsync: createCommentMutation } = useMutation({
    mutationFn: (payload) => mitzvahService.createRequestComment(payload),
    onSuccess: invalidate,
  });

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleCreateRequest = async (formData) => {
    const mapLocation = resolveMapLocation(formData.neighborhood);
    try {
      await createRequestMutation({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        neighborhood: formData.neighborhood,
        locationLabel: formData.neighborhood,
        location_text: formData.neighborhood,
        ...(formData.postToMap ? {
          location_lat: currentUser?.location_lat || mapLocation.lat,
          location_lng: currentUser?.location_lng || mapLocation.lng,
          approxLat: currentUser?.location_lat || mapLocation.lat,
          approxLng: currentUser?.location_lng || mapLocation.lng,
          map_visible: true,
          is_hidden: false,
        } : {
          map_visible: false,
        }),
        estimated_hours: formData.estimatedHours,
        urgency: formData.urgency.toLowerCase(),
        status: 'open',
        request_kind: 'volunteer',
        created_by_user_id: currentUser.id,
        created_by_name: currentUser.display_name || currentUser.full_name,
      });
      setShowCreate(false);
      changeView('posted');
      toast.success('Request posted.');
    } catch (err) {
      toast.error(err.message || 'Could not post request.');
    }
  };

  const handleCreateCarpoolRide = async (formData, mode) => {
    const route = `${formData.from} to ${formData.to}`;
    const typeLabel = mode === 'offer' ? 'offering' : 'needed';
    const title = mode === 'offer' ? `Seats available: ${route}` : `Ride needed: ${route}`;
    const note = formData.notes?.trim();
    const description = [
      `Type: ${typeLabel}`,
      `Pickup: ${formData.pickup}`,
      `Seats: ${formData.seats}`,
      note ? `Notes: ${note}` : null,
    ].filter(Boolean).join(' | ');

    try {
      await createRequestMutation({
        title,
        description,
        category: 'Transportation',
        neighborhood: route,
        locationLabel: route,
        estimated_hours: 1,
        urgency: 'medium',
        status: 'open',
        request_kind: 'carpool',
        created_by_user_id: currentUser.id,
        created_by_name: currentUser.display_name || currentUser.full_name,
      });
      setCarpoolCreateMode(null);
      changeBrowseCategory('rides');
      toast.success(mode === 'offer' ? 'Carpool offer posted.' : 'Ride request posted.');
    } catch (err) {
      toast.error(err.message || 'Could not post carpool.');
    }
  };

  const handleOffer = async (request) => {
    if (request.poster_id === currentUser?.id) {
      toast.error('You cannot offer to help on your own request.');
      return;
    }
    try {
      await createOfferMutation({
        request_id: request.id,
        user_id: currentUser.id,
        volunteer_id: currentUser.id,
        volunteer_name: currentUser.display_name || currentUser.full_name,
        note: 'I am available to help with this request.',
        status: 'offered',
      });
      await updateRequestMutation({
        id: request.id,
        patch: { status: 'offered' },
      });
      notificationsService.notifyMitzvahOffer({
        posterId: request.poster_id,
        volunteerId: currentUser.id,
        volunteerName: currentUser.display_name || currentUser.full_name,
        requestId: request.id,
        requestTitle: request.title,
      }).catch(() => {});
      toast.success('Offer sent to the poster.');
    } catch (err) {
      toast.error(err.message || 'Could not send offer.');
    }
  };

  const handleAcceptOffer = async (requestId, offerId, volunteerId) => {
    try {
      // Mark all other offers as not_selected; mark chosen as accepted.
      const reqOffers = offers.filter((o) => o.requestId === requestId);
      await Promise.all(
        reqOffers.map((o) =>
          updateOfferMutation({ id: o.id, patch: { status: o.id === offerId ? 'accepted' : 'not_selected' } })
        )
      );
      await updateRequestMutation({
        id: requestId,
        patch: { status: 'accepted', claimed_by_user_id: volunteerId },
      });
      const accepted = offers.find((o) => o.id === offerId);
      notificationsService.notifyMitzvahAccepted({
        volunteerId,
        posterId: currentUser.id,
        posterName: currentUser.display_name || currentUser.full_name,
        requestId,
        requestTitle: requests.find((r) => r.id === requestId)?.title || '',
      }).catch(() => {});
      toast.success(`Volunteer ${accepted?.volunteerName || ''} accepted.`);
    } catch (err) {
      toast.error(err.message || 'Could not accept offer.');
    }
  };

  const handleStart = async (requestId) => {
    try {
      await updateRequestMutation({ id: requestId, patch: { status: 'in_progress' } });
      toast.success('Task marked in progress.');
    } catch (err) {
      toast.error(err.message || 'Could not start task.');
    }
  };

  const handleComplete = async (requestId) => {
    try {
      await updateRequestMutation({ id: requestId, patch: { status: 'pending_verify' } });
      notificationsService.notifyVerificationRequest({
        posterId: requests.find((r) => r.id === requestId)?.poster_id,
        volunteerId: currentUser.id,
        volunteerName: currentUser.display_name || currentUser.full_name,
        requestId,
        requestTitle: requests.find((r) => r.id === requestId)?.title || '',
      }).catch(() => {});
      toast.success('Completion sent to the poster for verification.');
    } catch (err) {
      toast.error(err.message || 'Could not mark complete.');
    }
  };

  const handleVerify = async (requestId) => {
    try {
      await updateRequestMutation({ id: requestId, patch: { status: 'verified' } });
      toast.success('Completion verified! Chesed hours logged.');
    } catch (err) {
      toast.error(err.message || 'Could not verify completion.');
    }
  };

  const handleUrgencyChange = async (requestId, urgency) => {
    try {
      await updateRequestMutation({
        id: requestId,
        patch: { urgency: urgency.toLowerCase() },
      });
      toast.success(`Urgency set to ${urgency}.`);
    } catch (err) {
      toast.error(err.message || 'Could not update urgency.');
    }
  };

  const handleCommentOnRequest = async (request, body) => {
    if (!currentUser) return;
    try {
      await createCommentMutation({
        request_id: request.id,
        author_id: currentUser.id,
        author_name: currentUser.display_name || currentUser.full_name || 'Community member',
        author_avatar_url: currentUser.avatar_url || null,
        body,
      });
      toast.success('Comment added.');
    } catch (err) {
      toast.error(err.message || 'Could not add comment.');
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const searchFilteredRequests = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesQuery =
        !needle ||
        [r.title, r.description, r.category, r.neighborhood, r.poster_name].some((v) =>
          String(v || '').toLowerCase().includes(needle)
        );
      return matchesQuery;
    });
  }, [requests, query]);

  const browseRequests = searchFilteredRequests.filter(
    (r) => ![STATUSES.VERIFIED, STATUSES.CANCELLED].includes(r.status)
      && requestMatchesCategoryGroup(r, activeCategory)
  );
  const completedRequests = searchFilteredRequests.filter((r) =>
    [STATUSES.VERIFIED, STATUSES.CANCELLED].includes(r.status)
    && (detailCategoryFilter === 'All' || r.category === detailCategoryFilter)
  );
  const myOfferRequests = requests
    .map((r) => ({
      request: r,
      offer: offers.find((o) => o.requestId === r.id && o.volunteerId === currentUser?.id),
    }))
    .filter((item) => item.offer);
  const myPosted = searchFilteredRequests.filter((r) =>
    r.poster_id === currentUser?.id
    && (detailCategoryFilter === 'All' || r.category === detailCategoryFilter)
  );
  const carpoolRequests = requests
    .filter((r) =>
      r.request_kind === 'carpool'
      || r.category === 'Transportation'
      || /ride|carpool|pickup|seat/i.test(`${r.title || ''} ${r.description || ''}`)
    )
    .map(normalizeCarpoolRide);
  const signupsByRequest = offers.reduce((acc, offer) => {
    if (!acc[offer.requestId]) acc[offer.requestId] = [];
    acc[offer.requestId].push(offer);
    return acc;
  }, {});

  const totals = React.useMemo(() => ({
    openCount: requests.filter((r) => r.status === STATUSES.OPEN).length,
    offeredCount: requests.filter((r) =>
      [STATUSES.OFFERED, STATUSES.ACCEPTED, STATUSES.IN_PROG].includes(r.status)
    ).length,
    completedCount: requests.filter((r) => r.status === STATUSES.VERIFIED).length,
  }), [requests]);

  const workflowTabs = [
    { id: 'browse', label: 'Browse Needs' },
    { id: 'offers', label: 'My Offers' },
    { id: 'posted', label: 'My Requests' },
    { id: 'completed', label: 'Completed' },
  ];

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="app-page mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 sm:px-4 sm:pt-4">
        {/* Header */}
        <div className="overflow-hidden rounded-[30px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50 shadow-sm">
          <div className="relative p-4 sm:p-5">
            <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/50 blur-2xl" />
            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-blue-700">
                    <HandHeart className="h-3.5 w-3.5" />
                    Community help hub
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                      Mitzvah Circle
                    </h1>
                    <PageHelp text="Give help, ask for help, and follow mitzvah requests from open to completed." />
                  </div>
                  <p className="mt-1.5 max-w-xl text-[13px] font-semibold leading-5 text-slate-600">
                    Give help. Ask for help. Strengthen the community.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreate(true)}
                  className="app-button-primary h-11 shrink-0 px-3 sm:px-4"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Post Request</span>
                  <span className="sm:hidden">Post</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Metric icon={HandHeart} label="Open" value={totals.openCount} tone="blue" />
                <Metric icon={Clock} label="In Progress" value={totals.offeredCount} tone="amber" />
                <Metric icon={Award} label="Completed" value={totals.completedCount} tone="emerald" />
              </div>
            </div>
          </div>
        </div>

        {/* Activity views */}
        <div className="sticky top-0 z-20 -mx-3 mt-3 bg-[#F6F8FB]/78 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
          <div className="surface-panel-soft rounded-[24px] p-2">
            <p className="px-2 pb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">My activity</p>
            <div className="mobile-scroll-x flex gap-2">
              {workflowTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => changeView(tab.id)}
                  className={`motion-press shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-black transition ${
                    activeView === tab.id
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search/filter bar */}
        {activeView !== 'offers' && (
          <div className="surface-panel-soft mb-3 space-y-3 rounded-[24px] p-3">
            {activeView === 'browse' && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-black text-slate-950">Browse by need</p>
                    <p className="text-[12px] font-semibold text-slate-500">
                      Choose the kind of chesed you want to help with.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                    {browseRequests.length} open
                  </span>
                </div>
                <div className="mobile-scroll-x flex gap-2">
                  {CATEGORY_GROUPS.map((group) => {
                    const Icon = group.icon;
                    const selected = activeCategory === group.id;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => changeBrowseCategory(group.id)}
                        className={`motion-press shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                          selected
                            ? `${group.tone} shadow-sm`
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-[12px] font-black">
                          <Icon className="h-4 w-4" />
                          {group.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={activeView === 'browse' ? 'grid gap-2' : 'grid gap-2 sm:grid-cols-[1fr_220px]'}>
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search requests"
                  className="app-input h-11 pl-10 pr-3 text-sm"
                />
              </label>
              {activeView !== 'browse' && (
                <label className="relative">
                  <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={detailCategoryFilter}
                    onChange={(e) => setDetailCategoryFilter(e.target.value)}
                    className="app-input h-11 pl-10 pr-3 text-sm font-black"
                  >
                    <option>All</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Tab content */}
        <div key={`${activeView}-${activeCategory}`} className="motion-stagger space-y-3">
          {activeView === 'browse' && (
            loadingRequests ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : browseRequests.length || activeCategory === 'rides' ? (
              <>
                {activeCategory === 'rides' && (
                  <CarpoolBoard
                    rideRequests={carpoolRequests}
                    signupsByRequest={signupsByRequest}
                    onCreateRide={(mode) => setCarpoolCreateMode(mode)}
                    onSelectRide={setQuickViewRequest}
                    onClaimRide={(_, ride) => handleOffer(ride)}
                    isClaiming={isOffering}
                  />
                )}
                {activeCategory !== 'rides' && browseRequests.map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    offers={offers}
                    comments={commentsByRequest[r.id] || []}
                    currentUser={currentUser}
                    onOffer={handleOffer}
                    onAcceptOffer={handleAcceptOffer}
                    onStart={handleStart}
                    onComplete={handleComplete}
                    onVerify={handleVerify}
                    onComment={handleCommentOnRequest}
                    onOpenMap={openRequestOnMap}
                    onQuickView={setQuickViewRequest}
                    onUrgencyChange={handleUrgencyChange}
                  />
                ))}
              </>
            ) : (
              <EmptyState
                title={`No ${getCategoryGroup(activeCategory).shortLabel.toLowerCase()} requests`}
                text={activeCategory === 'all'
                  ? 'Be the first to post a chesed request in your community.'
                  : `${getCategoryGroup(activeCategory).description} will appear here when someone posts one.`}
              />
            )
          )}

          {activeView === 'offers' && (
            myOfferRequests.length ? (
              myOfferRequests.map(({ request, offer }) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  offers={offers}
                  comments={commentsByRequest[request.id] || []}
                  currentUser={currentUser}
                  onOffer={handleOffer}
                  onAcceptOffer={handleAcceptOffer}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onVerify={handleVerify}
                  onComment={handleCommentOnRequest}
                  onOpenMap={openRequestOnMap}
                  onUrgencyChange={handleUrgencyChange}
                />
              ))
            ) : (
              <EmptyState
                title="No offers yet"
                text="Browse open requests and tap 'Offer to Help' to get started."
              />
            )
          )}

          {activeView === 'posted' && (
            myPosted.length ? (
              myPosted.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  offers={offers}
                  comments={commentsByRequest[r.id] || []}
                  currentUser={currentUser}
                  onOffer={handleOffer}
                  onAcceptOffer={handleAcceptOffer}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onVerify={handleVerify}
                  onComment={handleCommentOnRequest}
                  onOpenMap={openRequestOnMap}
                  onUrgencyChange={handleUrgencyChange}
                />
              ))
            ) : (
              <EmptyState
                title="No posted requests"
                text="Post a request and your community will be notified."
              />
            )
          )}

          {activeView === 'completed' && (
            completedRequests.length ? (
              completedRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  offers={offers}
                  comments={commentsByRequest[r.id] || []}
                  currentUser={currentUser}
                  onOffer={() => {}}
                  onAcceptOffer={() => {}}
                  onStart={() => {}}
                  onComplete={() => {}}
                  onVerify={() => {}}
                  onComment={handleCommentOnRequest}
                  onOpenMap={openRequestOnMap}
                  onUrgencyChange={handleUrgencyChange}
                />
              ))
            ) : (
              <EmptyState
                title="No completed requests yet"
                text="Completed and verified requests will appear here."
              />
            )
          )}
        </div>
      </section>

      <CreateRequestModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateRequest}
        isLoading={isCreating}
      />

      <CreateCarpoolModal
        mode={carpoolCreateMode}
        onClose={() => setCarpoolCreateMode(null)}
        onCreate={handleCreateCarpoolRide}
        isLoading={isCreating}
      />

      {quickViewRequest && (
        <QuickViewSheet
          request={quickViewRequest}
          offers={offers}
          comments={commentsByRequest[quickViewRequest.id] || []}
          currentUser={currentUser}
          onClose={() => setQuickViewRequest(null)}
          onOffer={(r) => { handleOffer(r); setQuickViewRequest(null); }}
          onOpenMap={openRequestOnMap}
        />
      )}
    </main>
  );
}
