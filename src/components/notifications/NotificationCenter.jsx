import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { notificationsService } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Bell, CheckCheck, Heart, MessageCircle, HandHeart, CheckCircle2, UserRoundPlus, UserRoundCheck } from 'lucide-react';

const TYPE_CONFIG = {
  like: { icon: Heart, tone: 'bg-red-50 text-red-500', label: 'liked your post' },
  comment: { icon: MessageCircle, tone: 'bg-blue-50 text-blue-600', label: 'commented on your post' },
  help_offer: { icon: HandHeart, tone: 'bg-violet-50 text-violet-600', label: 'offered to help' },
  mitzvah_offer: { icon: HandHeart, tone: 'bg-violet-50 text-violet-600', label: 'Mitzvah offer' },
  mitzvah_accepted: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600', label: 'Mitzvah accepted' },
  verification_request: { icon: CheckCircle2, tone: 'bg-purple-50 text-purple-600', label: 'Verification needed' },
  request_fulfilled: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600', label: 'your request was fulfilled' },
  friend_request_received: { icon: UserRoundPlus, tone: 'bg-blue-50 text-blue-600', label: 'sent you a friend request' },
  friend_request_accepted: { icon: UserRoundCheck, tone: 'bg-emerald-50 text-emerald-600', label: 'accepted your friend request' },
  // Legacy type kept for backwards compatibility
  friend_added: { icon: UserRoundCheck, tone: 'bg-emerald-50 text-emerald-600', label: 'added you as a friend' },
  default: { icon: Bell, tone: 'bg-slate-50 text-slate-500', label: 'notification' }
};

export default function NotificationCenter({ open, onOpenChange, userId }) {
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
    if (notif.link_url) window.location.href = notif.link_url;
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
                    <div
                      className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${config.tone}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#0F1C2E] leading-snug">{notif.message || notif.body || notif.title}</p>
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        {formatDistanceToNow(parseISO(notif.created_date), { addSuffix: true })}
                      </p>
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
