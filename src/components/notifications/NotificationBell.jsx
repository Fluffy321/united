import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import NotificationCenter from './NotificationCenter';

export default function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false);

  const { data: count = 0 } = useQuery({
    queryKey: ['notification-count', userId],
    queryFn: async () => {
      const notifs = await base44.entities.Notification.filter({ user_id: userId, read: false });
      return notifs.length;
    },
    enabled: !!userId,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full active:bg-[#f1f5f9] transition-colors"
      >
        <Bell className="w-5 h-5 text-[#374151]" strokeWidth={1.75} />
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <NotificationCenter
        open={open}
        onOpenChange={(v) => setOpen(v)}
        userId={userId}
      />
    </>
  );
}