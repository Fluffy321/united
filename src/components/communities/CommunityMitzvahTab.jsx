import React from 'react';
import { HandHeart, Calendar, MapPin, Users, Sparkles } from 'lucide-react';

const CATEGORY_COLORS = {
  'Food Drive':     'bg-orange-50 text-orange-700',
  'Bikur Cholim':   'bg-rose-50 text-rose-700',
  'Chesed':         'bg-teal-50 text-teal-700',
  'Tutoring':       'bg-violet-50 text-violet-700',
  'Errands':        'bg-sky-50 text-sky-700',
  'Shabbos Help':   'bg-amber-50 text-amber-700',
  'Other':          'bg-slate-100 text-slate-600',
};

export default function CommunityMitzvahTab({ opportunities, isLoading }) {
  const active = (opportunities || []).filter(o => o.is_active !== false);

  if (isLoading) return (
    <div className="space-y-3 pt-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-full rounded" />
        </div>
      ))}
    </div>
  );

  if (active.length === 0) return (
    <div className="text-center py-14">
      <p className="text-3xl mb-2">🤝</p>
      <p className="text-[14px] font-semibold text-slate-700">No opportunities right now</p>
      <p className="text-[12px] text-slate-400 mt-1">Chesed and mitzvah opportunities will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-3 pt-4">
      {active.map(op => {
        const colorClass = CATEGORY_COLORS[op.category] || CATEGORY_COLORS.Other;
        const slotsFilled = op.slots_filled || 0;
        const slotsNeeded = op.slots_needed || 1;
        const spotsLeft = slotsNeeded - slotsFilled;

        return (
          <div key={op.id} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
                  {op.category}
                </span>
                {op.is_seeded && (
                  <span className="flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                    <Sparkles className="w-2.5 h-2.5" /> Sample
                  </span>
                )}
              </div>
              {spotsLeft > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <Users className="w-3 h-3" />{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                </span>
              )}
            </div>

            <h3 className="font-bold text-slate-900 text-[14px] mb-1">{op.title}</h3>
            {op.description && <p className="text-[13px] text-slate-600 leading-relaxed mb-2">{op.description}</p>}

            <div className="flex flex-wrap gap-3">
              {op.event_date && (
                <span className="flex items-center gap-1 text-[12px] text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(op.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {op.event_time && ` · ${op.event_time}`}
                </span>
              )}
              {op.location && (
                <span className="flex items-center gap-1 text-[12px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />{op.location}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}