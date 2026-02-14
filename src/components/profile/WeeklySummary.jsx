import React from 'react';
import { Calendar, Heart } from 'lucide-react';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export default function WeeklySummary({ mitzvahCount }) {
  const weekStart = format(startOfWeek(new Date()), 'MMM d');
  const weekEnd = format(endOfWeek(new Date()), 'MMM d');

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-semibold text-slate-700">
          This Week ({weekStart} - {weekEnd})
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-purple-600 fill-current" />
        <p className="text-lg font-bold text-slate-900">
          You helped {mitzvahCount} {mitzvahCount === 1 ? 'person' : 'people'}
        </p>
      </div>
    </div>
  );
}