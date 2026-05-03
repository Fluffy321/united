import React, { useMemo, useState } from 'react';
import { Calendar, MapPin, Sparkles, Clock } from 'lucide-react';
import { format, parseISO, startOfToday } from 'date-fns';
import EventRSVPSection from '@/components/events/EventRSVPSection';
import EventSummaryButton from '@/components/events/EventSummaryButton';

// Keywords that tie interests → event body/title text
const INTEREST_KEYWORDS = {
  'Torah & Learning': ['torah', 'shiur', 'parsha', 'daf', 'halacha', 'learning', 'class', 'lecture'],
  'Volunteering': ['volunteer', 'chesed', 'mitzvah', 'charity', 'fundraiser', 'help'],
  'Social': ['dinner', 'party', 'gathering', 'mixer', 'social', 'meetup'],
  'Sports': ['sports', 'game', 'league', 'run', 'tennis', 'basketball', 'softball', 'fitness'],
  'Food': ['food', 'kosher', 'restaurant', 'tasting', 'cooking', 'bake', 'bbq'],
  'Youth': ['youth', 'teens', 'kids', 'children', 'family', 'school'],
  'Music': ['music', 'concert', 'band', 'singing', 'choir'],
  'Business': ['networking', 'business', 'career', 'professional', 'startup'],
};

function scoreEvent(event, userInterests = [], userCity = '') {
  let score = 0;
  const text = `${event.title || ''} ${event.body || ''} ${event.category || ''}`.toLowerCase();
  const loc = `${event.location_text || ''} ${event.city || ''}`.toLowerCase();

  // Location match
  if (userCity && loc.includes(userCity.toLowerCase())) score += 3;

  // Interest keyword match
  for (const interest of userInterests) {
    const keywords = INTEREST_KEYWORDS[interest] || [interest.toLowerCase()];
    if (keywords.some(kw => text.includes(kw))) score += 2;
  }

  // Recency bonus — events sooner get a boost
  if (event.event_date) {
    const daysAway = (new Date(event.event_date) - startOfToday()) / 86400000;
    if (daysAway <= 1) score += 3;
    else if (daysAway <= 3) score += 2;
    else if (daysAway <= 7) score += 1;
  }

  return score;
}

export default function EventsForYou({ currentUser, events = [] }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const recommended = useMemo(() => {
    const userInterests = currentUser?.interests || [];
    const userCity = currentUser?.cityPreset || '';
    return events
      .map(e => ({ ...e, _score: scoreEvent(e, userInterests, userCity) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 10);
  }, [events, currentUser]);

  if (!recommended.length) return null;

  return (
    <>
      <div className="mb-4">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[16px] font-bold text-slate-900">Events For You</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
            {recommended.length}
          </span>
        </div>

        <div className="space-y-3">
          {recommended.map(event => (
            <EventRow
              key={event.id}
              event={event}
              currentUser={currentUser}
              onOpen={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      </div>

      {selectedEvent && (
        <EventSheet
          event={selectedEvent}
          currentUser={currentUser}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}

function EventRow({ event, onOpen }) {
  const dateLabel = event.event_date
    ? format(parseISO(event.event_date), 'EEE, MMM d')
    : null;

  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3 items-start cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      {event.image_url ? (
        <img src={event.image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <Calendar className="w-6 h-6 text-white/80" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2">
          {event.title || event.body?.slice(0, 70)}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[12px] text-slate-400">
          {dateLabel && (
            <span className="flex items-center gap-1 text-blue-600 font-semibold">
              <Calendar className="w-3 h-3" />{dateLabel}
              {event.event_time && <><Clock className="w-3 h-3 ml-0.5" />{event.event_time}</>}
            </span>
          )}
          {event.location_text && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />{event.location_text}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onOpen(); }}
        className="flex-shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-full text-white"
        style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
      >
        View
      </button>
    </div>
  );
}

function EventSheet({ event, currentUser, onClose }) {
  const fullDate = event.event_date ? format(parseISO(event.event_date), 'EEEE, MMMM d, yyyy') : null;

  return (
    <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: '82vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {event.image_url ? (
          <img src={event.image_url} alt="" className="w-full h-44 object-cover" />
        ) : (
          <div className="mx-4 h-32 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Calendar className="w-12 h-12 text-white/80" />
          </div>
        )}

        <div className="px-4 py-4 space-y-3">
          {fullDate && (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600">
              <Calendar className="w-3.5 h-3.5" />{fullDate}
              {event.event_time && <><Clock className="w-3.5 h-3.5 ml-1" />{event.event_time}</>}
            </span>
          )}

          <h2 className="text-[19px] font-bold text-slate-900 leading-snug">
            {event.title || event.body?.slice(0, 80)}
          </h2>

          {event.title && event.body && (
            <p className="text-[14px] text-slate-600 leading-relaxed">{event.body}</p>
          )}

          {event.location_text && (
            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <MapPin className="w-4 h-4 flex-shrink-0" />{event.location_text}
            </div>
          )}

          <p className="text-[12px] text-slate-400">Posted by {event.user_name}</p>

          <div className="mb-2">
            <EventSummaryButton event={event} />
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <EventRSVPSection postId={event.id} currentUser={currentUser} eventDate={event.event_date} />
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}