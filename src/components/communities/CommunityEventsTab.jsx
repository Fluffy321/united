import React, { useState, useEffect } from 'react';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { MapPin, Clock, Plus, Ticket, Users } from 'lucide-react';
import CreateCommunityEventModal from './CreateCommunityEventModal';
import EventTicketSection from './EventTicketSection';
import EventAttendeesAdmin from './EventAttendeesAdmin';
import {
  FREE_COMMUNITY_LIMITS,
  canCreateCommunityEvent,
  countUpcomingPublishedCommunityEvents,
  isCommunityPremium,
} from '@/lib/communityPlans';

function EventCard({ event, past, currentUser, isAdmin, highlight }) {
  const [showAdminAttendees, setShowAdminAttendees] = useState(false);
  const dateStr = event.start_date || event.event_date;
  const gradient = past ? 'from-slate-400 to-slate-500' : 'from-green-500 to-teal-600';

  return (
    <div
      id={`event-card-${event.id}`}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${past ? 'border-slate-100 opacity-75' : 'border-slate-100'} ${highlight ? 'ring-2 ring-blue-300' : ''}`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-4">
        <div className="flex gap-4">
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
            <div className="flex items-start gap-2">
              <p className={`flex-1 text-[15px] font-bold leading-snug ${past ? 'text-slate-500' : 'text-slate-900'}`}>
                {event.title || event.name}
              </p>
              {event.has_tickets && !past && (
                <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                  event.is_free ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <Ticket className="w-3 h-3" />
                  {event.is_free ? 'Free' : `$${event.ticket_price}`}
                </span>
              )}
            </div>
            {dateStr && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <Clock className="w-3 h-3" />{format(parseISO(dateStr), 'EEEE, MMMM d')}
                {event.start_time && ` · ${event.start_time}`}
              </p>
            )}
            {(event.location_text || event.location) && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3" />{event.location_text || event.location}
              </p>
            )}
            {event.description && (
              <p className="text-[12px] text-slate-500 mt-1.5 line-clamp-2">{event.description}</p>
            )}
          </div>
        </div>

        {/* Ticket / RSVP section */}
        <EventTicketSection event={event} currentUser={currentUser} past={past} />

        {past && (
          <span className="mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">Past event</span>
        )}

        {/* Admin: view attendees */}
        {isAdmin && (
          <button
            onClick={() => setShowAdminAttendees(true)}
            className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-full px-3 py-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" /> Manage Attendees
          </button>
        )}
      </div>

      {showAdminAttendees && (
        <EventAttendeesAdmin event={event} onClose={() => setShowAdminAttendees(false)} />
      )}
    </div>
  );
}

const EVENT_EMPTY_BY_TYPE = {
  neighborhood: { emoji: '🏘️', body: 'Add a neighborhood meetup, school event, or community gathering.' },
  shul: { emoji: '🕍', body: 'Add a Shabbos event, holiday program, or community learning.' },
  chesed: { emoji: '🤝', body: 'Add a volunteer day, chesed gathering, or community help event.' },
  learning: { emoji: '📚', body: 'Schedule a shiur, chavrusa session, or learning event.' },
  parents: { emoji: '👨‍👩‍👧', body: 'Share a school event, camp activity, or family gathering.' },
  events: { emoji: '🎉', body: 'Create the first event — gatherings, programs, and socials.' },
};

export default function CommunityEventsTab({ events: initialEvents, community, currentUser, communityId, isAdmin, highlightEventId = null, typeConfig }) {
  const [events, setEvents] = useState(initialEvents || []);
  const [showCreate, setShowCreate] = useState(false);

  // Keep in sync if parent re-fetches
  useEffect(() => { setEvents(initialEvents || []); }, [initialEvents]);

  useEffect(() => {
    if (!highlightEventId) return;
    requestAnimationFrame(() => {
      document.getElementById(`event-card-${highlightEventId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [highlightEventId]);

  const upcoming = events.filter(e => {
    const d = e.start_date || e.event_date;
    return !d || isFuture(parseISO(d));
  });
  const past = events.filter(e => {
    const d = e.start_date || e.event_date;
    return d && isPast(parseISO(d));
  });

  const handleCreated = (newEvent) => {
    setEvents(prev => [newEvent, ...prev]);
    setShowCreate(false);
  };

  const upcomingPublishedCount = countUpcomingPublishedCommunityEvents(events);
  const premium = isCommunityPremium(community);
  const canCreate = canCreateCommunityEvent(community, upcomingPublishedCount);
  const freeLimit = FREE_COMMUNITY_LIMITS.upcomingPublishedEvents;

  const handleAddEvent = () => {
    if (!canCreate) return;
    setShowCreate(true);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Admin: create button */}
      {isAdmin && canCreate && (
        <button
          onClick={handleAddEvent}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-2xl py-3 text-[14px] font-bold hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      )}
      {isAdmin && !canCreate && (
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-[14px] font-black text-blue-950">Free event limit reached</p>
          <p className="mt-1 text-[13px] font-semibold leading-5 text-blue-700">
            Free communities can have up to {freeLimit} upcoming published events. Upgrade to Premium for unlimited events.
          </p>
        </div>
      )}
      {!premium && (
        <p className="rounded-2xl border border-slate-100 bg-white px-4 py-2 text-[12px] font-semibold text-slate-500">
          Free plan: {Math.min(upcomingPublishedCount, freeLimit)} of {freeLimit} upcoming published events used.
        </p>
      )}

      {events.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 px-5 py-8 text-center">
          <div className="text-3xl mb-2">{(EVENT_EMPTY_BY_TYPE[typeConfig?.key] || {}).emoji || '📅'}</div>
          <p className="text-[14px] font-bold text-slate-900">No events yet</p>
          <p className="text-[12px] text-slate-500 mt-1 leading-5">
            {isAdmin ? 'Create your first event above.' : ((EVENT_EMPTY_BY_TYPE[typeConfig?.key] || {}).body || 'Upcoming events will appear here.')}
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="text-[13px] font-bold text-slate-700 mb-2">Upcoming</p>
              <div className="space-y-3">
                {upcoming.map(e => <EventCard key={e.id} event={e} currentUser={currentUser} isAdmin={isAdmin} highlight={e.id === highlightEventId} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-[13px] font-bold text-slate-400 mb-2">Past Events</p>
              <div className="space-y-3">
                {past.map(e => <EventCard key={e.id} event={e} past currentUser={currentUser} isAdmin={isAdmin} />)}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateCommunityEventModal
          communityId={communityId}
          community={community}
          currentUser={currentUser}
          upcomingPublishedEventCount={upcomingPublishedCount}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
