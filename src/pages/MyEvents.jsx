import React from 'react';
import { Calendar, ChevronLeft, Clock, Loader2, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { format, isBefore, parseISO, startOfToday } from 'date-fns';
import EventTicketSection from '@/components/communities/EventTicketSection';

function EventCard({ event, currentUser, showRsvp }) {
  const dateStr = event.start_date || event.event_date;
  const past = dateStr ? isBefore(parseISO(dateStr), startOfToday()) : false;
  const communityName = event.community?.name;

  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm${past ? ' opacity-70' : ''}`}>
      <div className="flex gap-3">
        {/* Date badge */}
        <div className={`flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br shadow-sm text-white ${past ? 'from-slate-400 to-slate-500' : 'from-blue-500 to-indigo-600'}`}>
          {dateStr ? (
            <>
              <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">{format(parseISO(dateStr), 'MMM')}</span>
              <span className="text-[20px] font-black leading-none">{format(parseISO(dateStr), 'd')}</span>
            </>
          ) : (
            <Calendar className="h-5 w-5 opacity-80" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {communityName && (
            <span className="mb-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
              {communityName}
            </span>
          )}
          <p className="text-[14px] font-bold leading-snug text-slate-900">{event.title}</p>
          {dateStr && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="h-3 w-3" />
              {format(parseISO(dateStr), 'EEE, MMM d')}
              {(event.start_time || event.event_time) && ` · ${event.start_time || event.event_time}`}
            </p>
          )}
          {(event.location_text || event.location) && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3" />
              {event.location_text || event.location}
            </p>
          )}
        </div>
      </div>

      {showRsvp && (
        <div className="mt-3">
          <EventTicketSection event={event} currentUser={currentUser} past={past} />
        </div>
      )}
    </div>
  );
}

export default function MyEvents() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const { data: goingEvents = [], isLoading: loadingGoing } = useQuery({
    queryKey: ['my-going-events', currentUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_event_rsvps')
        .select('*, event:community_events(*, community:communities(id, name))')
        .eq('user_id', currentUser.id)
        .eq('status', 'going')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(r => r.event).filter(Boolean);
    },
    enabled: !!currentUser,
    staleTime: 60_000,
  });

  const { data: createdEvents = [], isLoading: loadingCreated } = useQuery({
    queryKey: ['my-created-events', currentUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_events')
        .select('*, community:communities(id, name)')
        .eq('created_by', currentUser.id)
        .order('start_date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser,
    staleTime: 60_000,
  });

  const isLoading = loadingGoing || loadingCreated;
  const isEmpty = !isLoading && goingEvents.length === 0 && createdEvents.length === 0;

  return (
    <div className="app-page">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-100 bg-white shadow-sm">
        <div className="mx-auto flex h-12 max-w-2xl items-center gap-2 px-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-1.5 transition-colors hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">My Events</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-4 pb-28">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : isEmpty ? (
          <div className="py-16 text-center">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-bold text-slate-700">No events yet</p>
            <p className="mt-1 text-[13px] text-slate-400">
              RSVP to events in your communities to see them here.
            </p>
            <Link
              to="/Events"
              className="app-button-primary mt-4 inline-block rounded-full px-5 text-[13px]"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <>
            {goingEvents.length > 0 && (
              <section>
                <h2 className="mb-3 text-[12px] font-black uppercase tracking-wider text-slate-500">
                  Going ({goingEvents.length})
                </h2>
                <div className="space-y-3">
                  {goingEvents.map(event => (
                    <EventCard key={event.id} event={event} currentUser={currentUser} showRsvp />
                  ))}
                </div>
              </section>
            )}

            {createdEvents.length > 0 && (
              <section>
                <h2 className="mb-3 text-[12px] font-black uppercase tracking-wider text-slate-500">
                  Events I Created ({createdEvents.length})
                </h2>
                <div className="space-y-3">
                  {createdEvents.map(event => (
                    <EventCard key={event.id} event={event} currentUser={currentUser} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
