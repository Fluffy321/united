import React from 'react';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NotificationBell({ userId }) {
  const navigate = useNavigate();

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
    <button
      onClick={() => navigate(createPageUrl('Notifications'))}
      className="relative flex items-center justify-center w-11 h-11 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
    >
      <Bell className="w-5 h-5 text-[#374151]" strokeWidth={1.75} style={{ pointerEvents: 'none' }} />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none pointer-events-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}