import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function WeeklyImpactCard() {
  const { data: stats } = useQuery({
    queryKey: ['weekly-impact'],
    queryFn: () => base44.entities.WeeklyStats.list('-created_date', 1),
    staleTime: 3600000,
    select: (d) => d[0],
  });

  if (!stats) return null;

  const rows = [
    stats.families_helped   > 0 && { emoji: '🤝', value: stats.families_helped,   label: `famil${stats.families_helped === 1 ? 'y' : 'ies'} helped` },
    stats.volunteer_hours   > 0 && { emoji: '⏱️', value: stats.volunteer_hours,   label: 'volunteer hours' },
    stats.meal_trains       > 0 && { emoji: '🍲', value: stats.meal_trains,       label: `meal train${stats.meal_trains !== 1 ? 's' : ''} organized` },
    stats.active_volunteers > 0 && { emoji: '✨', value: stats.active_volunteers, label: 'members took action' },
  ].filter(Boolean);

  if (!rows.length) return null;

  return (
    <div
      className="rounded-[18px] overflow-hidden mb-3"
      style={{ background: 'linear-gradient(135deg, #0F1C2E 0%, #1e3a5f 100%)', boxShadow: '0 8px 24px rgba(15,28,46,0.25)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <span className="text-3xl">🏆</span>
        <div>
          <p className="text-white font-bold text-[16px] leading-tight">This Week Our Community</p>
          <p className="text-white/50 text-[12px] mt-0.5">Made a real difference together</p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pb-2 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2.5">
            <span className="text-xl">{row.emoji}</span>
            <span className="text-white text-[14px] font-semibold">
              <span className="text-[18px] font-extrabold">{row.value}</span>{' '}
              {row.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tagline */}
      <div className="mx-5 mb-5 mt-2 bg-yellow-400/15 border border-yellow-400/25 rounded-xl px-4 py-3 text-center">
        <p className="text-yellow-200 text-[13px] font-semibold">"Every act of kindness creates a ripple." 💛</p>
      </div>
    </div>
  );
}