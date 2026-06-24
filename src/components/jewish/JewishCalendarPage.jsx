/**
 * JewishCalendarPage — full interactive Jewish calendar
 *
 * Month view + List view, Hebrew dates, holidays via Hebcal API,
 * JUnited community events, filter bar, day-detail sheet, event creation.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, LayoutList,
  Star, Sparkles,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { format, parseISO } from 'date-fns';
import JewishHubBackButton from './JewishHubBackButton';
import CalendarDaySheet from '@/components/calendar/CalendarDaySheet';
import CalendarEventDetailSheet from '@/components/calendar/CalendarEventDetailSheet';
import CreateCalendarEventModal from '@/components/calendar/CreateCalendarEventModal';

// ─── Hebcal fetch ────────────────────────────────────────────────────────────

const HEBCAL_BASE = 'https://www.hebcal.com';
const hebCache = {};

async function fetchMonthCalData(year, month) {
  const key = `${year}-${month}`;
  if (hebCache[key]) return hebCache[key];

  const daysInMonth = new Date(year, month, 0).getDate();
  const pad = (n) => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01`;
  const end   = `${year}-${pad(month)}-${daysInMonth}`;

  try {
    const res = await fetch(
      `${HEBCAL_BASE}/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&ss=on&mf=on` +
      `&c=off&geo=geoname&geonameid=5116025&M=on&s=on&start=${start}&end=${end}`
    );
    const data = await res.json();
    const map = {};
    (data.items || []).forEach(item => {
      const dk = item.date?.slice(0, 10);
      if (!dk) return;
      if (!map[dk]) map[dk] = { hdate: item.hdate || '', holidays: [], parsha: null };
      if (item.category === 'holiday' || item.category === 'roshchodesh') {
        map[dk].holidays.push({ title: item.title, hebrew: item.hebrew, subcat: item.subcat });
      }
      if (item.category === 'parashat') {
        map[dk].parsha = item.title;
      }
    });
    hebCache[key] = map;
    return map;
  } catch {
    return {};
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Shab'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const EVENT_FILTERS = [
  { id: 'all',        label: 'All'           },
  { id: 'communities',label: 'My Communities' },
  { id: 'going',      label: 'Going'         },
  { id: 'jewish',     label: 'Jewish Dates'  },
  { id: 'local',      label: 'Local Events'  },
];

const CATEGORY_META = {
  shiur:        { emoji: '📖', color: 'text-indigo-600' },
  shul_event:   { emoji: '🕍', color: 'text-blue-600'   },
  chesed:       { emoji: '🤝', color: 'text-rose-600'   },
  youth:        { emoji: '🎒', color: 'text-amber-600'  },
  business:     { emoji: '💼', color: 'text-slate-600'  },
  shabbos_meal: { emoji: '🕯️', color: 'text-yellow-600' },
  fundraiser:   { emoji: '💛', color: 'text-orange-600' },
  memorial:     { emoji: '🕯️', color: 'text-slate-500'  },
  general:      { emoji: '📅', color: 'text-blue-500'   },
};

function isoDate(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function JewishCalendarPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const today    = useMemo(() => new Date(), []);
  const todayKey = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [viewMode,  setViewMode]  = useState('month'); // 'month' | 'list'
  const [filter,    setFilter]    = useState('all');
  const [hebData,   setHebData]   = useState({});

  // Sheet / modal state
  const [selectedDay,        setSelectedDay]        = useState(null);
  const [showDaySheet,       setShowDaySheet]        = useState(false);
  const [selectedEvent,      setSelectedEvent]       = useState(null);
  const [showEventDetail,    setShowEventDetail]     = useState(false);
  const [showCreateModal,    setShowCreateModal]     = useState(false);
  const [createInitialDate,  setCreateInitialDate]   = useState(null);

  // Fetch Hebrew calendar data for current view month
  useEffect(() => {
    fetchMonthCalData(viewYear, viewMonth).then(setHebData);
  }, [viewYear, viewMonth]);

  // User's joined community IDs (for filter)
  const { data: myCommunityIds = [] } = useQuery({
    queryKey: ['my-community-ids', currentUser?.id],
    queryFn: async () => {
      if (!supabase || !currentUser?.id) return [];
      const { data } = await supabase
        .from('community_memberships')
        .select('community_id')
        .eq('user_id', currentUser.id)
        .eq('status', 'active');
      return (data || []).map(m => m.community_id);
    },
    enabled: !!currentUser?.id,
    staleTime: 300_000,
  });

  // User's RSVPed event IDs
  const { data: myRsvpEventIds = [] } = useQuery({
    queryKey: ['my-rsvp-event-ids', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const rsvps = await dataService.entities.CommunityEventRSVP.filter(
        { user_id: currentUser.id, status: 'going' }, '-created_at', 200
      );
      return (rsvps || []).map(r => r.event_id).filter(Boolean);
    },
    enabled: !!currentUser?.id,
    staleTime: 120_000,
  });

  // Fetch events for the viewed month
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const monthStart  = `${isoDate(viewYear, viewMonth, 1)}`;
  const monthEnd    = `${isoDate(viewYear, viewMonth, daysInMonth)}`;

  const { data: communityEvents = [], refetch: refetchEvents } = useQuery({
    queryKey: ['calendar-events', viewYear, viewMonth],
    queryFn: async () => {
      if (!supabase) {
        // Fallback: use dataService
        const all = await dataService.entities.CommunityEvent.list('-start_date', 300);
        return (all || []).filter(e => {
          const d = (e.start_date || e.event_date || '').slice(0, 10);
          return d >= monthStart && d <= monthEnd;
        });
      }
      const { data } = await supabase
        .from('community_events')
        .select('*, community:communities(id, name)')
        .gte('start_date', monthStart)
        .lte('start_date', monthEnd)
        .eq('status', 'published')
        .order('start_date', { ascending: true })
        .limit(300);
      return data || [];
    },
    staleTime: 60_000,
  });

  // Mitzvah requests with needed_by in this month
  const { data: mitzvahs = [] } = useQuery({
    queryKey: ['calendar-mitzvahs', viewYear, viewMonth],
    queryFn: async () => {
      const all = await dataService.entities.MitzvahRequest.list('-created_date', 300);
      return (all || []).filter(m => {
        const d = (m.needed_by || '').slice(0, 10);
        return d >= monthStart && d <= monthEnd;
      });
    },
    staleTime: 120_000,
  });

  // Apply filter
  const filteredEvents = useMemo(() => {
    if (filter === 'all' || filter === 'local')   return communityEvents;
    if (filter === 'communities') return communityEvents.filter(e => myCommunityIds.includes(e.community_id));
    if (filter === 'going')       return communityEvents.filter(e => myRsvpEventIds.includes(e.id));
    if (filter === 'jewish')      return []; // Jewish dates shown via hebData, not events
    return communityEvents;
  }, [filter, communityEvents, myCommunityIds, myRsvpEventIds]);

  // Group filtered events by date key
  const eventsByDay = useMemo(() => {
    const map = {};
    filteredEvents.forEach(e => {
      const k = (e.start_date || e.event_date || '').slice(0, 10);
      if (k) { map[k] = map[k] || []; map[k].push(e); }
    });
    return map;
  }, [filteredEvents]);

  const mitzvahsByDay = useMemo(() => {
    const map = {};
    mitzvahs.forEach(m => {
      const k = (m.needed_by || '').slice(0, 10);
      if (k) { map[k] = map[k] || []; map[k].push(m); }
    });
    return map;
  }, [mitzvahs]);

  // Navigation
  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth() + 1);
  };

  // Day tap
  const openDay = useCallback((dateKey) => {
    setSelectedDay(dateKey);
    setShowDaySheet(true);
  }, []);

  const openEventDetail = useCallback((event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  }, []);

  const openCreateModal = useCallback((dateKey) => {
    setCreateInitialDate(dateKey || null);
    setShowCreateModal(true);
  }, []);

  // Called after event created to refresh calendar
  const handleEventCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar-events', viewYear, viewMonth] });
  };

  // Month grid
  const firstDow   = new Date(viewYear, viewMonth - 1, 1).getDay();
  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDow, daysInMonth]);

  // List view: group filtered events by month/week bucket
  const listGroups = useMemo(() => {
    const groups = {};
    filteredEvents.forEach(e => {
      const dk = (e.start_date || e.event_date || '').slice(0, 10);
      if (!dk) return;
      try {
        const label = format(parseISO(dk), 'MMMM d, yyyy');
        if (!groups[dk]) groups[dk] = { label, events: [] };
        groups[dk].events.push(e);
      } catch {}
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return {};
    return {
      events:   eventsByDay[selectedDay] || [],
      mitzvahs: mitzvahsByDay[selectedDay] || [],
      hebrewDate: hebData[selectedDay],
    };
  }, [selectedDay, eventsByDay, mitzvahsByDay, hebData]);

  return (
    <main className="mobile-page min-h-screen bg-[#F8F7F4] pb-28">
      {/* Back button */}
      <div className="px-4 pt-4">
        <JewishHubBackButton to="/JewishHub" ariaLabel="Back to Jewish Hub" />
      </div>

      {/* ── Header ── */}
      <div className="px-4 pt-1 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">JUnited</p>
            <h1 className="text-[26px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
              Calendar
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 shadow-sm active:bg-slate-100"
            >
              Today
            </button>
            <button
              onClick={() => openCreateModal(todayKey)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 shadow-md active:bg-blue-700"
            >
              <Plus className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Month navigator */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button onClick={prevMonth} className="rounded-xl p-1.5 active:bg-slate-100">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <p className="text-[17px] font-black text-slate-950">
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </p>
          <button onClick={nextMonth} className="rounded-xl p-1.5 active:bg-slate-100">
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* ── View + Filter bar ── */}
      <div className="px-4 pb-3 space-y-2">
        {/* View toggle */}
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <ViewBtn icon={CalendarDays} label="Month" active={viewMode === 'month'} onClick={() => setViewMode('month')} />
          <ViewBtn icon={LayoutList}   label="List"  active={viewMode === 'list'}  onClick={() => setViewMode('list')} />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {EVENT_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
                filter === f.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Month view ── */}
      {viewMode === 'month' && (
        <div className="px-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAYS_SHORT.map((d, i) => (
                <div key={d} className={`py-2 text-center text-[9px] font-black uppercase tracking-wide ${i === 6 ? 'text-indigo-500' : i === 5 ? 'text-blue-500' : 'text-slate-400'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} className="min-h-[72px] border-b border-r border-slate-50" />;

                const dk       = isoDate(viewYear, viewMonth, day);
                const dow      = new Date(viewYear, viewMonth - 1, day).getDay();
                const isShab   = dow === 6;
                const isFri    = dow === 5;
                const isToday  = dk === todayKey;
                const hInfo    = hebData[dk] || {};
                const holidays = filter === 'going' ? [] : (hInfo.holidays || []);
                const dayEvts  = (filter === 'jewish') ? [] : (eventsByDay[dk] || []);
                const dayMitz  = mitzvahsByDay[dk] || [];
                const isMajor  = holidays.some(h => h.subcat === 'major' || h.category === 'roshchodesh');

                const hebNum   = hInfo.hdate ? hInfo.hdate.split(' ')[0] : '';

                const bg = isMajor
                  ? 'bg-amber-50'
                  : isShab ? 'bg-indigo-50/30'
                  : isFri  ? 'bg-indigo-50/10'
                  : '';

                return (
                  <button
                    key={dk}
                    onClick={() => openDay(dk)}
                    className={`relative flex min-h-[72px] flex-col items-center border-b border-r border-slate-100 px-0.5 pt-1.5 pb-1 transition-colors active:bg-slate-100 ${bg}`}
                  >
                    {/* Civil day */}
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                      isToday  ? 'bg-blue-600 text-white'
                      : isShab ? 'text-indigo-600'
                      : isFri  ? 'text-blue-500'
                      : 'text-slate-900'
                    }`}>
                      {day}
                    </div>

                    {/* Hebrew day */}
                    {hebNum && (
                      <span className={`text-[9px] font-semibold leading-none ${isMajor ? 'text-amber-600' : 'text-slate-400'}`}>
                        {hebNum}
                      </span>
                    )}

                    {/* Holiday chip */}
                    {holidays.length > 0 && filter !== 'going' && filter !== 'communities' && (
                      <span className="mt-0.5 max-w-full truncate rounded px-1 py-0 text-[8px] font-bold leading-tight text-amber-700 bg-amber-100">
                        {holidays[0].title.replace('Rosh Chodesh ', 'ר״ח ')}
                      </span>
                    )}

                    {/* Event dots */}
                    <div className="mt-auto mb-0.5 flex flex-wrap justify-center gap-0.5 max-w-full">
                      {dayEvts.slice(0, 3).map((e, i) => {
                        const meta = CATEGORY_META[e.category] || CATEGORY_META.general;
                        return (
                          <span key={i} className={`text-[9px] leading-none`}>{meta.emoji}</span>
                        );
                      })}
                      {dayMitz.length > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
            <LegendDot className="bg-amber-100 border border-amber-200 h-3 w-3 rounded-sm" label="Holiday" />
            <LegendDot className="bg-indigo-50 border border-indigo-200 h-3 w-3 rounded-sm" label="Shabbos" />
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
              <span className="text-[11px]">📖</span> Event type
            </span>
            <LegendDot className="bg-rose-500 h-2 w-2 rounded-full" label="Mitzvah" />
          </div>

          {/* This month's events mini-list */}
          {filter !== 'jewish' && filteredEvents.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-2 px-1">
                This Month · {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {filteredEvents.slice(0, 5).map(e => (
                  <EventRow key={e.id} event={e} onClick={() => openEventDetail(e)} />
                ))}
                {filteredEvents.length > 5 && (
                  <button
                    onClick={() => setViewMode('list')}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-[13px] font-bold text-blue-600 active:bg-slate-50"
                  >
                    See all {filteredEvents.length} events →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <div className="px-3 space-y-5">
          {filter === 'jewish' ? (
            // Jewish dates only list
            <JewishDatesList hebData={hebData} viewYear={viewYear} viewMonth={viewMonth} daysInMonth={daysInMonth} />
          ) : listGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays className="h-12 w-12 text-slate-200 mb-3" />
              <p className="text-[15px] font-bold text-slate-600">No events this month</p>
              <p className="text-[13px] text-slate-400 mt-1">Be the first to add one</p>
              <button
                onClick={() => openCreateModal(todayKey)}
                className="mt-4 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-[13px] font-bold text-white active:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Event
              </button>
            </div>
          ) : (
            listGroups.map(([dk, { label, events }]) => {
              const hInfo  = hebData[dk] || {};
              const hebStr = hInfo.hdate || '';
              const holidays = hInfo.holidays || [];
              const dow = new Date(dk + 'T12:00:00').getDay();
              const isShab = dow === 6;

              return (
                <div key={dk}>
                  <button
                    onClick={() => openDay(dk)}
                    className="flex items-baseline gap-2 mb-2 group"
                  >
                    <span className={`text-[14px] font-black ${isShab ? 'text-indigo-700' : 'text-slate-900'}`}>{label}</span>
                    {hebStr && <span className="text-[11px] font-semibold text-slate-400">{hebStr}</span>}
                    {holidays[0] && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                        {holidays[0].title}
                      </span>
                    )}
                  </button>
                  <div className="space-y-2">
                    {events.map(e => (
                      <EventRow key={e.id} event={e} onClick={() => openEventDetail(e)} showDate={false} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Day detail sheet ── */}
      <CalendarDaySheet
        open={showDaySheet}
        onOpenChange={setShowDaySheet}
        dateKey={selectedDay}
        hebrewDate={selectedDayData.hebrewDate}
        events={selectedDayData.events}
        mitzvahs={selectedDayData.mitzvahs}
        onEventTap={(e) => {
          setShowDaySheet(false);
          openEventDetail(e);
        }}
        onCreateEvent={() => {
          setShowDaySheet(false);
          openCreateModal(selectedDay);
        }}
      />

      {/* ── Event detail sheet ── */}
      <CalendarEventDetailSheet
        open={showEventDetail}
        onOpenChange={setShowEventDetail}
        event={selectedEvent}
        onBack={() => {
          if (selectedDay) setShowDaySheet(true);
        }}
      />

      {/* ── Create event modal ── */}
      <CreateCalendarEventModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        initialDate={createInitialDate}
        onCreated={handleEventCreated}
      />
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ViewBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition-colors ${
        active ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function EventRow({ event, onClick, showDate = true }) {
  const dateStr = event.start_date || event.event_date;
  const meta    = CATEGORY_META[event.category] || CATEGORY_META.general;
  const community = event.community?.name || event.community_name;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left active:bg-slate-50 transition-colors shadow-sm"
    >
      {/* Date badge */}
      {showDate && dateStr && (
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center">
          <span className="text-[9px] font-black uppercase text-blue-500">
            {format(parseISO(dateStr), 'MMM')}
          </span>
          <span className="text-[18px] font-black leading-none text-blue-900">
            {format(parseISO(dateStr), 'd')}
          </span>
        </div>
      )}

      {/* Emoji indicator */}
      {!showDate && (
        <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-lg">
          {meta.emoji}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-1">{event.title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
          {[event.start_time || event.event_time, event.location_text || event.location, community].filter(Boolean).join(' · ')}
        </p>
      </div>

      <span className={`shrink-0 text-xs ${meta.color}`}>{meta.emoji}</span>
    </button>
  );
}

function LegendDot({ className, label }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`inline-block ${className}`} />
      <span className="text-[10px] font-semibold text-slate-400">{label}</span>
    </div>
  );
}

function JewishDatesList({ hebData, viewYear, viewMonth, daysInMonth }) {
  const pad = n => String(n).padStart(2, '0');
  const items = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${viewYear}-${pad(viewMonth)}-${pad(d)}`;
    const h  = hebData[dk];
    if (h && (h.holidays?.length || h.parsha)) {
      const date = new Date(dk + 'T12:00:00');
      items.push({ dk, h, civil: format(date, 'EEEE, MMMM d') });
    }
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Star className="h-10 w-10 text-slate-200 mb-3" />
        <p className="text-[14px] font-bold text-slate-500">Loading Jewish dates…</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map(({ dk, h, civil }) => (
        <div key={dk} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-[12px] font-black text-amber-700 mb-0.5">{civil}</p>
          {h.hdate && <p className="text-[11px] text-amber-600 mb-2">{h.hdate}</p>}
          {h.holidays.map((hol, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-slate-900">{hol.title}</p>
                {hol.hebrew && <p className="text-[11px] text-slate-500">{hol.hebrew}</p>}
              </div>
            </div>
          ))}
          {h.parsha && (
            <div className="flex items-center gap-2 py-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <p className="text-[13px] font-bold text-slate-900">{h.parsha}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
