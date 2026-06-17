import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Flame, MapPin, ScrollText, Sun } from 'lucide-react';
import useShabbatLocation from '@/hooks/useShabbatLocation';
import { getParsha, getShabbatTimes, getTodayHebrew, getZmanim } from '@/lib/hebrewDate';
import { isResolvedLocationLabel } from '@/lib/shabbatLocation';

const DEFAULT_TIME_ZONE = 'America/New_York';

function formatCivilDate(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatTime(value, timeZone = DEFAULT_TIME_ZONE) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function cleanParshaName(value) {
  return value?.replace(/^Parashat\s+/i, '') || 'This week';
}

export default function DailyJewishHome({ compact = false }) {
  const today = new Date();
  const {
    location,
    locationLoading,
  } = useShabbatLocation({ autoRequest: true });

  const tzid = location?.tzid || DEFAULT_TIME_ZONE;
  const locationLabel = isResolvedLocationLabel(location?.label) ? location.label : null;
  const hasNamedLocation = Boolean(
    location?.lat &&
    location?.lng &&
    locationLabel &&
    location?.type !== 'default' &&
    location?.type !== 'declined'
  );

  const { data: hebrewDate } = useQuery({
    queryKey: ['jewish-hub-hebrew-date', today.toDateString()],
    queryFn: () => getTodayHebrew(),
    staleTime: 6 * 60 * 60 * 1000,
  });

  const { data: shabbatTimes, isLoading: shabbatLoading } = useQuery({
    queryKey: ['jewish-hub-shabbat-times', location?.lat, location?.lng, tzid, today.toDateString()],
    queryFn: () => getShabbatTimes(location.lat, location.lng, tzid, today),
    enabled: hasNamedLocation,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const { data: parshaFallback } = useQuery({
    queryKey: ['jewish-hub-parsha', today.toDateString()],
    queryFn: () => getParsha(),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const { data: zmanim, isLoading: zmanimLoading } = useQuery({
    queryKey: ['jewish-hub-zmanim', location?.lat, location?.lng, tzid, today.toDateString()],
    queryFn: () => getZmanim(location.lat, location.lng, today, tzid),
    enabled: hasNamedLocation,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const locationNote = locationLoading
    ? 'Locating'
    : hasNamedLocation
      ? locationLabel
      : 'Location not resolved';

  const parshaTitle = shabbatTimes?.parsha || parshaFallback?.name;
  const parshaHebrew = shabbatTimes?.hebrew || parshaFallback?.hebrew;

  const keyTimes = [
    { label: 'Sunrise', value: zmanim?.sunrise },
    { label: 'Shema', value: zmanim?.sofZmanShma },
    { label: 'Mincha Gedola', value: zmanim?.minchaGedola },
    { label: 'Sunset', value: zmanim?.sunset },
  ].filter((item) => item.value);

  return (
    <section className={`overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,28,46,0.07)] ${compact ? '' : 'motion-soft-in'}`}>
      <div className="relative border-b border-slate-100 bg-[#FDFCF8] px-5 py-5">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--j-gold-mid)] to-transparent opacity-70" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Today</p>
            <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
              Jewish Hub
            </h1>
            <div className="mt-3 space-y-1">
              <p className="text-[13px] font-bold leading-5 text-slate-600">{formatCivilDate(today, tzid)}</p>
              {hebrewDate?.hebrewString && (
                <p
                  dir="rtl"
                  lang="he"
                  className="text-right text-[22px] font-semibold leading-8 text-slate-950"
                  style={{ fontFamily: 'var(--font-hebrew)', fontKerning: 'normal' }}
                >
                  {hebrewDate.hebrewString}
                </p>
              )}
            </div>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-blue-100 bg-white text-blue-700 shadow-sm">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3">
        <div className="rounded-[24px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-amber-700" />
              <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">This week</p>
            </div>
            {parshaTitle && (
              <span className="rounded-full border border-amber-100 bg-white px-2.5 py-1 text-[10px] font-black text-amber-700">
                Parsha
              </span>
            )}
          </div>
          <p className="text-[18px] font-black leading-tight text-slate-950">{cleanParshaName(parshaTitle)}</p>
          {parshaHebrew && (
            <p
              dir="rtl"
              lang="he"
              className="mt-1 text-right text-[20px] font-semibold leading-8 text-amber-950"
              style={{ fontFamily: 'var(--font-hebrew)', fontKerning: 'normal' }}
            >
              {parshaHebrew}
            </p>
          )}
          {shabbatTimes?.majorHolidays?.length > 0 && (
            <p className="mt-1 text-[12px] font-bold text-amber-800">
              {shabbatTimes.majorHolidays.map((item) => item.title).join(' · ')}
            </p>
          )}
        </div>

        <div className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-blue-700" />
                <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Shabbos reference</p>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <MapPin className="h-3 w-3" />
                {locationNote}
              </p>
            </div>
            {(locationLoading || shabbatLoading) && <span className="text-[11px] font-black text-slate-400">Loading</span>}
          </div>
          {hasNamedLocation ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TimeCard label={shabbatTimes?.candleTitle || 'Candle lighting'} value={formatTime(shabbatTimes?.candleLighting, tzid)} />
              <TimeCard label={shabbatTimes?.havdalahTitle || 'Havdalah'} value={formatTime(shabbatTimes?.havdalah, tzid)} />
            </div>
          ) : (
            <div className="mt-3 rounded-[18px] border border-blue-100 bg-white/80 px-3 py-3">
              <p className="text-[12px] font-bold leading-5 text-slate-600">
                Enable or choose a named location in Settings to show local candle lighting and Havdalah.
              </p>
            </div>
          )}
          <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-400">
            Times are reference only. Follow your local luach and ask your rav for practical halacha.
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-slate-700" />
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-600">Key zmanim</p>
            </div>
            {(locationLoading || zmanimLoading) && <span className="text-[11px] font-black text-slate-400">Loading</span>}
          </div>
          {hasNamedLocation && keyTimes.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {keyTimes.map((item) => (
                <TimeCard key={item.label} label={item.label} value={formatTime(item.value, tzid)} muted />
              ))}
            </div>
          ) : (
            <p className="text-[12px] font-semibold leading-5 text-slate-500">
              Zmanim will appear after a named location is available.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function TimeCard({ label, value, muted = false }) {
  return (
    <div className={`rounded-[18px] border px-3 py-3 ${muted ? 'border-slate-200 bg-white' : 'border-white bg-white/85'}`}>
      <p className="truncate text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-[15px] font-black leading-none text-slate-950">{value}</p>
    </div>
  );
}
