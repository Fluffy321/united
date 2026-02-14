import React from 'react';
import { Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BADGE_CONFIG = {
  none: { emoji: '⚪', label: 'No Streak', color: 'bg-slate-100 text-slate-600' },
  basic: { emoji: '🔥', label: '2-Day Streak', color: 'bg-orange-100 text-orange-700' },
  silver: { emoji: '⭐', label: '5-Day Streak', color: 'bg-blue-100 text-blue-700' },
  gold: { emoji: '🏆', label: '10-Day Streak', color: 'bg-yellow-100 text-yellow-700' },
  elite: { emoji: '👑', label: '30-Day Streak', color: 'bg-purple-100 text-purple-700' }
};

export default function StreakBadge({ streak, size = 'default' }) {
  if (!streak || streak.current_streak === 0) return null;

  const config = BADGE_CONFIG[streak.badge_level] || BADGE_CONFIG.none;

  if (size === 'small') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-full border border-orange-200">
        <Flame className="w-3 h-3 text-orange-600" />
        <span className="text-xs font-bold text-orange-600">{streak.current_streak}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${config.color}`}>
      <span className="text-2xl">{config.emoji}</span>
      <div>
        <div className="font-bold text-sm">{config.label}</div>
        <div className="text-xs opacity-80">
          Current: {streak.current_streak} days • Best: {streak.longest_streak} days
        </div>
      </div>
    </div>
  );
}