import React from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WeeklySummaryCard({ mitzvahCount }) {
  const navigate = useNavigate();
  const now = new Date();
  const weekStart = format(startOfWeek(now), 'MMM d');
  const weekEnd = format(endOfWeek(now), 'MMM d');

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">This Week</p>
        <p className="text-sm text-slate-600 mb-3">{weekStart} - {weekEnd}</p>
        
        {mitzvahCount === 0 ? (
          <div className="text-center py-4">
            <p className="text-slate-600 text-sm mb-3">Your first mitzvah is waiting!</p>
            <button
              onClick={() => navigate(createPageUrl('MitzvahCircle'))}
              className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Log Now
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xl font-bold text-slate-900 mb-1">You helped {mitzvahCount} {mitzvahCount === 1 ? 'person' : 'people'} this week</p>
            <button
              onClick={() => navigate(createPageUrl('MitzvahCircle'))}
              className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
            >
              View Details →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}