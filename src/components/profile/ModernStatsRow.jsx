import React from 'react';
import { FileText, HeartHandshake } from 'lucide-react';

const TIERS = [
  { name: 'Bronze', threshold: 5 },
  { name: 'Silver', threshold: 20 },
  { name: 'Gold', threshold: 50 },
  { name: 'Platinum', threshold: 100 },
];

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
  return null;
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
    <div className="px-3 py-2">
      <div className="overflow-hidden rounded-[20px] bg-slate-950 shadow-lg shadow-slate-900/25">
        <div className="grid grid-cols-3 divide-x divide-white/10">

          {/* ── Connections ── */}
          <button
            onClick={onFollowingClick}
            className="flex flex-col items-center px-2 py-4 transition-colors active:bg-white/5"
          >
            <div className="mb-2 flex items-center justify-center">
              {pileCount > 0
                ? Array.from({ length: pileCount }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 w-5 shrink-0 rounded-full bg-gradient-to-br ${PILE_GRADIENTS[i]} ring-[1.5px] ring-slate-950 ${i > 0 ? '-ml-1' : ''}`}
                    />
                  ))
                : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                    <span className="text-[8px] font-black text-white/40">+</span>
                  </div>
                )
              }
            </div>
            <p className="text-[22px] font-black leading-none text-white">{following}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/35">Connections</p>
          </button>

          {/* ── Posts ── */}
          <button
            onClick={onPostsClick}
            className="flex flex-col items-center px-2 py-4 transition-colors active:bg-white/5"
          >
            <div className="mb-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/25">
              <FileText className="h-3 w-3 text-purple-300" />
            </div>
            <p className="text-[22px] font-black leading-none text-white">{posts}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/35">Posts</p>
          </button>

          {/* ── Impact ── */}
          <button
            onClick={onImpactClick}
            className="flex flex-col items-center px-2 py-4 transition-colors active:bg-white/5"
          >
            <div className="mb-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#6B8C42]/30">
              <HeartHandshake className="h-3 w-3 text-[#A3C068]" />
            </div>
            <p className="text-[22px] font-black leading-none text-white">{impact}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/35">Impact</p>
            {tier ? (
              <div className="mt-1.5 w-full px-3">
                <div className="h-[2px] overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-[#A3C068] transition-all duration-500"
                    style={{ width: `${tier.pct}%` }}
                  />
                </div>
                <p className="mt-0.5 text-center text-[8px] font-bold text-[#A3C068]/70">
                  {tier.remaining} to {tier.name}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-[9px] font-bold text-amber-400">Platinum ★</p>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
