import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';

const HEBCAL_BASE = 'https://www.hebcal.com';

// Fetch the next 60 days of major Jewish calendar events
async function getUpcomingEvents() {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const res = await fetch(
    `${HEBCAL_BASE}/hebcal?v=1&cfg=json&maj=on&min=on&mod=off&nx=on&ss=off&mf=on&start=${start}&end=${end}&tzid=America/New_York`
  );
  const data = await res.json();
  // Keep holidays, fasts, Rosh Chodesh — filter noise
  return (data.items || []).filter(i =>
    i.category === 'holiday' ||
    i.category === 'roshchodesh' ||
    i.category === 'mevarchim' ||
    (i.category === 'minor' && /fast|tzom|taanis/i.test(i.title))
  );
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function labelForDays(n) {
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return `${n} days`;
}

const CATEGORY_COLORS = {
  holiday: 'bg-blue-600',
  roshchodesh: 'bg-teal-600',
  mevarchim: 'bg-slate-500',
  minor: 'bg-orange-500',
};

const CATEGORY_CARD = {
  holiday: 'border-blue-100 bg-blue-50',
  roshchodesh: 'border-teal-100 bg-teal-50',
  mevarchim: 'border-slate-100 bg-slate-50',
  minor: 'border-orange-100 bg-orange-50',
};

const CATEGORY_TEXT = {
  holiday: 'text-blue-700',
  roshchodesh: 'text-teal-700',
  mevarchim: 'text-slate-600',
  minor: 'text-orange-700',
};

export default function JewishCountdown() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['jewish-countdown', new Date().toDateString()],
    queryFn: getUpcomingEvents,
    staleTime: 6 * 60 * 60 * 1000,
  });

  // Take the next 4 distinct upcoming events (skip past ones)
  const upcoming = events
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .slice(0, 4);

  if (isLoading || upcoming.length === 0) return null;

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Jewish Calendar</p>
        </div>
        <h2 className="mt-0.5 text-[17px] font-black text-slate-950">Coming Up</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {upcoming.map((event, i) => {
          const cat = event.category || 'holiday';
          const pill = CATEGORY_COLORS[cat] || 'bg-slate-600';
          const card = CATEGORY_CARD[cat] || 'border-slate-100 bg-slate-50';
          const text = CATEGORY_TEXT[cat] || 'text-slate-700';
          const days = event.days;

          return (
            <div key={i} className={`rounded-[18px] border ${card} px-3 py-3`}>
              <div className="flex items-start justify-between gap-1">
                <p className={`text-[13px] font-black leading-tight ${text}`}>{event.title}</p>
                <span className={`mt-0.5 shrink-0 rounded-full ${pill} px-2 py-0.5 text-[10px] font-black text-white`}>
                  {labelForDays(days)}
                </span>
              </div>
              {event.hebrew && (
                <p
                  dir="rtl"
                  lang="he"
                  className={`mt-1 text-right text-[12px] font-semibold ${text} opacity-70`}
                  style={{ fontFamily: 'var(--font-hebrew)' }}
                >
                  {event.hebrew}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
