import React, { useState } from 'react';
import { ArrowLeft, Bell, CheckCheck, Heart, MessageCircle, HandHeart, CheckCircle2, Megaphone, Calendar, Loader2, AtSign } from 'lucide-react';
import { notificationsService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO, isToday, isYesterday, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import QueryError from '@/components/common/QueryError';

const TYPE_CONFIG = {
  like: { icon: Heart, tone: 'bg-red-50 text-red-500', label: 'Liked your post' },
  post_reply: { icon: MessageCircle, tone: 'bg-blue-50 text-blue-600', label: 'Replied to your post' },
  comment_reply: { icon: MessageCircle, tone: 'bg-violet-50 text-violet-600', label: 'Also replied' },
  comment: { icon: MessageCircle, tone: 'bg-blue-50 text-blue-600', label: 'Commented' },
  help_offer: { icon: HandHeart, tone: 'bg-violet-50 text-violet-600', label: 'Help offered' },
  mitzvah_offer: { icon: HandHeart, tone: 'bg-violet-50 text-violet-600', label: 'Mitzvah offer' },
  mitzvah_accepted: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600', label: 'Mitzvah accepted' },
  verification_request: { icon: CheckCircle2, tone: 'bg-purple-50 text-purple-600', label: 'Verification needed' },
  request_fulfilled: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600', label: 'Request fulfilled' },
  announcement: { icon: Megaphone, tone: 'bg-amber-50 text-amber-600', label: 'Announcement' },
  community_activity: { icon: Megaphone, tone: 'bg-amber-50 text-amber-600', label: 'Community activity' },
  event: { icon: Calendar, tone: 'bg-cyan-50 text-cyan-600', label: 'Event reminder' },
  new_message: { icon: MessageCircle, tone: 'bg-blue-50 text-blue-600', label: 'New message' },
  mention: { icon: AtSign, tone: 'bg-violet-50 text-violet-600', label: 'Mentioned you' },
  default: { icon: Bell, tone: 'bg-slate-50 text-slate-500', label: 'Notification' },
};

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'new_message', label: '💬 Messages' },
  { id: 'mitzvah_offer', label: '🤝 Mitzvah' },
  { id: 'like', label: '❤️ Likes' },
  { id: 'comment', label: '💭 Comments' },
  { id: 'mention', label: '@ Mentions' },
  { id: 'community_activity', label: '📣 Community' },
];

const FILTER_TYPES = {
  mitzvah_offer: ['mitzvah_offer', 'mitzvah_accepted', 'verification_request'],
  community_activity: ['community_activity', 'announcement', 'event'],
};

function groupByDate(notifications) {
  const groups = {};
  for (const n of notifications) {
    const d = parseISO(n.created_date || n.created_at);
    const key = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d');
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications-page', currentUser?.id],
    queryFn: () => notificationsService.listForUser(currentUser.id),
    enabled: !!currentUser,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await notificationsService.markAllRead(notifications);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', currentUser?.id] });
    },
    onError: () => toast.error('Could not mark notifications as read.'),
  });

  const markOneRead = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsService.markRead(notif.id);
        queryClient.invalidateQueries({ queryKey: ['notifications-page', currentUser?.id] });
        queryClient.invalidateQueries({ queryKey: ['notification-count', currentUser?.id] });
      } catch {
        // non-blocking — continue navigation even if marking fails
      }
    }
    if (notif.type === 'new_message' && notif.conversation_id) {
      navigate(`/Messages?conversation=${notif.conversation_id}`);
    } else if (notif.post_id) {
      navigate(`/PostDetail?id=${notif.post_id}`);
    } else if (notif.link_url) {
      navigate(notif.link_url);
    }
  };

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => (FILTER_TYPES[filter] || [filter]).includes(n.type));
  const grouped = groupByDate(filtered);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="app-page flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-blue-100 bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-[18px] font-bold text-slate-900 flex-1">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2563eb] active:opacity-70 px-3 py-1.5 rounded-full bg-blue-50"
            >
              {markAllRead.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-0">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-[12px] font-semibold transition-all ${
                  filter === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400'
                }`}
              >
                {tab.label}
                {tab.id === 'all' && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-28">
        {isLoading ? (
          <div className="space-y-2.5 mt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-start gap-3 border border-blue-50">
                <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-3/4 rounded" />
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
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-blue-300" />
            </div>
            <p className="text-[15px] font-bold text-slate-700">All caught up!</p>
            <p className="text-[13px] text-slate-400 mt-1">
              {filter === 'all' ? 'Notifications will appear here.' : `No ${filter} notifications yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">{dateLabel}</p>
                <div className="app-card overflow-hidden border-blue-50">
                  {items.map((notif, idx) => {
                    const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
                    const Icon = config.icon;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => markOneRead(notif)}
                        className={`w-full flex items-start gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-blue-50 ${
                          notif.is_read ? 'bg-white' : 'bg-blue-50/80'
                        } ${idx > 0 ? 'border-t border-blue-50' : ''}`}
                      >
                        {/* Icon bubble */}
                        <div
                          className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.tone}`}
                        >
                          <Icon className="h-[18px] w-[18px]" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-slate-800 leading-snug font-medium">{notif.message || notif.body || notif.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.tone}`}
                            >
                              {config.label}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatDistanceToNow(parseISO(notif.created_date || notif.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* Unread dot */}
                        {!notif.is_read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb] mt-2 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
