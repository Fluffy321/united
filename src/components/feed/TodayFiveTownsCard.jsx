import React, { useState } from 'react';
import { CalendarDays, Flame, HandHeart, ScrollText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import useShabbatLocation from '@/hooks/useShabbatLocation';
import { useNavigate } from 'react-router-dom';
import { getShabbatTimes } from '@/lib/hebrewDate';
import { DEFAULT_LOCATION, isResolvedLocationLabel } from '@/lib/shabbatLocation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const FIVE_TOWNS_TIME_ZONE = 'America/New_York';
const DEFAULT_CONTENT = {
  mitzvah_text: 'Look for one small way to help a neighbor today.',
  torah_text: 'A Jewish community is built one thoughtful action at a time.',
};

function getFiveTownsDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: FIVE_TOWNS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatShortDate(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: FIVE_TOWNS_TIME_ZONE,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

function formatTime(date, timeZone = FIVE_TOWNS_TIME_ZONE) {
  if (!date) return 'TBD';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'TBD';
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  } catch {
    return 'TBD';
  }
}

async function loadDailyContent(dateKey) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('daily_content')
    .select('date, mitzvah_text, torah_text, candle_lighting_at, havdalah_at')
    .eq('date', dateKey)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export default function TodayFiveTownsCard({ onCalendarClick }) {
  const navigate = useNavigate();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const today = new Date();
  const dateKey = getFiveTownsDateKey(today);
  const {
    location: candleLocation,
    locationLoading,
    locationError,
    shouldAskLocation,
    allowOnce,
    allowAlways,
    denyLocation,
  } = useShabbatLocation({ autoRequest: true });

  const effectiveLocation = (
    candleLocation?.lat &&
    candleLocation?.lng &&
    candleLocation?.type !== 'declined'
  ) ? candleLocation : DEFAULT_LOCATION;
  const timesTimeZone = effectiveLocation?.tzid || FIVE_TOWNS_TIME_ZONE;
  const locationLabel = isResolvedLocationLabel(effectiveLocation?.label) ? effectiveLocation.label : DEFAULT_LOCATION.label;
  const hasNamedLocation = Boolean(
    effectiveLocation?.lat &&
    effectiveLocation?.lng &&
    locationLabel &&
    effectiveLocation?.type !== 'declined'
  );

  const { data, isError } = useQuery({
    queryKey: ['daily-content', dateKey],
    queryFn: () => loadDailyContent(dateKey),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const { data: liveTimes, isLoading: timesLoading } = useQuery({
    queryKey: [
      'live-shabbos-times',
      effectiveLocation?.lat,
      effectiveLocation?.lng,
      effectiveLocation?.tzid,
      dateKey,
    ],
    queryFn: () => getShabbatTimes(
      effectiveLocation.lat,
      effectiveLocation.lng,
      timesTimeZone,
      today
    ),
    enabled: hasNamedLocation,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const content = data || DEFAULT_CONTENT;
  const hasResolvedShabbosTimes = Boolean(liveTimes?.candleLighting && liveTimes?.havdalah);
  const locationNote = locationLoading || timesLoading
    ? 'Locating...'
    : hasNamedLocation
      ? locationLabel
      : locationError === 'declined'
        ? DEFAULT_LOCATION.label
        : DEFAULT_LOCATION.label;

  return (
    <>
    <section className="mb-3 overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-800 px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-white/70">{formatShortDate(today)}</p>
            <h2 className="mt-0.5 text-[18px] font-black leading-tight">Today in the Five Towns</h2>
          </div>
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 transition-transform active:scale-95"
            aria-label="Open today's schedule"
            title="Open today's schedule"
          >
            <CalendarDays className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-2 p-3">
        <DailyItem
          icon={HandHeart}
          label="Daily mitzvah"
          text={content.mitzvah_text}
          tone="rose"
        />
        <DailyItem
          icon={ScrollText}
          label="Torah thought"
          text={content.torah_text}
          tone="blue"
        />
        <div className="rounded-[18px] border border-amber-100 bg-amber-50 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-600" />
              <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">Shabbos times</p>
            </div>
            <p className="max-w-[48%] truncate text-right text-[10px] font-black uppercase tracking-wide text-amber-600/75">
              {locationNote}
            </p>
          </div>
          {hasNamedLocation && hasResolvedShabbosTimes ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <TimeBlock label={liveTimes?.candleTitle || 'Candles'} value={formatTime(liveTimes?.candleLighting, timesTimeZone)} />
              <TimeBlock label={liveTimes?.havdalahTitle || 'Havdalah'} value={formatTime(liveTimes?.havdalah, timesTimeZone)} />
            </div>
          ) : (
            <div className="mt-2 rounded-2xl bg-white px-3 py-3">
              <p className="text-[12px] font-bold leading-5 text-slate-700">
                {hasNamedLocation ? 'Loading accurate candle lighting and Havdalah.' : 'Choose a location to show accurate candle lighting and Havdalah.'}
              </p>
            </div>
          )}
          {shouldAskLocation && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-white/85 p-3">
              <p className="text-[12px] font-bold leading-5 text-slate-700">
                Use your device location and timezone for local Shabbos times?
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <LocationChoiceButton label="Once" onClick={allowOnce} />
                <LocationChoiceButton label="Always" onClick={allowAlways} />
                <LocationChoiceButton label="Never" onClick={denyLocation} muted />
              </div>
            </div>
          )}
        </div>
        {isError && (
          <p className="px-1 text-[11px] font-semibold text-slate-400">
            Showing fallback daily content while today&apos;s row loads.
          </p>
        )}
      </div>
    </section>

    <Sheet open={scheduleOpen} onOpenChange={setScheduleOpen}>
      <SheetContent side="bottom" className="max-h-[86svh] overflow-y-auto rounded-t-[28px] bg-white p-0">
        <SheetHeader className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pb-3 pt-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-[17px] font-black text-slate-950">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Today's Schedule
          </SheetTitle>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">{formatShortDate(today)} · Five Towns</p>
        </SheetHeader>

        <div className="space-y-3 px-4 py-4 pb-10">
          <ScheduleRow
            icon={HandHeart}
            label="Daily mitzvah"
            title={content.mitzvah_text}
            tone="rose"
          />
          <ScheduleRow
            icon={ScrollText}
            label="Torah thought"
            title={content.torah_text}
            tone="blue"
          />
          <div className="rounded-[22px] border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600">
                  <Flame className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">Shabbos times</p>
                  <p className="mt-1 text-[13px] font-bold leading-5 text-slate-800">{locationNote}</p>
                </div>
              </div>
            </div>
            {hasNamedLocation && hasResolvedShabbosTimes ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <TimeBlock label={liveTimes?.candleTitle || 'Candles'} value={formatTime(liveTimes?.candleLighting, timesTimeZone)} />
                <TimeBlock label={liveTimes?.havdalahTitle || 'Havdalah'} value={formatTime(liveTimes?.havdalah, timesTimeZone)} />
              </div>
            ) : (
              <div className="mt-3 rounded-2xl bg-white px-3 py-3">
                <p className="text-[12px] font-bold leading-5 text-slate-700">
                  {hasNamedLocation ? 'Loading accurate candle lighting and Havdalah.' : 'Choose a location to show accurate candle lighting and Havdalah.'}
                </p>
              </div>
            )}
            {shouldAskLocation && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <LocationChoiceButton label="Once" onClick={allowOnce} />
                <LocationChoiceButton label="Always" onClick={allowAlways} />
                <LocationChoiceButton label="Never" onClick={denyLocation} muted />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setScheduleOpen(false);
              navigate('/JewishHub/calendar');
            }}
            className="motion-press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-[13px] font-black text-white"
          >
            <CalendarDays className="h-4 w-4" />
            Open Jewish Calendar
          </button>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}

function DailyItem({ icon: Icon, label, text, tone }) {
  const toneClasses = tone === 'rose'
    ? 'border-rose-100 bg-rose-50 text-rose-700'
    : 'border-blue-100 bg-blue-50 text-blue-700';

  return (
    <div className={`rounded-[18px] border px-3 py-3 ${toneClasses}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-black uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1.5 text-[13px] font-bold leading-snug text-slate-800">{text}</p>
    </div>
  );
}

function ScheduleRow({ icon: Icon, label, title, tone }) {
  const toneClasses = tone === 'rose'
    ? 'bg-rose-50 text-rose-700 border-rose-100'
    : 'bg-blue-50 text-blue-700 border-blue-100';

  return (
    <div className={`rounded-[22px] border p-4 ${toneClasses}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-[14px] font-black leading-5 text-slate-900">{title}</p>
        </div>
      </div>
    </div>
  );
}

function LocationChoiceButton({ label, onClick, muted = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`motion-press h-9 rounded-xl text-[11px] font-black ${
        muted ? 'bg-slate-100 text-slate-500' : 'bg-slate-950 text-white'
      }`}
    >
      {label}
    </button>
  );
}

function TimeBlock({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-[15px] font-black text-slate-950">{value}</p>
    </div>
  );
}
