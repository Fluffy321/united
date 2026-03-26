import React, { useState } from 'react';
import { ChevronDown, Heart, Book, Handshake, Lightbulb } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORY_ICONS = {
  prayer: { icon: Lightbulb, label: 'Prayer' },
  kindness: { icon: Heart, label: 'Kindness' },
  learning: { icon: Book, label: 'Learning' },
  chesed: { icon: Handshake, label: 'Chesed' }
};

export default function MitzvahJourneySection({ logs }) {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const displayLogs = showAll ? logs : logs.slice(0, 5);

  // Group by month
  const grouped = {};
  displayLogs.forEach(log => {
    const month = format(parseISO(log.date), 'MMMM yyyy');
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(log);
  });

  const capitalizeTitle = (text) => {
    if (!text) return 'Activity';
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">Mitzvah Journey</h2>
          <button
            onClick={() => navigate(createPageUrl('MitzvahCircle'))}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Log Mitzvah
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{month}</p>
              <div className="space-y-2">
                {items.map(log => {
                  const categoryInfo = CATEGORY_ICONS[log.category] || { icon: Heart, label: 'Activity' };
                  const Icon = categoryInfo.icon;
                  const title = log.description || log.title || categoryInfo.label;
                  return (
                    <div key={log.id} className="flex gap-3 p-2 hover:bg-slate-50 rounded transition-colors">
                      <Icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {capitalizeTitle(title)}
                        </p>
                        {log.reflection && (
                          <p className="text-xs text-slate-500 italic mt-1">"{log.reflection}"</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {logs.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            {showAll ? 'Show Less' : 'View All'} <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}