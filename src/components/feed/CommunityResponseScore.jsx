import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { format, startOfMonth } from 'date-fns';

function AnimatedCount({ target }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const step = Math.ceil(target / 30);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count}</span>;
}

export default function CommunityResponseScore() {
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: stats } = useQuery({
    queryKey: ['community-response-score', monthStart],
    queryFn: async () => {
      const [fulfilled, actions, logs] = await Promise.allSettled([
        dataService.entities.MitzvahRequest.filter({ status: 'completed' }, '-created_date', 100),
        dataService.entities.MitzvahAction.list('-created_date', 200),
        dataService.entities.ChesedLog.list('-created_date', 200),
      ]);

      const fulfilledThisMonth = (fulfilled.value || []).filter(r =>
        r.completed_at && r.completed_at.slice(0, 10) >= monthStart
      ).length;

      const actionsThisMonth = (actions.value || []).filter(a =>
        a.created_date && a.created_date.slice(0, 10) >= monthStart
      ).length;

      const hoursThisMonth = (logs.value || [])
        .filter(l => l.date && l.date >= monthStart)
        .reduce((sum, l) => sum + (l.hours || 0), 0);

      return {
        fulfilled: fulfilledThisMonth,
        actions: actionsThisMonth,
        hours: Math.round(hoursThisMonth),
      };
    },
    staleTime: 1800000, // 30 minutes
    gcTime: 3600000,    // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (!stats) return null;
  if (stats.fulfilled === 0 && stats.actions === 0 && stats.hours === 0) return null;

  const items = [
    { value: stats.fulfilled, label: 'Requests\nFulfilled', emoji: '✅' },
    { value: stats.actions,   label: 'Volunteer\nActions',  emoji: '🙌' },
    { value: stats.hours,     label: 'Community\nHours',    emoji: '⏱️' },
  ];

  return (
    <div className="bg-gradient-to-br from-[#0F1C2E] to-[#1a3252] rounded-[16px] px-4 py-4 mb-4">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
        This Month's Impact
      </p>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ value, label, emoji }) => (
          <div key={label} className="flex flex-col items-center text-center bg-white/8 rounded-[12px] py-3 px-1"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <span className="text-[18px] mb-1">{emoji}</span>
            <span className="text-[22px] font-extrabold text-white leading-none">
              <AnimatedCount target={value} />
            </span>
            <span className="text-[10px] font-semibold text-white/55 mt-1 leading-tight whitespace-pre-line">
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-white/40 text-center mt-3 font-medium">
        Your community is showing up. 💙
      </p>
    </div>
  );
}