import React from 'react';
import { FileText, HeartHandshake, UsersRound, UserRound } from 'lucide-react';

const TIERS = [
  { name: 'Bronze', threshold: 5 },
  { name: 'Silver', threshold: 20 },
  { name: 'Gold', threshold: 50 },
  { name: 'Platinum', threshold: 100 },
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
  friends = 0,
  following = 0,
  posts = 0,
  impact = 0,
  onFriendsClick,
  onPostsClick,
  onImpactClick,
  onFollowingClick,
  showFollowing = true,
}) {
  const tier = getNextTier(impact);

  return (
    <div className="px-4 pb-3">
      <div className={`grid ${showFollowing ? 'grid-cols-4' : 'grid-cols-3'} gap-2 rounded-[22px] border border-slate-100 bg-slate-50/80 p-1.5`}>

          <button
            onClick={onFriendsClick}
            className="min-w-0 rounded-2xl border border-white bg-white px-1.5 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
          >
            <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
              <UserRound className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className="text-[19px] font-black leading-none text-slate-950">{friends}</p>
            <p className="mt-1 text-[10px] font-black uppercase leading-tight text-slate-400">Friends</p>
          </button>

          {showFollowing && (
            <button
              onClick={onFollowingClick}
              className="min-w-0 rounded-2xl border border-white bg-white px-1.5 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
                <UsersRound className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-[19px] font-black leading-none text-slate-950">{following}</p>
              <p className="mt-1 text-[9px] font-black uppercase leading-tight text-slate-400">Communities</p>
            </button>
          )}

          {/* ── Posts ── */}
          <button
            onClick={onPostsClick}
            className="min-w-0 rounded-2xl border border-white bg-white px-1.5 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
          >
            <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-purple-50">
              <FileText className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <p className="text-[19px] font-black leading-none text-slate-950">{posts}</p>
            <p className="mt-1 text-[10px] font-black uppercase leading-tight text-slate-400">Posts</p>
          </button>

          {/* ── Impact ── */}
          <button
            onClick={onImpactClick}
            className="min-w-0 rounded-2xl border border-white bg-white px-1.5 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
          >
            <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF6DF]">
              <HeartHandshake className="h-3.5 w-3.5 text-[#6B8C42]" />
            </div>
            <p className="text-[19px] font-black leading-none text-slate-950">{impact}</p>
            <p className="mt-1 text-[10px] font-black uppercase leading-tight text-slate-400">Impact</p>
            {tier ? (
              <div className="mt-1.5 w-full px-1">
                <div className="h-[3px] overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#6B8C42] transition-all duration-500"
                    style={{ width: `${tier.pct}%` }}
                  />
                </div>
                <p className="mt-0.5 truncate text-center text-[8px] font-bold text-[#6B8C42]/80">
                  {tier.remaining} to {tier.name}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-[9px] font-bold text-amber-500">Platinum</p>
            )}
          </button>

      </div>
    </div>
  );
}
