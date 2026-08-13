import React from 'react';
import { ArrowRight, CalendarDays, Loader2, Sun } from 'lucide-react';

function formatTime(value, timeZone) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timeZone || undefined,
  }).format(date);
}

export default function MeTodaySummary({
  firstName,
  jewishTime,
  jewishLocation,
  timeZone,
  nextPlan,
  onOpenJewish,
  onOpenPlan,
  isLoading,
  hasError,
}) {
  const time = formatTime(jewishTime?.date, timeZone);

  return (
    <section data-testid="me-today-summary" className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/80 p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}</p>
      <h2 className="mt-1 text-[23px] font-black tracking-[-0.04em] text-slate-950">Your JUnited today</h2>
      <p className="mt-1 text-[12px] font-semibold text-slate-500">The personal things worth checking.</p>

      <div className="mt-4 grid grid-cols-[0.9fr_1.1fr] gap-2">
        <button
          type="button"
          onClick={onOpenJewish}
          className="min-h-[116px] rounded-2xl border border-slate-200 bg-white p-3 text-left transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-slate-400">
            <Sun className="h-3.5 w-3.5 text-amber-500" /> Next Jewish time
          </span>
          {isLoading ? (
            <span className="mt-5 flex items-center gap-2 text-[12px] font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading</span>
          ) : hasError || !time ? (
            <><span className="mt-4 block text-[14px] font-black text-slate-700">Times unavailable</span><span className="mt-1 block text-[10px] text-blue-600">Open Jewish Hub</span></>
          ) : (
            <><span className="mt-4 block text-[20px] font-black tracking-[-0.03em] text-slate-950">{time}</span><span className="mt-0.5 block text-[10px] font-bold text-slate-600">{jewishTime.label}</span><span className="mt-1 block line-clamp-1 text-[9px] text-slate-400">{jewishLocation}</span></>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenPlan}
          className="min-h-[116px] rounded-2xl bg-slate-950 p-3 text-left text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)] transition active:scale-[0.98]"
        >
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-blue-200">
            <CalendarDays className="h-3.5 w-3.5" /> Next plan
          </span>
          {nextPlan ? (
            <><span className="mt-3 line-clamp-2 block text-[14px] font-black leading-tight">{nextPlan.title || 'Personal update'}</span><span className="mt-1 line-clamp-2 block text-[10px] leading-relaxed text-slate-300">{nextPlan.body || nextPlan.message}</span><span className="mt-2 flex items-center gap-1 text-[10px] font-black text-blue-300">Open <ArrowRight className="h-3 w-3" /></span></>
          ) : (
            <><span className="mt-4 block text-[14px] font-black">Nothing planned yet</span><span className="mt-1 block text-[10px] leading-relaxed text-slate-300">Find an event or community plan.</span><span className="mt-2 flex items-center gap-1 text-[10px] font-black text-blue-300">Browse plans <ArrowRight className="h-3 w-3" /></span></>
          )}
        </button>
      </div>
    </section>
  );
}
