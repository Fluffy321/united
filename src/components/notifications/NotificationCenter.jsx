import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Bell, CheckCheck, Heart, MessageCircle, HandHeart, CheckCircle2 } from 'lucide-react';

const TYPE_CONFIG = {
  like: { icon: Heart, color: '#ef4444', bg: '#fef2f2', label: 'liked your post' },
  comment: { icon: MessageCircle, color: '#2563eb', bg: '#eff6ff', label: 'commented on your post' },
  help_offer: { icon: HandHeart, color: '#7c3aed', bg: '#f5f3ff', label: 'offered to help' },
  request_fulfilled: { icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', label: 'your request was fulfilled' },
  default: { icon: Bell, color: '#64748b', bg: '#f8fafc', label: 'notification' }
};

export default function NotificationCenter({ open, onOpenChange, userId }) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => base44.entities.Notification.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId && open,
    staleTime: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', userId] });
    }
  });

  const markOneRead = async (notif) => {
    if (!notif.read) {
      await base44.entities.Notification.update(notif.id, { read: true });
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', userId] });
    }
    if (notif.link) window.location.href = notif.link;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
                    className="w-full flex items-start gap-3 px-4 py-3.5 text-left active:bg-[#f8fafc] transition-colors"
                    style={{ background: notif.read ? 'white' : '#f8fbff' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: config.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#0F1C2E] leading-snug">{notif.message}</p>
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        {formatDistanceToNow(parseISO(notif.created_date), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.read && (
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