import React, { useState } from 'react';
import { Calendar, MapPin, Clock, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isBefore, startOfToday, addDays } from 'date-fns';
import EventTicketSection from '@/components/communities/EventTicketSection';
import QueryError from '@/components/common/QueryError';

const FILTERS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today',    label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'past',     label: 'Past' },
];

function EventCard({ event, currentUser }) {
  const dateStr = event.start_date || event.event_date;
  const past = dateStr ? isBefore(parseISO(dateStr), startOfToday()) : false;
  const communityName = event.community?.name;

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden${past ? ' opacity-70' : ''}`}>
      {event.cover_url && (
        <img src={event.cover_url} alt="" className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        {communityName && (
          <span className="mb-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
            {communityName}
          </span>
        )}

        <div className="flex gap-4">
          {/* Date badge */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br flex flex-col items-center justify-center text-white shadow-sm ${past ? 'from-slate-400 to-slate-500' : 'from-blue-500 to-indigo-600'}`}>
            {dateStr ? (
              <>
                <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">{format(parseISO(dateStr), 'MMM')}</span>
                <span className="text-[20px] font-black leading-none">{format(parseISO(dateStr), 'd')}</span>
              </>
            ) : (
              <Calendar className="w-5 h-5 opacity-80" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-[15px] font-bold leading-snug ${past ? 'text-slate-500' : 'text-slate-900'}`}>
              {event.title}
            </p>
            {dateStr && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                {format(parseISO(dateStr), 'EEEE, MMMM d')}
                {(event.start_time || event.event_time) && ` · ${event.start_time || event.event_time}`}
              </p>
            )}
            {(event.location_text || event.location) && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="w-3 h-3" />
                {event.location_text || event.location}
              </p>
            )}
          </div>
        </div>

        {event.description && (
          <p className="mt-2 text-[12px] leading-5 text-slate-500 line-clamp-2">{event.description}</p>
        )}

        <EventTicketSection event={event} currentUser={currentUser} past={past} />
      </div>
    </div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const today = startOfToday();

  const { data: events = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['community-events-feed', currentUser?.id],
    queryFn: async () => {
      const { data: memberships, error: mErr } = await supabase
        .from('community_memberships')
        .select('community_id')
        .eq('user_id', currentUser.id)
        .eq('status', 'active');

      if (mErr) throw mErr;
      if (!memberships?.length) return [];

      const communityIds = memberships.map(m => m.community_id);

      const { data, error } = await supabase
        .from('community_events')
        .select('*, community:communities(id, name, template_type)')
        .in('community_id', communityIds)
        .order('start_date', { ascending: true, nullsFirst: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser,
    staleTime: 60_000,
  });

  const filtered = events.filter(e => {
    const dateStr = e.start_date || e.event_date;
    if (!dateStr) return activeFilter === 'upcoming';
    const d = parseISO(dateStr);
    if (activeFilter === 'today')     return format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    if (activeFilter === 'this_week') return !isBefore(d, today) && isBefore(d, addDays(today, 7));
    if (activeFilter === 'past')      return isBefore(d, today);
    return !isBefore(d, today); // upcoming
  });

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
          <h1 className="text-[17px] font-bold text-slate-900">Events</h1>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`app-chip ${activeFilter === f.id ? 'app-chip-active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-4 pb-28">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="app-card space-y-2 p-4">
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          ))
        ) : isError ? (
          <QueryError message="Events could not load." onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-bold text-slate-700">No {activeFilter} events</p>
            <p className="mt-1 text-[13px] text-slate-400">
              {events.length === 0
                ? 'Join communities to see their events here.'
                : 'Nothing matches this filter right now.'}
            </p>
            {events.length === 0 && (
              <Link
                to="/Communities"
                className="app-button-primary mt-4 inline-block rounded-full px-5 text-[13px]"
              >
                Browse Communities
              </Link>
            )}
          </div>
        ) : (
          filtered.map(event => (
            <EventCard key={event.id} event={event} currentUser={currentUser} />
          ))
        )}
      </div>
    </div>
  );
}
