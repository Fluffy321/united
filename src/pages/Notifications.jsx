import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CheckCheck, Heart, MessageCircle, HandHeart, CheckCircle2, Megaphone, Calendar, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO, isToday, isYesterday, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
  like: { icon: Heart, color: '#ef4444', bg: '#fef2f2', label: 'Liked your post' },
  comment: { icon: MessageCircle, color: '#2563eb', bg: '#eff6ff', label: 'Commented' },
  help_offer: { icon: HandHeart, color: '#7c3aed', bg: '#f5f3ff', label: 'Help offered' },
  request_fulfilled: { icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', label: 'Request fulfilled' },
  announcement: { icon: Megaphone, color: '#d97706', bg: '#fffbeb', label: 'Announcement' },
  event: { icon: Calendar, color: '#0891b2', bg: '#ecfeff', label: 'Event reminder' },
  default: { icon: Bell, color: '#64748b', bg: '#f8fafc', label: 'Notification' },
};

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'like', label: 'Likes' },
  { id: 'comment', label: 'Comments' },
  { id: 'help_offer', label: 'Help' },
  { id: 'announcement', label: 'Community' },
];

function groupByDate(notifications) {
  const groups = {};
  for (const n of notifications) {
    const d = parseISO(n.created_date);
    const key = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d');
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-page', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id }, '-created_date', 80),
    enabled: !!currentUser,
    staleTime: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', currentUser?.id] });
    },
  });

  const markOneRead = async (notif) => {
    if (!notif.read) {
      await base44.entities.Notification.update(notif.id, { read: true });
      queryClient.invalidateQueries({ queryKey: ['notifications-page', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', currentUser?.id] });
    }
    if (notif.link) window.location.href = notif.link;
  };

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const grouped = groupByDate(filtered);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F6FF' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-blue-100" style={{ boxShadow: '0 1px 8px rgba(37,99,235,0.07)' }}>
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
                className="flex-shrink-0 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-all whitespace-nowrap"
                style={filter === tab.id
                  ? { color: '#2563EB', borderColor: '#2563EB' }
                  : { color: '#94a3b8', borderColor: 'transparent' }
                }
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
                <div className="bg-white rounded-2xl border border-blue-50 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.06)' }}>
                  {items.map((notif, idx) => {
                    const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
                    const Icon = config.icon;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => markOneRead(notif)}
                        className="w-full flex items-start gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-blue-50"
                        style={{
                          background: notif.read ? 'white' : '#f0f6ff',
                          borderTop: idx > 0 ? '1px solid #EFF6FF' : 'none',
                        }}
                      >
                        {/* Icon bubble */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: config.bg }}
                        >
                          <Icon className="w-4.5 h-4.5" style={{ color: config.color, width: 18, height: 18 }} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-slate-800 leading-snug font-medium">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: config.bg, color: config.color }}
                            >
                              {config.label}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatDistanceToNow(parseISO(notif.created_date), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* Unread dot */}
                        {!notif.read && (
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