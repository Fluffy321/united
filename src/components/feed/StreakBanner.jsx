import React from 'react';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BADGE_EMOJIS = {
  none: '⚪',
  basic: '🔥',
  silver: '⭐',
  gold: '🏆',
  elite: '👑'
};

export default function StreakBanner({ streak, todayCount, onLogMitzvah }) {
  const needsReminder = todayCount < 2;
  const remaining = 2 - todayCount;

  if (todayCount >= 2) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 mb-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{BADGE_EMOJIS[streak.badge_level]}</span>
              <span className="font-bold text-lg">{streak.current_streak} Day Streak!</span>
            </div>
            <p className="text-sm text-white/90">You completed 2 mitzvahs today 🎉</p>
          </div>
          <Button
            size="sm"
            onClick={onLogMitzvah}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            Log Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 mb-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5" />
            <span className="font-bold">
              {remaining} more mitzvah{remaining > 1 ? 's' : ''} to keep your streak
            </span>
          </div>
          <p className="text-sm text-white/90">
            Current streak: {streak.current_streak} days
          </p>
        </div>
        <Button
          size="sm"
          onClick={onLogMitzvah}
          className="bg-white text-orange-600 hover:bg-white/90"
        >
          Log Mitzvah
        </Button>
      </div>
    </div>
  );
}