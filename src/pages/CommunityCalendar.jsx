import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Loader2 } from 'lucide-react';

const DOT_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-green-500', 'bg-rose-500',
  'bg-amber-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500',
];

function communityColor(communityId, allCommunityIds) {
  const idx = allCommunityIds.indexOf(communityId);
  return DOT_COLORS[idx % DOT_COLORS.length] || 'bg-blue-500';
}

export default function CommunityCalendar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      let user = null;
      try { user = await base44.auth.me(); setCurrentUser(user); } catch {}

      // Get communities the user is a member of (or all if not logged in)
      let communityIds = [];
      let communityList = [];
      if (user) {
        const memberships = await base44.entities.UserCommunity.filter({ user_id: user.id });
        communityIds = memberships.map(m => m.community_id).filter(Boolean);
        if (communityIds.length > 0) {
          // Fetch community names for display
          const comms = await base44.entities.Community.list('-follower_count', 80);
          communityList = comms.filter(c => communityIds.includes(c.id));
        }
      }

      if (communityList.length === 0) {
        // Fall back to all communities
        communityList = await base44.entities.Community.list('-follower_count', 30);
        communityIds = communityList.map(c => c.id);
      }
      setCommunities(communityList);

      // Fetch events for all communities
      const allEvents = await base44.entities.CommunityEvent.list('start_date', 200);
      const filtered = allEvents.filter(e => communityIds.includes(e.community_id) && e.start_date);
      setEvents(filtered);
      setLoading(false);
    };
    init();
  }, []);

  // Build a map: dateString → events[]
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const key = e.start_date;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const communityIds = useMemo(() => communities.map(c => c.id), [communities]);
  const communityMap = useMemo(() => Object.fromEntries(communities.map(c => [c.id, c])), [communities]);

  // Days in the current month view
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(viewMonth);
    const end = endOfMonth(viewMonth);
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  // Leading blank days (day of week offset)
  const startDow = startOfMonth(viewMonth).getDay(); // 0=Sun

  // Upcoming events (future or today) sorted by date
  const upcomingEvents = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return events
      .filter(e => e.start_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 20);
  }, [events]);

  // Events for selected day
  const selectedEvents = selectedDay ? (eventsByDay[format(selectedDay, 'yyyy-MM-dd')] || []) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-[18px] font-bold text-slate-900">Community Calendar</h1>
            <p className="text-[12px] text-slate-400">Events from your communities</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
        {/* Month Navigator */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
            <button onClick={() => setViewMonth(m => subMonths(m, 1))} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <h2 className="text-[15px] font-bold text-slate-900">{format(viewMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setViewMonth(m => addMonths(m, 1))} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 pb-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px px-2 pb-3">
            {/* Leading blanks */}
            {Array.from({ length: startDow }).map((_, i) => <div key={`blank-${i}`} />)}
            {daysInMonth.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[key] || [];
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative flex flex-col items-center py-1.5 rounded-xl transition-all ${
                    isSelected ? 'bg-blue-600 text-white' :
                    today ? 'bg-blue-50 text-blue-700 font-bold' :
                    'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-[13px] font-semibold leading-none">{format(day, 'd')}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : communityColor(e.community_id, communityIds)}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day events */}
        {selectedDay && (
          <div>
            <h3 className="text-[14px] font-bold text-slate-800 mb-2">
              {format(selectedDay, 'EEEE, MMMM d')}
            </h3>
            {selectedEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-[13px] text-slate-400">
                No events on this day
              </div>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map(e => (
                  <EventRow key={e.id} event={e} community={communityMap[e.community_id]} communityIds={communityIds} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming events list */}
        {!selectedDay && (
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 mb-3">Upcoming Events</h3>
            {upcomingEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-[14px] font-bold text-slate-600">No upcoming events</p>
                <p className="text-[12px] text-slate-400 mt-1">Join more communities to see their events here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(e => (
                  <EventRow key={e.id} event={e} community={communityMap[e.community_id]} communityIds={communityIds} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Community legend */}
        {communities.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-3">Your Communities</p>
            <div className="flex flex-wrap gap-2">
              {communities.map((c, i) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_COLORS[i % DOT_COLORS.length]}`} />
                  <span className="text-[11px] text-slate-600 font-medium">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event, community, communityIds }) {
  const color = communityColor(event.community_id, communityIds);
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
      onClick={() => navigate(`/communities/${event.community_id}`)}
    >
      {/* Color strip */}
      <div className={`w-1 rounded-full flex-shrink-0 ${color}`} />

      {/* Date badge */}
      <div className="flex-shrink-0 text-center w-10">
        <div className="text-[9px] font-bold uppercase text-slate-400">{format(parseISO(event.start_date), 'MMM')}</div>
        <div className="text-[20px] font-black text-slate-900 leading-none">{format(parseISO(event.start_date), 'd')}</div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-900 truncate">{event.title}</p>
        {community && (
          <p className="text-[11px] text-slate-400 truncate">{community.name}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {event.start_time && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />{event.start_time}
              {event.end_time && ` – ${event.end_time}`}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3" />{event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}