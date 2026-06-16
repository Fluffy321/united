import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { notificationsService } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { Bell, CheckCheck, Heart, MessageCircle, HandHeart, CheckCircle2, UserRoundCheck, Users, Megaphone, Shield, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotificationRoute } from '@/lib/notificationRoute';

const TYPE_CONFIG = {
  new_message:          { icon: MessageCircle, tone: 'bg-blue-50 text-blue-600',       label: 'Message' },
  marketplace_message:  { icon: MessageCircle, tone: 'bg-blue-50 text-blue-600',       label: 'Message' },
  comment_reply:        { icon: MessageCircle, tone: 'bg-violet-50 text-violet-600',   label: 'Reply' },
  post_commented:       { icon: MessageCircle, tone: 'bg-violet-50 text-violet-600',   label: 'Comment' },
  user_mentioned:       { icon: AtSign,        tone: 'bg-indigo-50 text-indigo-600',   label: 'Mention' },
  post_liked:           { icon: Heart,         tone: 'bg-red-50 text-red-500',         label: 'Like' },
  mitzvah_offer:        { icon: HandHeart,     tone: 'bg-violet-50 text-violet-600',   label: 'Mitzvah offer' },
  mitzvah_accepted:     { icon: CheckCircle2,  tone: 'bg-emerald-50 text-emerald-600', label: 'Mitzvah accepted' },
  verification_request: { icon: CheckCircle2,  tone: 'bg-purple-50 text-purple-600',   label: 'Verification needed' },
  community_activity:   { icon: Users,         tone: 'bg-amber-50 text-amber-600',     label: 'Community' },
  announcement:         { icon: Megaphone,     tone: 'bg-amber-50 text-amber-600',     label: 'Announcement' },
  community_removal:    { icon: Shield,        tone: 'bg-red-50 text-red-500',         label: 'Removed' },
  appeal_resolved:      { icon: Shield,        tone: 'bg-slate-50 text-slate-500',     label: 'Appeal' },
  // Legacy / kept for backwards compat with old notification rows
  like:                 { icon: Heart,         tone: 'bg-red-50 text-red-500',         label: 'Liked' },
  friend_added:         { icon: UserRoundCheck, tone: 'bg-emerald-50 text-emerald-600', label: 'Friend' },
  default:              { icon: Bell,          tone: 'bg-slate-50 text-slate-500',     label: 'Notification' },
};

export default function NotificationCenter({ open, onOpenChange, userId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationsService.listForUser(userId, 50),
    enabled: !!userId && open,
    staleTime: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await notificationsService.markAllRead(notifications);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', userId] });
    }
  });

  const markOneRead = async (notif) => {
    if (!notif.is_read) {
      await notificationsService.markRead(notif.id);
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', userId] });
    }
    const route = getNotificationRoute(notif);
    if (route) {
      onOpenChange?.(false);
      navigate(route);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col">
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-[#f1f5f9]">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-[18px] font-bold text-[#0F1C2E]">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2563eb] active:opacity-70"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
              <div className="w-14 h-14 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#94a3b8]" />
              </div>
              <p className="text-[14px] font-semibold text-[#64748b]">You're all caught up!</p>
              <p className="text-[12px] text-[#94a3b8]">Notifications will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f8fafc]">
              {notifications.map(notif => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
                const Icon = config.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => markOneRead(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition-colors ${
                      notif.is_read ? 'bg-white' : 'bg-blue-50/70'
                    }`}
                  >
                    {/* Type icon + actor avatar badge */}
                    <div className="relative mt-0.5 flex-shrink-0">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${config.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {notif.actor_avatar_url && (
                        <img
                          src={notif.actor_avatar_url}
                          alt=""
                          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#0F1C2E] leading-snug">{notif.message || notif.body || notif.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[11px] text-[#94a3b8]">
                          {(() => {
                            try {
                              const d = parseISO(notif.updated_at || notif.created_date || notif.created_at || '');
                              return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
                            } catch { return '—'; }
                          })()}
                        </span>
                        {notif.aggregate_count > 1 && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                            {notif.aggregate_count}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-2 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
