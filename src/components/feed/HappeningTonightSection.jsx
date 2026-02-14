import React from 'react';
import { Clock, Calendar, HandHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

export default function HappeningTonightSection({ events, mitzvahRequests, onViewEvent, onHelpMitzvah }) {
  const allItems = [
    ...events.map(e => ({ ...e, itemType: 'event', sortTime: e.event_time })),
    ...mitzvahRequests.map(m => ({ ...m, itemType: 'mitzvah', sortTime: '23:59' }))
  ].sort((a, b) => a.sortTime.localeCompare(b.sortTime));

  if (allItems.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-600" />
        Happening Tonight
      </h2>
      <div className="space-y-2">
        {allItems.map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {item.itemType === 'event' ? (
                    <Calendar className="w-4 h-4 text-orange-600" />
                  ) : (
                    <HandHeart className="w-4 h-4 text-purple-600" />
                  )}
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                </div>
                {item.event_time && (
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-indigo-600">{item.event_time}</span>
                    {item.location_text && <span> • {item.location_text}</span>}
                  </p>
                )}
                {item.description && (
                  <p className="text-sm text-slate-600 line-clamp-1">{item.description}</p>
                )}
              </div>
              <Button 
                size="sm"
                onClick={() => item.itemType === 'event' ? onViewEvent(item) : onHelpMitzvah(item)}
                className={item.itemType === 'event' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'}
              >
                {item.itemType === 'event' ? 'Details' : 'Help'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}