import React from 'react';
import { ArrowRight, CalendarPlus, Clock3, MapPin, RotateCw } from 'lucide-react';

const eventTitle = (event) => event?.title || event?.body || 'Community event';

const eventDateLabel = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
};

export default function HomeTonight({
  window = { mode: 'empty', items: [] },
  isLoading = false,
  isError = false,
  embedded = false,
  onRetry,
  onOpenEvent,
  onOpenAll,
  onAddEvent,
}) {
  const title = window.mode === 'tonight' ? 'Happening tonight' : window.mode === 'upcoming' ? 'Coming up' : 'What’s happening';

  return (
    <section className="space-y-2.5" aria-labelledby={embedded ? undefined : 'home-events-title'} aria-label={embedded ? 'Local plans' : undefined}>
      {!embedded && <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-600">Real local plans</p>
          <h2 id="home-events-title" className="mt-0.5 text-[20px] font-black tracking-[-0.045em] text-[#101A2E]">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Add an event" onClick={onAddEvent} className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><CalendarPlus className="h-4 w-4" /></button>
          <button type="button" aria-label="See all events" onClick={onOpenAll} className="min-h-11 px-1 text-[11px] font-black text-[#2861E8]">See all</button>
        </div>
      </div>}

      {isLoading ? (
        <div className="h-[118px] animate-pulse rounded-[23px] bg-slate-200/70" aria-label="Loading events" />
      ) : isError ? (
        <button type="button" aria-label="Retry events" onClick={onRetry} className="flex min-h-[78px] w-full items-center gap-3 rounded-[22px] border border-rose-100 bg-rose-50 px-4 text-left active:scale-[0.99]">
          <RotateCw className="h-5 w-5 text-rose-600" />
          <span className="flex-1 text-[13px] font-black text-rose-900">Events could not load</span>
          <span className="text-[10px] font-black text-rose-700">Try again</span>
        </button>
      ) : window.items?.length ? (
        <div className="space-y-2">
          {window.items.map((event, index) => {
            const name = eventTitle(event);
            const location = event.location_text || event.location;
            return (
              <button
                key={event.id || `${name}-${index}`}
                type="button"
                aria-label={`Open ${name}`}
                onClick={() => onOpenEvent?.(event)}
                className="flex min-h-[88px] w-full items-center gap-3 rounded-[22px] border border-orange-100 bg-[linear-gradient(135deg,#ffffff_20%,#fff7ed_100%)] px-3.5 py-3 text-left shadow-[0_8px_24px_rgba(124,45,18,0.055)] active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-orange-600 text-white">
                  <span className="text-[8px] font-black uppercase tracking-wide">{window.mode === 'tonight' ? 'Today' : eventDateLabel(event.event_date || event.start_date).split(' ')[0]}</span>
                  <Clock3 className="mt-0.5 h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block line-clamp-2 text-[14px] font-black leading-snug tracking-[-0.02em] text-slate-900">{name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold text-slate-500">
                    {window.mode === 'upcoming' && <span>{eventDateLabel(event.event_date || event.start_date)}</span>}
                    {(event.event_time || event.start_time) && <span>{event.event_time || event.start_time}</span>}
                    {location && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{location}</span>}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-orange-300" />
              </button>
            );
          })}
        </div>
      ) : (
        <button type="button" aria-label="Add an event" onClick={onAddEvent} className="flex min-h-[78px] w-full items-center gap-3 rounded-[22px] border border-dashed border-orange-200 bg-orange-50/70 px-4 text-left active:scale-[0.99]">
          <CalendarPlus className="h-5 w-5 text-orange-600" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-black text-slate-900">No events posted yet</span>
            <span className="mt-0.5 block text-[10px] font-semibold text-slate-500">Know what’s happening? Add it for the Five Towns.</span>
          </span>
          <ArrowRight className="h-4 w-4 text-orange-300" />
        </button>
      )}
    </section>
  );
}
