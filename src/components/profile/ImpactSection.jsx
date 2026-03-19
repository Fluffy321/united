import React from 'react';
import { Star, Calendar, Flame } from 'lucide-react';

export default function ImpactSection({ points, weeklyCount, streak }) {
  const currentStreak = streak?.current_streak || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Your Impact</h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Points */}
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <Star className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{points}</p>
            <p className="text-xs text-slate-600 mt-1">Points</p>
          </div>

          {/* This Week */}
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{weeklyCount}</p>
            <p className="text-xs text-slate-600 mt-1">This Week</p>
          </div>

          {/* Streak */}
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <Flame className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{currentStreak}</p>
            <p className="text-xs text-slate-600 mt-1">Day Streak</p>
          </div>
        </div>
      </div>
    </div>
  );
}