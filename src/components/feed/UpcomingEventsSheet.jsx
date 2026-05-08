import React, { useEffect, useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar, Clock, MapPin, Users, Search, X } from 'lucide-react';
import { dataService } from '@/services';
import { format, isPast, parseISO } from 'date-fns';

export default function UpcomingEventsSheet({ open, onOpenChange, currentUser, joinedCommunityIds = [] }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'mine'

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    dataService.entities.UnifiedPost.filter({ type: 'event' }, '-event_date', 60)
      .then(all => {
        const upcoming = all.filter(e => {
          if (!e.event_date) return false;
          try { return !isPast(parseISO(e.event_date)); } catch { return false; }
        });
        // Prioritize community events the user has joined
        const sorted = [...upcoming].sort((a, b) => {
          const aInCommunity = joinedCommunityIds.includes(a.community_id);
          const bInCommunity = joinedCommunityIds.includes(b.community_id);
          if (aInCommunity && !bInCommunity) return -1;
          if (!aInCommunity && bInCommunity) return 1;
          return new Date(a.event_date) - new Date(b.event_date);
        });
        setEvents(sorted.slice(0, 30));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, joinedCommunityIds.join(',')]);

  const filtered = useMemo(() => {
    let list = events;
    if (filter === 'mine') list = list.filter(e => joinedCommunityIds.includes(e.community_id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.body || '').toLowerCase().includes(q) ||
        (e.location_text || '').toLowerCase().includes(q) ||
        (e.community_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, search, filter, joinedCommunityIds]);

  const groupByMonth = () => {
    const groups = {};
    filtered.forEach(e => {
      const month = format(parseISO(e.event_date), 'MMMM yyyy');
      if (!groups[month]) groups[month] = [];
      groups[month].push(e);
    });
    return groups;
  };

  const groups = groupByMonth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <SheetTitle className="flex items-center gap-2 text-[16px] font-bold text-slate-900">
            <Calendar className="w-5 h-5 text-blue-600" />
            Upcoming Events
          </SheetTitle>
          {/* Search bar */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events…"
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[13px] focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Filter pills */}
          {joinedCommunityIds.length > 0 && (
            <div className="flex gap-2 mt-2">
              {[{v:'all',l:'All Events'},{v:'mine',l:'My Communities'}].map(({v,l}) => (
                <button key={v} onClick={() => setFilter(v)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    filter === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}>{l}</button>
              ))}
            </div>
          )}
        </SheetHeader>

        <div className="px-4 py-3 pb-10">
          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-2xl" />
              ))}
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-bold text-slate-800">No upcoming events</p>
              <p className="text-[13px] text-slate-400 mt-1">Join communities to see their events here</p>
            </div>
          )}

          {!loading && Object.entries(groups).map(([month, monthEvents]) => (
            <div key={month} className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{month}</p>
              <div className="space-y-2">
                {monthEvents.map(event => {
                  const inJoined = joinedCommunityIds.includes(event.community_id);
                  const dayNum = format(parseISO(event.event_date), 'd');
                  const dayName = format(parseISO(event.event_date), 'EEE');

                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                        inJoined
                          ? 'bg-blue-50/60 border-blue-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Date block */}
                      <div className="flex-shrink-0 w-10 text-center">
                        <p className="text-[10px] font-bold uppercase text-slate-400">{dayName}</p>
                        <p className={`text-[22px] font-extrabold leading-none ${inJoined ? 'text-blue-600' : 'text-slate-800'}`}>{dayNum}</p>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] text-slate-900 leading-snug line-clamp-1">
                          {event.title || event.body}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {event.event_time && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Clock className="w-3 h-3" />{event.event_time}
                            </span>
                          )}
                          {event.location_text && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <MapPin className="w-3 h-3" />{event.location_text}
                            </span>
                          )}
                          {event.community_name && (
                            <span className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold">
                              <Users className="w-3 h-3" />{event.community_name}
                            </span>
                          )}
                        </div>
                        {event.body && event.title && (
                          <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{event.body}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}