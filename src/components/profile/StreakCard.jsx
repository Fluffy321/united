import React from 'react';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StreakCard({ streak }) {
  const navigate = useNavigate();
  const currentStreak = streak?.current_streak || 0;
  const bestStreak = streak?.best_streak || 0;

  if (currentStreak > 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Flame className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-slate-900">{currentStreak}</div>
            <p className="text-sm text-slate-600">day streak</p>
            {bestStreak > currentStreak && (
              <p className="text-xs text-slate-500 mt-1">Best: {bestStreak} days</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
        <Flame className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">One small mitzvah today?</h3>
        <p className="text-sm text-slate-600 mb-4">Start your week of chesed — every act counts.</p>
        <button
          onClick={() => navigate(createPageUrl('MitzvahCircle'))}
          className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Find a Mitzvah Nearby
        </button>
      </div>
    </div>
  );
}