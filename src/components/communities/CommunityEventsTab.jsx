import React, { useState } from 'react';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { MapPin, Clock, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

function EventCard({ event, past = false }) {
  const [rsvp, setRsvp] = useState(false);
  const dateStr = event.start_date || event.event_date;
  const gradient = past ? 'from-slate-400 to-slate-500' : 'from-green-500 to-teal-600';

  const handleRsvp = () => {
    if (past) return;
    setRsvp(r => !r);
    toast.success(rsvp ? 'RSVP removed' : "You're going! 🎉");
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${past ? 'border-slate-100 opacity-75' : 'border-slate-100'}`}>
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-4 flex gap-4">
        {/* Date badge */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white shadow-sm`}>
          {dateStr ? (
            <>
              <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">{format(parseISO(dateStr), 'MMM')}</span>
              <span className="text-[22px] font-black leading-none">{format(parseISO(dateStr), 'd')}</span>
            </>
          ) : (
            <span className="text-[11px] font-bold">TBD</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-[15px] font-bold leading-snug ${past ? 'text-slate-500' : 'text-slate-900'}`}>
            {event.title || event.name}
          </p>
          {dateStr && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3" />{format(parseISO(dateStr), 'EEEE, MMMM d')}
              {event.start_time && ` · ${event.start_time}`}
            </p>
          )}
          {event.location_text && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <MapPin className="w-3 h-3" />{event.location_text}
            </p>
          )}
          {event.description && (
            <p className="text-[12px] text-slate-500 mt-1.5 line-clamp-2">{event.description}</p>
          )}

          {!past && (
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleRsvp}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition-all active:scale-95 ${
                  rsvp
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {rsvp ? <><CheckCircle className="w-3.5 h-3.5" /> Going</> : '+ RSVP'}
              </button>
              {event.attendee_count > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Users className="w-3 h-3" /> {event.attendee_count} going
                </span>
              )}
            </div>
          )}
          {past && (
            <span className="mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">Past event</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommunityEventsTab({ events }) {
  const now = new Date();
  const upcoming = events.filter(e => {
    const d = e.start_date || e.event_date;
    return !d || isFuture(parseISO(d));
  });
  const past = events.filter(e => {
    const d = e.start_date || e.event_date;
    return d && isPast(parseISO(d));
  });

  if (events.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center mb-4">
        <div className="text-4xl mb-3">📅</div>
        <p className="text-[15px] font-bold text-slate-900">No events yet</p>
        <p className="text-[13px] text-slate-500 mt-1">Upcoming events will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {upcoming.length > 0 && (
        <div>
          <p className="text-[13px] font-bold text-slate-700 mb-2">Upcoming</p>
          <div className="space-y-3">
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <p className="text-[13px] font-bold text-slate-400 mb-2">Past Events</p>
          <div className="space-y-3">
            {past.map(e => <EventCard key={e.id} event={e} past />)}
          </div>
        </div>
      )}
    </div>
  );
}