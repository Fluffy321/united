import React from 'react';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SUGGESTIONS = [
  {
    emoji: '🚗',
    title: 'Offer a ride for Shabbos',
    subtitle: 'Chesed · Neighbors',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    emoji: '🕍',
    title: 'Join a Minyan near you',
    subtitle: 'Shuls · Local',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    emoji: '📚',
    title: 'Attend a shiur this week',
    subtitle: 'Learning · Torah',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    emoji: '🍽️',
    title: 'Host someone for Shabbos',
    subtitle: 'Chesed · Hospitality',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
];

export default function StreakCard({ streak }) {
  const navigate = useNavigate();
  const currentStreak = streak?.current_streak || 0;
  const bestStreak = streak?.best_streak || 0;

  /* ── Active streak state ── */
  if (currentStreak > 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-orange-400 to-red-500 shadow-md">
              <Flame className="h-7 w-7 fill-white text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-orange-500">Active Streak</p>
            <p className="text-3xl font-black leading-none text-slate-950">
              {currentStreak}{' '}
              <span className="text-base font-bold text-slate-500">days</span>
            </p>
            {bestStreak > currentStreak && (
              <p className="mt-0.5 text-[11px] text-slate-400">Best: {bestStreak} days</p>
            )}
          </div>
          <button
            onClick={() => navigate(createPageUrl('MitzvahCircle'))}
            className="shrink-0 rounded-2xl bg-orange-500 px-3 py-2 text-[12px] font-black text-white shadow-sm transition active:scale-95"
          >
            + Log
          </button>
        </div>
      </div>
    );
  }

  /* ── Zero-streak: suggestion scroll ── */
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="px-4 pt-4 pb-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Start Your Journey</p>
        <h3 className="mt-0.5 text-[15px] font-black text-slate-900">One small mitzvah today?</h3>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-2.5 px-4 py-3 sm:grid-cols-4">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => navigate(createPageUrl('MitzvahCircle'))}
            className={`min-w-0 rounded-2xl border p-3 text-left transition active:scale-95 ${s.bg} ${s.border}`}
          >
            <span className="text-2xl">{s.emoji}</span>
            <p className="mt-2 break-words text-[12px] font-black leading-snug text-slate-900">{s.title}</p>
            <p className="mt-0.5 break-words text-[10px] font-semibold text-slate-400">{s.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
