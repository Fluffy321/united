import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Star, Users,
  Sparkles, HandHeart, CalendarDays,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import CreateMitzvahModal from '@/components/mitzvah/CreateMitzvahModal';
import JewishHubBackButton from './JewishHubBackButton';

// ─── Hebcal helpers ──────────────────────────────────────────────────────────

const HEBCAL_BASE = 'https://www.hebcal.com';

async function fetchMonthHebDates(year, month) {
  // Returns map: "YYYY-MM-DD" -> { hd, hm, hy, hebrewString }
  const map = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  // Batch: Hebcal converter doesn't have a month endpoint, but /hebcal does
  // Use the calendar endpoint to get holidays + Hebrew dates for the month
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end   = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;
  try {
    const res = await fetch(
      `${HEBCAL_BASE}/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&ss=on&mf=on&c=off&geo=geoname&geonameid=5116025&M=on&s=on&start=${start}&end=${end}`
    );
    const data = await res.json();
    // Extract Hebrew date from each item's hdate ("27 Nisan 5786")
    (data.items || []).forEach(item => {
      if (item.date) {
        const dateKey = item.date.slice(0, 10);
        if (!map[dateKey]) map[dateKey] = { hdate: item.hdate, holidays: [] };
        if (item.category === 'holiday' || item.category === 'roshchodesh') {
          map[dateKey].holidays.push({ title: item.title, category: item.category, subcat: item.subcat, hebrew: item.hebrew });
        }
      }
    });
    return map;
  } catch {
    return map;
  }
}

async function fetchHebrewDayNumber(year, month, day) {
  try {
    const res = await fetch(`${HEBCAL_BASE}/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`);
    const data = await res.json();
    return data.hd; // just the numeric day
  } catch { return null; }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const FILTER_OPTIONS = [
  { id: 'holidays',  label: 'Holidays',      Icon: Star,       color: 'amber'  },
  { id: 'shabbos',   label: 'Shabbos',       Icon: Sparkles,   color: 'indigo' },
  { id: 'events',    label: 'JUnited Events', Icon: CalendarDays, color: 'blue' },
  { id: 'mitzvahs',  label: 'Mitzvahs',      Icon: HandHeart,  color: 'rose'   },
];

const COLOR = {
  amber:  { dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-800',  cell: 'bg-amber-50'  },
  indigo: { dot: 'bg-indigo-400', badge: 'bg-indigo-100 text-indigo-800', cell: 'bg-indigo-50/40' },
  blue:   { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-800',    cell: 'bg-blue-50'   },
  rose:   { dot: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-800',    cell: 'bg-rose-50'   },
};

function isoDate(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function dayOfWeek(y, m, d) {
  return new Date(y, m - 1, d).getDay(); // 0=Sun, 6=Sat
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function JewishCalendarPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const [viewYear, setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-based

  const [activeFilters, setActiveFilters] = useState(new Set(['holidays', 'shabbos', 'events', 'mitzvahs']));
  const [hebData, setHebData]     = useState({});         // { "YYYY-MM-DD": { hdate, holidays } }
  const [dayHebNums, setDayHebNums] = useState({});       // cache of hd numbers
  const [selectedDay, setSelectedDay] = useState(null);   // "YYYY-MM-DD"
  const [showSheet, setShowSheet]    = useState(false);
  const [showCreateMitzvah, setShowCreateMitzvah] = useState(false);
  const [createForDate, setCreateForDate] = useState(null);

  // Fetch Hebrew calendar data for the viewed month
  useEffect(() => {
    setHebData({});
    fetchMonthHebDates(viewYear, viewMonth).then(setHebData);
  }, [viewYear, viewMonth]);

  // JUnited events for this month
  const { data: communityEvents = [] } = useQuery({
    queryKey: ['calendarEvents', viewYear, viewMonth],
    queryFn: async () => {
      const start = `${isoDate(viewYear, viewMonth, 1)}T00:00:00`;
      const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
      const end   = `${isoDate(viewYear, viewMonth, daysInMonth)}T23:59:59`;
      try {
        const all = await dataService.entities.CommunityEvent.list('-start_date', 200);
        return (all || []).filter(e => {
          const d = e.start_date || e.event_date;
          return d && d >= start && d <= end;
        });
      } catch { return []; }
    },
    staleTime: 60_000,
  });

  // Mitzvahs for this month
  const { data: mitzvahs = [] } = useQuery({
    queryKey: ['calendarMitzvahs', viewYear, viewMonth],
    queryFn: async () => {
      try {
        const all = await dataService.entities.MitzvahRequest.list('-created_date', 200);
        const start = isoDate(viewYear, viewMonth, 1);
        const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
        const end = isoDate(viewYear, viewMonth, daysInMonth);
        return (all || []).filter(m => {
          const d = (m.needed_by || m.created_date || '').slice(0, 10);
          return d >= start && d <= end;
        });
      } catch { return []; }
    },
    staleTime: 60_000,
  });

  // ── Calendar grid ────────────────────────────────────────────────────────
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDow    = dayOfWeek(viewYear, viewMonth, 1); // 0=Sun

  // Pad with nulls for days before the 1st
  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [viewYear, viewMonth, firstDow, daysInMonth]);

  // Map events/mitzvahs by date key
  const eventsByDay = useMemo(() => {
    const map = {};
    communityEvents.forEach(e => {
      const key = (e.start_date || e.event_date || '').slice(0, 10);
      if (key) { map[key] = map[key] || []; map[key].push(e); }
    });
    return map;
  }, [communityEvents]);

  const mitzvahsByDay = useMemo(() => {
    const map = {};
    mitzvahs.forEach(m => {
      const key = (m.needed_by || m.created_date || '').slice(0, 10);
      if (key) { map[key] = map[key] || []; map[key].push(m); }
    });
    return map;
  }, [mitzvahs]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth() + 1); };

  // ── Filter toggle ─────────────────────────────────────────────────────────
  const toggleFilter = (id) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Day click ─────────────────────────────────────────────────────────────
  const openDay = (day) => {
    setSelectedDay(isoDate(viewYear, viewMonth, day));
    setShowSheet(true);
  };

  // ── Helpers for rendering each cell ──────────────────────────────────────
  const getCellData = useCallback((day) => {
    const key = isoDate(viewYear, viewMonth, day);
    const dow = dayOfWeek(viewYear, viewMonth, day);
    const isShabbos = dow === 6;
    const isFriday  = dow === 5;
    const isToday   = (
      day === today.getDate() &&
      viewMonth === today.getMonth() + 1 &&
      viewYear  === today.getFullYear()
    );

    const hInfo     = hebData[key] || {};
    const holidays  = hInfo.holidays || [];
    const events    = eventsByDay[key] || [];
    const dayMitz   = mitzvahsByDay[key] || [];

    const isMajorHoliday = holidays.some(h => h.subcat === 'major' || h.category === 'roshchodesh');

    return { key, dow, isShabbos, isFriday, isToday, hInfo, holidays, events, dayMitz, isMajorHoliday };
  }, [viewYear, viewMonth, hebData, eventsByDay, mitzvahsByDay, today]);

  // ── Selected day detail data ───────────────────────────────────────────────
  const selectedData = useMemo(() => {
    if (!selectedDay) return null;
    const day = parseInt(selectedDay.slice(8, 10));
    return getCellData(day);
  }, [selectedDay, getCellData]);

  return (
    <main className="mobile-page min-h-screen pb-28 bg-[#F8F7F4]">
      <div className="px-3 pt-4">
        <JewishHubBackButton to="/JewishHub" ariaLabel="Back to Jewish Hub" />
      </div>

      {/* ── Header ── */}
      <div className="px-4 pt-1 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Jewish</p>
            <h1 className="text-[26px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
              Calendar
            </h1>
          </div>
          <button
            onClick={goToday}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 shadow-sm active:bg-slate-50"
          >
            Today
          </button>
        </div>

        {/* Month navigator */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button onClick={prevMonth} className="rounded-xl p-1.5 active:bg-slate-100">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="text-center">
            <p className="text-[17px] font-black text-slate-950">{MONTH_NAMES[viewMonth - 1]} {viewYear}</p>
          </div>
          <button onClick={nextMonth} className="rounded-xl p-1.5 active:bg-slate-100">
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_OPTIONS.map(({ id, label, Icon, color }) => {
            const active = activeFilters.has(id);
            const c = COLOR[color];
            return (
              <button
                key={id}
                onClick={() => toggleFilter(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-all ${
                  active
                    ? `${c.badge} border-transparent`
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className="px-3">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS_OF_WEEK.map((d, i) => (
              <div
                key={d}
                className={`py-2 text-center text-[10px] font-black uppercase tracking-wide ${
                  i === 6 ? 'text-indigo-500' : i === 5 ? 'text-blue-500' : 'text-slate-400'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="border-b border-r border-slate-50 min-h-[68px]" />;
              }

              const {
                key, isShabbos, isFriday, isToday,
                hInfo, holidays, events, dayMitz, isMajorHoliday
              } = getCellData(day);

              const showHolidays = activeFilters.has('holidays');
              const showShabbos  = activeFilters.has('shabbos');
              const showEvents   = activeFilters.has('events');
              const showMitzvahs = activeFilters.has('mitzvahs');

              const hasHoliday = showHolidays && holidays.length > 0;
              const isHighlightShabbos = showShabbos && isShabbos;
              const hasEvents   = showEvents && events.length > 0;
              const hasMitzvahs = showMitzvahs && dayMitz.length > 0;

              // Hebrew day number from hdate e.g. "27 Nisan 5786" -> "27"
              const hebDayNum = hInfo.hdate ? hInfo.hdate.split(' ')[0] : '';

              const cellBg = isMajorHoliday && showHolidays
                ? 'bg-amber-50'
                : isHighlightShabbos
                ? 'bg-indigo-50/30'
                : isFriday && showShabbos
                ? 'bg-indigo-50/10'
                : '';

              return (
                <button
                  key={key}
                  onClick={() => openDay(day)}
                  className={`relative flex min-h-[68px] flex-col items-center gap-0.5 border-b border-r border-slate-100 px-0.5 pt-1.5 pb-1 text-left active:bg-slate-100 transition-colors ${cellBg}`}
                >
                  {/* Day number */}
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : isShabbos
                      ? 'text-indigo-600'
                      : isFriday
                      ? 'text-blue-500'
                      : 'text-slate-900'
                  }`}>
                    {day}
                  </div>

                  {/* Hebrew date number */}
                  {hebDayNum && (
                    <span className={`text-[9px] font-semibold leading-none ${
                      isMajorHoliday && showHolidays ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {hebDayNum}
                    </span>
                  )}

                  {/* Holiday name (abbreviated) */}
                  {hasHoliday && (
                    <span className="mt-0.5 max-w-full truncate rounded px-1 py-0.5 text-[8.5px] font-bold leading-none text-amber-700 bg-amber-100">
                      {holidays[0].title.replace('Erev ', '').replace('Rosh Chodesh ', 'ר״ח ')}
                    </span>
                  )}

                  {/* Dot indicators */}
                  <div className="mt-auto flex gap-0.5 pb-0.5">
                    {hasEvents && (
                      <span className={`h-1.5 w-1.5 rounded-full ${COLOR.blue.dot}`} />
                    )}
                    {hasMitzvahs && (
                      <span className={`h-1.5 w-1.5 rounded-full ${COLOR.rose.dot}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1">
          <LegendItem color="bg-blue-500" label="JUnited Events" />
          <LegendItem color="bg-rose-500" label="Mitzvahs" />
          <LegendItem color="bg-amber-100 border border-amber-300" label="Holidays" square />
          <LegendItem color="bg-indigo-50/60 border border-indigo-100" label="Shabbos" square />
        </div>
      </div>

      {/* ── Day detail sheet ── */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto px-0 pb-10">
          <SheetHeader className="px-5 pb-3 border-b border-slate-100">
            <SheetTitle className="text-left">
              {selectedDay && (() => {
                const d = new Date(selectedDay + 'T12:00:00');
                return (
                  <div>
                    <p className="text-[18px] font-black text-slate-950">
                      {d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    {selectedData?.hInfo?.hdate && (
                      <p className="text-[13px] font-semibold text-slate-400">{selectedData.hInfo.hdate}</p>
                    )}
                  </div>
                );
              })()}
            </SheetTitle>
          </SheetHeader>

          {selectedData && (
            <div className="px-5 pt-4 space-y-4">
              {/* Holidays */}
              {selectedData.holidays.length > 0 && activeFilters.has('holidays') && (
                <Section title="Holidays" Icon={Star} color="amber">
                  {selectedData.holidays.map((h, i) => (
                    <Item key={i} primary={h.title} secondary={h.hebrew} />
                  ))}
                </Section>
              )}

              {/* Shabbos notice */}
              {selectedData.isShabbos && activeFilters.has('shabbos') && (
                <Section title="Shabbos" Icon={Sparkles} color="indigo">
                  <Item primary="Shabbat Shalom" secondary="Shabbos begins Friday at nightfall" />
                </Section>
              )}
              {selectedData.isFriday && activeFilters.has('shabbos') && (
                <Section title="Erev Shabbos" Icon={Sparkles} color="indigo">
                  <Item primary="Candle lighting tonight" secondary="Shabbos begins at nightfall" />
                </Section>
              )}

              {/* JUnited Events */}
              {activeFilters.has('events') && (
                <Section
                  title="JUnited Events"
                  Icon={CalendarDays}
                  color="blue"
                  action={
                    <button
                      onClick={() => { setShowSheet(false); navigate('/Events'); }}
                      className="text-[12px] font-bold text-blue-600"
                    >
                      See all
                    </button>
                  }
                >
                  {selectedData.events.length === 0 ? (
                    <p className="text-[13px] text-slate-400 font-medium">No events today</p>
                  ) : selectedData.events.map(e => (
                    <Item
                      key={e.id}
                      primary={e.title}
                      secondary={[e.start_time || e.event_time, e.location_text || e.location].filter(Boolean).join(' · ')}
                    />
                  ))}
                </Section>
              )}

              {/* Mitzvahs */}
              {activeFilters.has('mitzvahs') && (
                <Section
                  title="Mitzvahs Needed"
                  Icon={HandHeart}
                  color="rose"
                  action={
                    <button
                      onClick={() => {
                        setShowSheet(false);
                        setCreateForDate(selectedDay);
                        setShowCreateMitzvah(true);
                      }}
                      className="flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  }
                >
                  {selectedData.dayMitz.length === 0 ? (
                    <p className="text-[13px] text-slate-400 font-medium">No mitzvahs listed for this day</p>
                  ) : selectedData.dayMitz.map(m => (
                    <Item
                      key={m.id}
                      primary={m.title}
                      secondary={m.category}
                    />
                  ))}
                </Section>
              )}

              {/* Quick actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowSheet(false);
                    setCreateForDate(selectedDay);
                    setShowCreateMitzvah(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-[14px] font-bold text-white active:bg-slate-800"
                >
                  <HandHeart className="h-4 w-4" />
                  Post a Mitzvah for this day
                </button>
                <button
                  onClick={() => { setShowSheet(false); navigate('/Mitzvah'); }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-[14px] font-bold text-slate-700 active:bg-slate-50"
                >
                  <Users className="h-4 w-4" />
                  View Mitzvah Circle
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Mitzvah Modal */}
      <CreateMitzvahModal
        open={showCreateMitzvah}
        onOpenChange={setShowCreateMitzvah}
        currentUser={currentUser}
        initialValues={createForDate ? { needed_by: createForDate } : null}
      />
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, Icon, color, children, action }) {
  const c = COLOR[color] || COLOR.blue;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${c.badge}`}>
            <Icon className="h-3 w-3" />
          </span>
          <p className="text-[12px] font-black uppercase tracking-wide text-slate-600">{title}</p>
        </div>
        {action}
      </div>
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function Item({ primary, secondary }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[14px] font-bold text-slate-900">{primary}</p>
      {secondary && <p className="text-[12px] text-slate-500 font-medium mt-0.5">{secondary}</p>}
    </div>
  );
}

function LegendItem({ color, label, square }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`${square ? 'h-3 w-3 rounded-sm' : 'h-2 w-2 rounded-full'} ${color} inline-block`} />
      <span className="text-[10px] font-semibold text-slate-400">{label}</span>
    </div>
  );
}
