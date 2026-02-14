import React from 'react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const CATEGORY_COLORS = {
  'Chesed': 'bg-pink-100 text-pink-700',
  'Torah Study': 'bg-blue-100 text-blue-700',
  'Prayer': 'bg-purple-100 text-purple-700',
  'Tzedakah': 'bg-green-100 text-green-700',
  'Kindness': 'bg-orange-100 text-orange-700',
  'Other': 'bg-slate-100 text-slate-700'
};

export default function MitzvahTimeline({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">No mitzvahs logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log, i) => (
        <div key={log.id} className="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-0">
          <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white" />
          
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{log.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {format(parseISO(log.created_date), 'MMM d, yyyy')}
                </p>
              </div>
              <Badge className={`text-xs ${CATEGORY_COLORS[log.category] || CATEGORY_COLORS.Other}`}>
                {log.category}
              </Badge>
            </div>
            
            {log.reflection && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="text-sm text-slate-600 italic">"{log.reflection}"</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}