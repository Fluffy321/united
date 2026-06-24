import React, { useState, useEffect } from 'react';
import { Sun, Sparkles, Star, CalendarDays, HandHeart, Plus, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getZmanim, formatZmanTime, getShabbatTimes } from '@/lib/hebrewDate';
import useShabbatLocation from '@/hooks/useShabbatLocation';

const ZMANIM_SHOW = [
  { key: 'sunrise',     label: 'Netz (Sunrise)',       emoji: '🌅' },
  { key: 'sofZmanShma', label: 'Sof Zman Shma (GRA)',  emoji: '📜' },
  { key: 'minchaGedola',label: 'Mincha Gedola',        emoji: '⏳' },
  { key: 'plagHaMincha',label: 'Plag HaMincha',        emoji: '⏱️' },
  { key: 'sunset',      label: 'Shkia (Sunset)',        emoji: '🌇' },
  { key: 'tzeis85deg',  label: 'Tzeis (8.5°)',          emoji: '🌃' },
];

const CATEGORY_META = {
  shiur:        { emoji: '📖', color: 'bg-indigo-100 text-indigo-700' },
  shul_event:   { emoji: '🕍', color: 'bg-blue-100 text-blue-700'    },
  chesed:       { emoji: '🤝', color: 'bg-rose-100 text-rose-700'    },
  youth:        { emoji: '🎒', color: 'bg-amber-100 text-amber-700'  },
  business:     { emoji: '💼', color: 'bg-slate-100 text-slate-600'  },
  shabbos_meal: { emoji: '🕯️', color: 'bg-yellow-100 text-yellow-700'},
  fundraiser:   { emoji: '💛', color: 'bg-orange-100 text-orange-700'},
  memorial:     { emoji: '🕯️', color: 'bg-slate-100 text-slate-500'  },
  general:      { emoji: '📅', color: 'bg-slate-100 text-slate-600'  },
};

// Five Towns default
const DEFAULT_LAT = 40.6282;
const DEFAULT_LNG = -73.7349;

// Holiday subcat → badge label
const SUBCAT_BADGE = {
  major:  null,
  minor:  'Minor holiday',
  modern: 'Israeli holiday',
  fast:   'Fast day',
  shabbat:'Special Shabbat',
};

const HOLIDAY_ICON = {
  major:  '✡️',
  minor:  '🕎',
  modern: '🇮🇱',
  fast:   '⚠️',
  shabbat:'📜',
  roshchodesh: '🌙',
};

export default function CalendarDaySheet({
  open, onOpenChange,
  dateKey,       // "YYYY-MM-DD"
  hebrewDate,    // { hdate, holidays, parsha, omer, specialShabbat }
  events = [],
  mitzvahs = [],
  omer = null,       // { n, title, hebrew }
  dafYomi = null,    // "Daf string e.g. Bava Kamma 42"
  usHoliday = null,  // "Independence Day 🇺🇸"
  onEventTap,
  onCreateEvent,
}) {
  const { location: shabbatLocation } = useShabbatLocation();
  const [zmanim, setZmanim]         = useState(null);
  const [shabbatTimes, setShabbatTimes] = useState(null);
  const [zmanimExpanded, setZmanimExpanded] = useState(false);
  const [_loading, setLoading]       = useState(false);

  const lat = shabbatLocation?.lat || DEFAULT_LAT;
  const lng = shabbatLocation?.lng || DEFAULT_LNG;

  const date = dateKey ? new Date(dateKey + 'T12:00:00') : null;
  const dow  = date?.getDay(); // 0=Sun, 6=Sat
  const isFriday  = dow === 5;
  const isShabbos = dow === 6;
  const isShabbatyRelevant = isFriday || isShabbos;

  useEffect(() => {
    if (!open || !dateKey) return;
    setZmanim(null);
    setShabbatTimes(null);
    setLoading(true);

    const fetchDate = new Date(dateKey + 'T12:00:00');
    Promise.all([
      getZmanim(lat, lng, fetchDate),
      isShabbatyRelevant ? getShabbatTimes(lat, lng, 'America/New_York', fetchDate) : Promise.resolve(null),
    ]).then(([z, s]) => {
      setZmanim(z);
      setShabbatTimes(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open, dateKey, lat, lng]);

  if (!date) return null;

  const civilDate = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const holidays  = hebrewDate?.holidays || [];
  const hdate     = hebrewDate?.hdate;
  const parsha    = hebrewDate?.parsha;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[88dvh] overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 pt-5 pb-4">
          <SheetTitle className="text-left">
            <p className="text-[19px] font-black text-slate-950">{civilDate}</p>
            {hdate && <p className="text-[13px] font-semibold text-slate-400 mt-0.5">{hdate}</p>}
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 py-4 space-y-5 pb-12">

          {/* Jewish context banner */}
          {(holidays.length > 0 || parsha || isShabbos || isFriday || omer) && (
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-4 space-y-2.5">
              {/* Shabbos / Erev Shabbos greeting */}
              {isShabbos && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                  <p className="text-[15px] font-black text-slate-900">Shabbat Shalom ✨</p>
                </div>
              )}
              {isFriday && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                  <p className="text-[14px] font-bold text-slate-900">Erev Shabbos</p>
                </div>
              )}

              {/* All holidays for this day */}
              {holidays.map((h, i) => {
                const isRC = h.category === 'roshchodesh';
                const icon = isRC ? HOLIDAY_ICON.roshchodesh : (HOLIDAY_ICON[h.subcat] || '✡️');
                const badge = isRC ? 'Rosh Chodesh' : SUBCAT_BADGE[h.subcat];
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-[18px] leading-none shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-[14px] font-bold text-slate-900 leading-snug">{h.title}</p>
                      {h.hebrew && <p className="text-[12px] text-indigo-600 font-semibold">{h.hebrew}</p>}
                      {badge && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{badge}</p>}
                      {h.memo && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{h.memo}</p>}
                    </div>
                  </div>
                );
              })}

              {/* Parsha */}
              {parsha && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Parsha</p>
                    <p className="text-[14px] font-bold text-slate-900">{parsha}</p>
                  </div>
                </div>
              )}

              {/* Sefirat HaOmer */}
              {omer && (
                <div className="flex items-center gap-2">
                  <span className="text-[18px] leading-none shrink-0">🌾</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Sefirat HaOmer</p>
                    <p className="text-[14px] font-bold text-slate-900">{omer.title}</p>
                    {omer.hebrew && <p className="text-[12px] text-indigo-600 font-semibold">{omer.hebrew}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Daf Yomi */}
          {dafYomi && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-center gap-3">
              <span className="text-[20px]">📚</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-amber-600">Daf Yomi</p>
                <p className="text-[14px] font-bold text-slate-900">{dafYomi}</p>
              </div>
            </div>
          )}

          {/* US / civil holiday */}
          {usHoliday && (
            <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-center gap-3">
              <span className="text-[20px]">🇺🇸</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-blue-400">US Holiday</p>
                <p className="text-[14px] font-bold text-slate-900">{usHoliday.replace(' 🇺🇸', '')}</p>
              </div>
            </div>
          )}

          {/* Shabbos / Candle times */}
          {isShabbatyRelevant && shabbatTimes && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-950 px-4 py-2.5 flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-400" />
                <p className="text-[13px] font-bold text-white">
                  {isFriday ? 'Candle Lighting' : 'Shabbos Times'}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {isFriday && shabbatTimes.candleLighting && (
                  <Row label={shabbatTimes.candleTitle || 'Candle Lighting'} value={formatZmanTime(shabbatTimes.candleLighting)} />
                )}
                {isShabbos && shabbatTimes.havdalah && (
                  <Row label={shabbatTimes.havdalahTitle || 'Havdalah'} value={formatZmanTime(shabbatTimes.havdalah)} />
                )}
              </div>
            </div>
          )}

          {/* Zmanim */}
          {zmanim && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setZmanimExpanded(e => !e)}
                className="w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-300" />
                  <p className="text-[13px] font-bold text-white">Zmanim</p>
                </div>
                <span className="text-[11px] text-blue-200 font-semibold">
                  {zmanimExpanded ? 'Less ↑' : 'Show all ↓'}
                </span>
              </button>
              <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
                {ZMANIM_SHOW.slice(0, zmanimExpanded ? 6 : 4).map(({ key, label, emoji }) => {
                  const t = zmanim[key];
                  if (!t) return null;
                  return (
                    <div key={key} className="px-3 py-2.5 flex items-center gap-2">
                      <span className="text-sm">{emoji}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-500 truncate">{label}</p>
                        <p className="text-[13px] font-bold text-slate-900">{formatZmanTime(t)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Events section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                <p className="text-[13px] font-black uppercase tracking-wide text-slate-700">Events</p>
              </div>
              <button
                onClick={() => onCreateEvent?.()}
                className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white active:bg-blue-700"
              >
                <Plus className="h-3 w-3" />
                Add Event
              </button>
            </div>

            {events.length === 0 ? (
              <button
                onClick={() => onCreateEvent?.()}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 active:bg-slate-100"
              >
                <CalendarDays className="h-7 w-7 text-slate-300" />
                <p className="text-[13px] font-bold text-slate-500">No events — be the first to add one</p>
              </button>
            ) : (
              <div className="space-y-2">
                {events.map(e => {
                  const meta = CATEGORY_META[e.category] || CATEGORY_META.general;
                  return (
                    <button
                      key={e.id}
                      onClick={() => onEventTap?.(e)}
                      className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left active:bg-slate-50 transition-colors"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${meta.color}`}>
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-1">{e.title}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          {[e.start_time || e.event_time, e.location_text || e.location].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mitzvahs */}
          {mitzvahs.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <HandHeart className="h-4 w-4 text-rose-500" />
                <p className="text-[13px] font-black uppercase tracking-wide text-slate-700">Mitzvahs</p>
              </div>
              <div className="space-y-2">
                {mitzvahs.map(m => (
                  <div key={m.id} className="rounded-2xl border border-rose-100 bg-rose-50 p-3.5">
                    <p className="text-[14px] font-bold text-slate-900">{m.title}</p>
                    {m.category && <p className="text-[12px] text-slate-500 mt-0.5">{m.category}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[13px] text-slate-600 font-medium">{label}</span>
      <span className="text-[13px] font-bold text-slate-900">{value}</span>
    </div>
  );
}
