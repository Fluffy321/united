import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';

const BADGES = [
  { id: 'first-responder',    name: 'First Responder',       icon: '⚡', threshold: 5,  desc: 'Help 5 people' },
  { id: 'trusted',            name: 'Trusted Helper',         icon: '🤝', threshold: 10, desc: 'Help 10 people' },
  { id: 'event-organizer',    name: 'Event Organizer',        icon: '📅', threshold: 3,  desc: 'Organize 3 events' },
  { id: 'volunteer',          name: 'Community Volunteer',    icon: '❤️', threshold: 25, desc: 'Help 25 people' },
  { id: 'community-connector',name: 'Community Connector',    icon: '🌉', threshold: 10, desc: 'Connect 10 people' },
  { id: 'leader',             name: 'Chesed Leader',          icon: '👑', threshold: 50, desc: 'Help 50 people' },
];

export default function BadgesSection({ user }) {
  const actionCount = user.helper_actions_count || 0;
  const earned = BADGES.filter(b => actionCount >= b.threshold).length;

  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recognition</p>
          <h2 className="text-[15px] font-black text-slate-950">Badges</h2>
        </div>
        {earned > 0 && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700">
            {earned}/{BADGES.length} earned
          </span>
        )}
        {earned === 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
            Start earning →
          </span>
        )}
      </div>

      {/* Horizontal badge scroll */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide">
        {BADGES.map(badge => {
          const isUnlocked = actionCount >= badge.threshold;
          const pct = Math.min(Math.round((actionCount / badge.threshold) * 100), 100);

          return (
            <div
              key={badge.id}
              className={`shrink-0 w-[110px] rounded-2xl border p-3 transition-all ${
                isUnlocked
                  ? 'border-slate-700 bg-gradient-to-br from-slate-950 to-slate-800'
                  : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <span className={`text-[22px] leading-none ${!isUnlocked ? 'grayscale opacity-40' : ''}`}>
                  {badge.icon}
                </span>
                {isUnlocked
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  : <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                }
              </div>
              <p className={`text-[11px] font-black leading-snug ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>
                {badge.name}
              </p>
              <p className={`mt-0.5 text-[9px] font-semibold leading-tight ${isUnlocked ? 'text-white/45' : 'text-slate-400'}`}>
                {badge.desc}
              </p>

              {/* Progress bar */}
              <div className={`mt-2 h-[2px] overflow-hidden rounded-full ${isUnlocked ? 'bg-white/15' : 'bg-slate-200'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isUnlocked ? 'bg-emerald-400' : 'bg-blue-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {!isUnlocked && actionCount > 0 && (
                <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                  {Math.min(actionCount, badge.threshold)}/{badge.threshold}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
