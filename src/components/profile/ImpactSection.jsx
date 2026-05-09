import React from 'react';
import { HeartHandshake, Calendar, Flame, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TIERS = [
  { name: 'Bronze', threshold: 5,   emoji: '🥉' },
  { name: 'Silver', threshold: 20,  emoji: '🥈' },
  { name: 'Gold',   threshold: 50,  emoji: '🥇' },
  { name: 'Platinum', threshold: 100, emoji: '💎' },
];

function getTierInfo(points) {
  let current = null;
  let next = null;
  for (let i = 0; i < TIERS.length; i++) {
    if (points >= TIERS[i].threshold) {
      current = TIERS[i];
    } else if (!next) {
      next = TIERS[i];
    }
  }
  const prevThreshold = current ? current.threshold : 0;
  const nextThreshold = next ? next.threshold : TIERS[TIERS.length - 1].threshold;
  const pct = next
    ? Math.min(Math.round(((points - prevThreshold) / (nextThreshold - prevThreshold)) * 100), 100)
    : 100;
  return { current, next, pct, remaining: next ? next.threshold - points : 0 };
}

export default function ImpactSection({ points, weeklyCount, streak }) {
  const navigate = useNavigate();
  const currentStreak = streak?.current_streak || 0;
  const { current, next, pct, remaining } = getTierInfo(points);

  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">

      {/* ── Olive gradient header ── */}
      <div
        className="px-4 pb-4 pt-4"
        style={{ background: 'linear-gradient(135deg, #3B5323 0%, #556B2F 52%, #6B8C42 100%)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/55">Community Impact</p>
            <p className="mt-0.5 text-[38px] font-black leading-none text-white">{points}</p>
            <p className="mt-0.5 text-[12px] font-bold text-white/55">
              {current ? `${current.emoji} ${current.name} Tier` : 'Just getting started ✨'}
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white/15">
            <HeartHandshake className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Tier progress */}
        {next ? (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/45">{current?.name || 'Start'}</p>
              <p className="text-[10px] font-bold text-white/45">
                {next.emoji} {next.name} · {remaining} pts away
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-[11px] font-bold text-amber-300">
            💎 Platinum achieved — top of the community!
          </p>
        )}
      </div>

      {/* ── Metric strip ── */}
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <div className="flex flex-col items-center px-2 py-3">
          <Calendar className="mb-1 h-4 w-4 text-slate-400" />
          <p className="text-[18px] font-black leading-none text-slate-950">{weeklyCount}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">This Week</p>
        </div>
        <div className="flex flex-col items-center px-2 py-3">
          <Flame className="mb-1 h-4 w-4 text-orange-400" />
          <p className="text-[18px] font-black leading-none text-slate-950">{currentStreak}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Streak</p>
        </div>
        <div className="flex flex-col items-center px-2 py-3">
          <TrendingUp className="mb-1 h-4 w-4 text-[#6B8C42]" />
          <p className="text-[18px] font-black leading-none text-slate-950">{points}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Total pts</p>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate(createPageUrl('MitzvahCircle'))}
          className="w-full rounded-xl py-2.5 text-[13px] font-black text-[#3B5323] transition active:scale-[0.98]"
          style={{ backgroundColor: 'rgba(85,107,47,0.08)', border: '1px solid rgba(85,107,47,0.18)' }}
        >
          Log a Mitzvah →
        </button>
      </div>
    </div>
  );
}
