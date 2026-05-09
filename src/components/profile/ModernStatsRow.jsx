import React from 'react';
import { FileText, HeartHandshake } from 'lucide-react';

const TIERS = [
  { name: 'Bronze', threshold: 5 },
  { name: 'Silver', threshold: 20 },
  { name: 'Gold', threshold: 50 },
  { name: 'Platinum', threshold: 100 },
];

// Decorative face-pile colors — one per slot, deterministic
const PILE_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-500',
];

function getNextTier(points) {
  for (let i = 0; i < TIERS.length; i++) {
    if (points < TIERS[i].threshold) {
      const prev = i > 0 ? TIERS[i - 1].threshold : 0;
      const pct = Math.round(((points - prev) / (TIERS[i].threshold - prev)) * 100);
      return { name: TIERS[i].name, remaining: TIERS[i].threshold - points, pct };
    }
  }
  return null; // Platinum achieved
}

export default function ModernStatsRow({
  following = 0,
  posts = 0,
  impact = 0,
  onPostsClick,
  onImpactClick,
  onFollowingClick,
}) {
  const tier = getNextTier(impact);
  const pileCount = Math.min(following, 4);

  return (
    <div className="px-3 py-3">
      <div className="grid grid-cols-3 gap-2.5">

        {/* ── Connections card ── */}
        <button
          onClick={onFollowingClick}
          className="rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition-all duration-200 active:scale-95 hover:shadow-md"
        >
          {/* Face-pile */}
          <div className="mb-2 flex items-center">
            {pileCount > 0
              ? Array.from({ length: pileCount }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${PILE_GRADIENTS[i]} ring-[2px] ring-white ${i > 0 ? '-ml-1.5' : ''}`}
                  />
                ))
              : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 ring-[2px] ring-white">
                  <span className="text-[9px] font-black text-slate-400">+</span>
                </div>
              )}
            {following > 4 && (
              <span className="ml-1 text-[10px] font-black text-slate-400">+{following - 4}</span>
            )}
          </div>
          <p className="text-xl font-black text-slate-950">{following}</p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Connections</p>
        </button>

        {/* ── Posts card ── */}
        <button
          onClick={onPostsClick}
          className="rounded-[18px] border border-purple-100 bg-purple-50 px-3 py-3 text-center shadow-sm transition-all duration-200 active:scale-95 hover:shadow-md"
        >
          <div className="mb-2 mx-auto flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <p className="text-xl font-black text-slate-950">{posts}</p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Posts</p>
        </button>

        {/* ── Impact card — olive green ── */}
        <button
          onClick={onImpactClick}
          className="rounded-[18px] px-3 py-3 text-left shadow-sm transition-all duration-200 active:scale-95 hover:shadow-md"
          style={{
            background: 'linear-gradient(135deg, #3B5323 0%, #556B2F 55%, #6B8C42 100%)',
            border: '1px solid rgba(85,107,47,0.35)',
          }}
        >
          <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
            <HeartHandshake className="h-4 w-4 text-white" />
          </div>
          <p className="text-xl font-black text-white">{impact}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">Impact</p>

          {/* Milestone progress bar */}
          {tier ? (
            <div className="mt-2">
              <div className="h-[3px] overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white/80 transition-all duration-500"
                  style={{ width: `${tier.pct}%` }}
                />
              </div>
              <p className="mt-1 text-[9px] font-bold leading-tight text-white/65">
                {tier.remaining} until {tier.name}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-[9px] font-bold leading-tight text-amber-300">Platinum ★</p>
          )}
        </button>

      </div>
    </div>
  );
}
