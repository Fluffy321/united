import React from 'react';
import { Flame } from 'lucide-react';

const BADGE_EMOJIS = {
  none: '⚪',
  basic: '🔥',
  silver: '⭐',
  gold: '🏆',
  elite: '👑'
};

export default function StreakProgress({ todayCount, streak }) {
  const progress = Math.min((todayCount / 2) * 100, 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{BADGE_EMOJIS[streak.badge_level]}</span>
          <span className="text-sm font-semibold text-slate-700">
            Today's Progress: {todayCount} / 2 mitzvahs
          </span>
        </div>
        {streak.current_streak > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-orange-600">{streak.current_streak}</span>
          </div>
        )}
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}