import React from 'react';
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

export default function CommunityEventsTab({ events, isLoading }) {
  const sorted = (events || []).sort((a, b) => {
    if (!a.start_date) return 1;
    if (!b.start_date) return -1;
    return new Date(a.start_date) - new Date(b.start_date);
  });

  if (isLoading) return (
    <div className="space-y-3 pt-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );

  if (sorted.length === 0) return (
    <div className="text-center py-14">
      <p className="text-3xl mb-2">📅</p>
      <p className="text-[14px] font-semibold text-slate-700">No upcoming events</p>
      <p className="text-[12px] text-slate-400 mt-1">Events will be posted here.</p>
    </div>
  );

  return (
    <div className="space-y-3 pt-4">
      {sorted.map(ev => (
        <div key={ev.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Date banner */}
          {ev.start_date && (
            <div className="bg-[#EEF4FF] px-4 py-2 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-[12px] font-bold text-[#2563EB]">
                {new Date(ev.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              {ev.start_time && (
                <>
                  <span className="text-[#BFD7FF]">·</span>
                  <span className="flex items-center gap-1 text-[12px] text-[#2563EB]">
                    <Clock className="w-3 h-3" />{ev.start_time}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-slate-900 text-[14px]">{ev.title}</h3>
              {ev.is_seeded && (
                <span className="flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0">
                  <Sparkles className="w-2.5 h-2.5" /> Sample
                </span>
              )}
            </div>
            {ev.description && (
              <p className="text-[13px] text-slate-600 leading-relaxed">{ev.description}</p>
            )}
            {ev.location && (
              <div className="flex items-center gap-1.5 mt-2 text-[12px] text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>{ev.location}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}