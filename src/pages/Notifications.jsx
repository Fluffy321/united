import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  MessageCircle,
  HandHeart,
  CheckCircle2,
  Megaphone,
  Loader2,
  Users,
  ShieldAlert,
  AlertTriangle,
  Shield,
  Heart,
  AtSign,
} from 'lucide-react';
import { notificationsService, dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO, isToday, isYesterday, format, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import QueryError from '@/components/common/QueryError';
import { appParams } from '@/lib/app-params';
import { getNotificationRoute } from '@/lib/notificationRoute';

// ── Type configuration ──────────────────────────────────────────────────────

const TYPE_CONFIG = {
  new_message:          { icon: MessageCircle, tone: 'bg-blue-50 text-blue-600',       label: 'Message' },
  comment_reply:        { icon: MessageCircle, tone: 'bg-violet-50 text-violet-600',   label: 'Reply' },
  post_commented:       { icon: MessageCircle, tone: 'bg-violet-50 text-violet-600',   label: 'Comment' },
  user_mentioned:       { icon: AtSign,        tone: 'bg-indigo-50 text-indigo-600',   label: 'Mention' },
  post_liked:           { icon: Heart,         tone: 'bg-red-50 text-red-500',         label: 'Like' },
  mitzvah_offer:        { icon: HandHeart,     tone: 'bg-violet-50 text-violet-600',   label: 'Mitzvah offer' },
  mitzvah_accepted:     { icon: CheckCircle2,  tone: 'bg-emerald-50 text-emerald-600', label: 'Mitzvah accepted' },
  verification_request: { icon: CheckCircle2,  tone: 'bg-purple-50 text-purple-600',   label: 'Verification needed' },
  community_activity:   { icon: Users,         tone: 'bg-amber-50 text-amber-600',     label: 'Community' },
  announcement:         { icon: Megaphone,     tone: 'bg-amber-50 text-amber-600',     label: 'Announcement' },
  community_removal:    { icon: ShieldAlert,   tone: 'bg-red-50 text-red-500',         label: 'Removed' },
  appeal_resolved:      { icon: Shield,        tone: 'bg-slate-50 text-slate-500',     label: 'Appeal' },
  deletion_vote:        { icon: AlertTriangle, tone: 'bg-orange-50 text-orange-500',   label: 'Vote required' },
  default:              { icon: Bell,          tone: 'bg-slate-50 text-slate-400',     label: 'Notification' },
};

// ── Filter definitions ──────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'unread',    label: 'Unread' },
  { id: 'replies',   label: 'Replies' },
  { id: 'mitzvah',   label: 'Mitzvah' },
  { id: 'community', label: 'Community' },
  { id: 'messages',  label: 'Messages' },
];

const FILTER_TYPES = {
  replies:   ['comment_reply', 'post_commented', 'user_mentioned'],
  mitzvah:   ['mitzvah_offer', 'mitzvah_accepted', 'verification_request'],
  community: ['community_activity', 'announcement'],
  messages:  ['new_message'],
};

// ── Date grouping ───────────────────────────────────────────────────────────

function safeParse(dateStr) {
  if (!dateStr) return null;
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

function dateGroupLabel(d) {
  if (!d) return 'Older';
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d');
}

function groupByDate(notifications) {
  const groups = {};
  for (const n of notifications) {
    // Use updated_at for grouping so aggregated notifications appear in "Today"
    // after receiving new activity, matching where they appear in the sorted list.
    const d = safeParse(n.updated_at || n.created_date || n.created_at);
    const key = dateGroupLabel(d);
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

// ── Swipeable notification card ─────────────────────────────────────────────

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX = 90;

function SwipeableNotifCard({ notif, onRead, isLast }) {
  const startX    = useRef(null);
  const startY    = useRef(null);
  const intentRef = useRef(null);
  const [offset,   setOffset]   = useState(0);
  const [settling, setSettling] = useState(false);

  const handleTouchStart = (e) => {
    startX.current    = e.touches[0].clientX;
    startY.current    = e.touches[0].clientY;
    intentRef.current = null;
    setSettling(false);
  };

  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = Math.abs(e.touches[0].clientY - startY.current);

    // Lock intent once the user moves 6px in any direction
    if (intentRef.current === null && (Math.abs(dx) > 6 || dy > 6)) {
      intentRef.current = dy > Math.abs(dx) ? 'vertical' : 'horizontal';
    }
    if (intentRef.current !== 'horizontal') return;

    // Right-swipe only, clamped
    const clamped = Math.max(0, Math.min(dx, SWIPE_MAX));
    setOffset(clamped);
  };

  const handleTouchEnd = () => {
    if (intentRef.current === 'horizontal' && offset >= SWIPE_THRESHOLD && !notif.is_read) {
      onRead(notif);
    }
    setSettling(true);
    setOffset(0);
    startX.current = null;
    startY.current = null;
  };

  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
  const Icon    = config.icon;
  const d       = safeParse(notif.created_date || notif.created_at);
  const message = notif.body || notif.title || notif.message || 'Notification';
  const route   = getNotificationRoute(notif);

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Behind-card "Mark read" indicator */}
      <div
        aria-hidden
        className={`absolute inset-y-0 left-0 flex items-center gap-1.5 pl-4 text-emerald-600 transition-opacity ${
          offset >= SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <CheckCheck className="h-4 w-4" />
        <span className="text-[12px] font-semibold">Mark read</span>
      </div>

      <button
        onClick={() => onRead(notif)}
        style={{
          transform:  `translateX(${offset}px)`,
          transition: settling ? 'transform 0.22s ease' : 'none',
        }}
        className={`w-full flex items-start gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-blue-50/80 ${
          notif.is_read ? 'bg-white' : 'bg-blue-50/60'
        } ${!isLast ? 'border-b border-slate-100' : ''}`}
      >
        {/* Type icon + optional actor avatar badge */}
        <div className="relative mt-0.5 shrink-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.tone}`}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          {notif.actor_avatar_url && (
            <img
              src={notif.actor_avatar_url}
              alt=""
              className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-white object-cover"
            />
          )}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className={`text-[13.5px] leading-snug ${
            notif.is_read ? 'text-slate-600 font-medium' : 'text-slate-900 font-semibold'
          }`}>
            {message}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${config.tone}`}>
              {config.label}
            </span>
            {notif.aggregate_count > 1 && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                {notif.aggregate_count}
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              {d ? formatDistanceToNow(d, { addSuffix: true }) : '—'}
            </span>
            {route && !notif.is_read && (
              <span className="text-[11px] text-blue-500 font-semibold">Tap to view</span>
            )}
          </div>
        </div>

        {/* Unread dot */}
        {!notif.is_read && (
          <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
        )}
      </button>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ filter }) {
  const messages = {
    all:       { headline: "You're all caught up!", sub: 'Notifications will appear here as activity happens.' },
    unread:    { headline: 'No unread notifications', sub: 'Everything is read. Check back later.' },
    replies:   { headline: 'No replies yet', sub: 'Replies and comments on your posts will appear here.' },
    mitzvah:   { headline: 'No Mitzvah notifications', sub: 'Offers, acceptances, and verification requests show up here.' },
    community: { headline: 'No community activity', sub: 'Posts and announcements from your communities will appear here.' },
    messages:  { headline: 'No message notifications', sub: 'New message alerts will appear here.' },
  };
  const { headline, sub } = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border border-blue-100">
        <Bell className="h-7 w-7 text-blue-300" />
      </div>
      <p className="text-[15px] font-bold text-slate-800">{headline}</p>
      <p className="mt-1.5 text-[13px] leading-5 text-slate-400">{sub}</p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications-page', currentUser?.id],
    queryFn: () => notificationsService.listForUser(currentUser.id),
    enabled: !!currentUser?.id,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Realtime — invalidate when any notification for this user is inserted
  useEffect(() => {
    if (!currentUser?.id || !appParams.hasBackendConfig) return;
    const unsubscribe = dataService.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_id === currentUser.id) {
        queryClient.invalidateQueries({ queryKey: ['notifications-page', currentUser.id] });
      }
    });
    return unsubscribe;
  }, [currentUser?.id, queryClient]);

  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllRead(notifications),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', currentUser?.id] });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Could not mark notifications as read.'),
  });

  const handleRead = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsService.markRead(notif.id);
        queryClient.invalidateQueries({ queryKey: ['notifications-page', currentUser?.id] });
        queryClient.invalidateQueries({ queryKey: ['notification-count', currentUser?.id] });
      } catch {
        // non-blocking — navigation proceeds regardless
      }
    }

    const route = getNotificationRoute(notif);
    if (route) navigate(route);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered =
    filter === 'all'
      ? notifications
      : filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications.filter((n) => (FILTER_TYPES[filter] || []).includes(n.type));

  const grouped = groupByDate(filtered);

  return (
    <div className="app-page flex flex-col">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="mobile-page-wide px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <h1 className="text-[18px] font-bold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="min-w-[20px] rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-bold text-white leading-none text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-60"
            >
              {markAllRead.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCheck className="h-3.5 w-3.5" />
              }
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mobile-page-wide px-4 pb-0">
          <div className="mobile-scroll-x flex gap-0">
            {FILTERS.map((tab) => {
              const isActive = filter === tab.id;
              const count = tab.id === 'unread' ? unreadCount : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex-shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[12.5px] font-semibold transition-all ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                  {count !== null && count > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white leading-none">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 mobile-page-wide w-full px-4 py-4 mobile-safe-bottom">
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="skeleton h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-3/4 rounded" />
                  <div className="skeleton h-2.5 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="mt-4">
            <QueryError message="Notifications could not load." onRetry={refetch} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {dateLabel}
                </p>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {items.map((notif, idx) => (
                    <SwipeableNotifCard
                      key={notif.id}
                      notif={notif}
                      onRead={handleRead}
                      isLast={idx === items.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
