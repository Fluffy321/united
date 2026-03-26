import React, { useState } from 'react';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, startOfToday, addDays, isBefore, isAfter } from 'date-fns';
import CommentsSheet from './CommentsSheet';
import EventRSVPSection from '@/components/events/EventRSVPSection';

export default function ThisWeekEvents({ currentUser }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: events = [] } = useQuery({
    queryKey: ['this-week-events'],
    queryFn: async () => {
      const all = await base44.entities.UnifiedPost.filter({ type: 'event' }, 'event_date', 60);
      const today = startOfToday();
      const weekEnd = addDays(today, 7);
      return all.filter(e => {
        if (!e.event_date) return false;
        const d = parseISO(e.event_date);
        return !isBefore(d, today) && isBefore(d, weekEnd);
      }).sort((a, b) => a.event_date.localeCompare(b.event_date));
    },
    staleTime: 120000,
    retry: 0,
  });

  if (!events.length) return null;

  return (
    <>
      <div className="mb-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base">📅</span>
            <span className="text-[14px] font-bold text-slate-900">This Week</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 ml-0.5">
              {events.length}
            </span>
          </div>
          <a
            href="/Events"
            className="flex items-center gap-0.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            See all <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Horizontal scroll strip */}
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              currentUser={currentUser}
              onJoin={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      </div>

      {/* Event detail bottom sheet */}
      {selectedEvent && (
        <EventDetailSheet
          event={selectedEvent}
          currentUser={currentUser}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}

function EventCard({ event, currentUser, onJoin }) {
  const dateLabel = event.event_date
    ? format(parseISO(event.event_date), 'EEE, MMM d')
    : null;

  const bgColors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-emerald-500 to-emerald-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
  ];
  const colorIdx = event.id ? event.id.charCodeAt(0) % bgColors.length : 0;
  const gradient = bgColors[colorIdx];

  return (
    <div
      className="flex-shrink-0 w-52 rounded-2xl overflow-hidden bg-white border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      onClick={onJoin}
    >
      {/* Header band */}
      {event.image_url ? (
        <img src={event.image_url} alt="" className="w-full h-24 object-cover" />
      ) : (
        <div className={`w-full h-24 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Calendar className="w-8 h-8 text-white/80" />
        </div>
      )}

      <div className="p-3">
        {/* Date */}
        {dateLabel && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 mb-1">
            <Calendar className="w-3 h-3" />
            {dateLabel}
            {event.event_time && (
              <><Clock className="w-3 h-3 ml-1" />{event.event_time}</>
            )}
          </div>
        )}

        {/* Title */}
        <p className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
          {event.title || event.body?.slice(0, 60)}
        </p>

        {/* Location */}
        {event.location_text && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{event.location_text}</span>
          </div>
        )}

        {/* Join button */}
        <button
          onClick={e => { e.stopPropagation(); onJoin(); }}
          className="w-full py-1.5 rounded-xl bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors"
        >
          Join Event
        </button>
      </div>
    </div>
  );
}

function EventDetailSheet({ event, currentUser, onClose }) {
  const dateLabel = event.event_date
    ? format(parseISO(event.event_date), 'EEEE, MMMM d, yyyy')
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="mt-auto bg-white rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Image or gradient banner */}
        {event.image_url ? (
          <img src={event.image_url} alt="" className="w-full h-44 object-cover" />
        ) : (
          <div className="mx-4 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2">
            <Calendar className="w-12 h-12 text-white/80" />
          </div>
        )}

        <div className="px-4 py-4 space-y-3">
          {/* Date + time */}
          {dateLabel && (
            <div className="flex items-center gap-2 text-[13px] font-bold text-blue-600">
              <Calendar className="w-4 h-4" />
              {dateLabel}
              {event.event_time && (
                <><Clock className="w-4 h-4 ml-1" />{event.event_time}</>
              )}
            </div>
          )}

          <h2 className="text-[18px] font-bold text-slate-900 leading-snug">
            {event.title || event.body?.slice(0, 80)}
          </h2>

          {event.title && event.body && (
            <p className="text-[14px] text-slate-600 leading-relaxed">{event.body}</p>
          )}

          {event.location_text && (
            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {event.location_text}
            </div>
          )}

          <div className="text-[12px] text-slate-400">Posted by {event.user_name}</div>

          {/* RSVP section */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <EventRSVPSection
              postId={event.id}
              currentUser={currentUser}
              eventDate={event.event_date}
            />
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}