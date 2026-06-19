import React from 'react';
import { CalendarDays, Flame, HandHeart, ScrollText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { getShabbosTimes } from '@/utils/shabbos';
import useShabbatLocation from '@/hooks/useShabbatLocation';
import { getShabbatTimes } from '@/lib/hebrewDate';

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
  return new Intl.DateTimeFormat('en-US', {
    timeZone: FIVE_TOWNS_TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatTime(date, timeZone = FIVE_TOWNS_TIME_ZONE) {
  if (!date) return 'TBD';
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
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

export default function TodayFiveTownsCard() {
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
    isDefault: isDefaultLocation,
  } = useShabbatLocation({ autoRequest: true });

  const { data, isError } = useQuery({
    queryKey: ['daily-content', dateKey],
    queryFn: () => loadDailyContent(dateKey),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const { data: liveTimes, isLoading: timesLoading } = useQuery({
    queryKey: [
      'live-shabbos-times',
      candleLocation?.lat,
      candleLocation?.lng,
      candleLocation?.tzid,
      dateKey,
    ],
    queryFn: () => getShabbatTimes(
      candleLocation.lat,
      candleLocation.lng,
      candleLocation.tzid || FIVE_TOWNS_TIME_ZONE,
      today
    ),
    enabled: Boolean(candleLocation?.lat && candleLocation?.lng),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const content = data || DEFAULT_CONTENT;
  const fallbackTimes = getShabbosTimes(content);
  const candleLighting = liveTimes?.candleLighting
    ? new Date(liveTimes.candleLighting)
    : fallbackTimes.candleLighting;
  const havdalah = liveTimes?.havdalah
    ? new Date(liveTimes.havdalah)
    : fallbackTimes.havdalah;
  const timesTimeZone = candleLocation?.tzid || FIVE_TOWNS_TIME_ZONE;
  const locationLabel = candleLocation?.label || 'Five Towns, NY';
  const locationNote = locationLoading || timesLoading
    ? 'Locating...'
    : locationError === 'declined'
      ? 'Five Towns fallback'
      : isDefaultLocation
        ? 'Five Towns default'
        : locationLabel;

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-800 px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-white/70">{formatShortDate(today)}</p>
            <h2 className="mt-0.5 text-[18px] font-black leading-tight">Today in the Five Towns</h2>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <CalendarDays className="h-5 w-5" />
          </div>
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
          <div className="mt-2 grid grid-cols-2 gap-2">
            <TimeBlock label="Candles" value={formatTime(candleLighting, timesTimeZone)} />
            <TimeBlock label="Havdalah" value={formatTime(havdalah, timesTimeZone)} />
          </div>
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
