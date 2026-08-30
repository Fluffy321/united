import React from 'react';
import {
  Car,
  CloudSun,
  Flame,
  MoonStar,
  Sunrise,
  TriangleAlert,
} from 'lucide-react';

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

function UtilityCell({ icon: Icon, label, value, detail, tone = 'bg-blue-50 text-blue-700' }) {
  return (
    <div className="flex min-h-[78px] min-w-0 gap-2.5 rounded-[18px] border border-slate-200/90 bg-white p-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-[17px] w-[17px]" />
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</span>
        <strong className="mt-1 block truncate text-[14px] font-black leading-none tracking-[-0.02em] text-slate-900">{value}</strong>
        {detail && <span className="mt-1 block truncate text-[9px] font-semibold text-slate-500">{detail}</span>}
      </span>
    </div>
  );
}

function TrafficRow({ traffic }) {
  const incidents = traffic?.incidents || traffic?.data?.incidents || [];
  if (traffic?.status === 'ready' && incidents.length) {
    const first = incidents[0];
    return (
      <a href={traffic.sourceUrl || 'https://511ny.org/'} target="_blank" rel="noreferrer" className="flex min-h-[58px] items-center gap-3 rounded-[18px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><TriangleAlert className="h-[17px] w-[17px]" /></span>
        <span className="min-w-0 flex-1"><strong className="block text-[12px] font-black text-rose-950">{first.description}</strong><span className="mt-0.5 block text-[9px] font-bold text-rose-700">{first.road || 'Nearby traffic alert'} · 511NY{incidents.length > 1 ? ` · +${incidents.length - 1} more` : ''}</span></span>
      </a>
    );
  }

  if (traffic?.status === 'loading') {
    return (
      <div className="flex min-h-[58px] items-center gap-3 rounded-[18px] border border-slate-200/90 bg-white px-3.5 py-2.5">
        <span className="flex h-9 w-9 shrink-0 animate-pulse items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Car className="h-[17px] w-[17px]" /></span>
        <span><strong className="block text-[12px] font-black text-slate-900">Checking traffic</strong><span className="mt-0.5 block text-[9px] font-semibold text-slate-500">Looking for nearby 511NY incidents</span></span>
      </div>
    );
  }

  const isVerifiedEmpty = traffic?.status === 'empty';
  return (
    <a href={traffic?.sourceUrl || 'https://511ny.org/'} target="_blank" rel="noreferrer" className="flex min-h-[58px] items-center gap-3 rounded-[18px] border border-slate-200/90 bg-white px-3.5 py-2.5 text-left">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isVerifiedEmpty ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><Car className="h-[17px] w-[17px]" /></span>
      <span className="min-w-0 flex-1"><strong className="block text-[12px] font-black text-slate-900">{isVerifiedEmpty ? 'No nearby 511NY incidents' : 'Live traffic unavailable'}</strong><span className="mt-0.5 block text-[9px] font-semibold text-slate-500">{isVerifiedEmpty ? 'Checked crashes, closures, and roadwork' : 'Open 511NY to check current roads'}</span></span>
    </a>
  );
}

export default function FiveTownsDailyPanel({ weather, jewishTimes, traffic }) {
  const weatherReady = weather?.status === 'ready' && weather.data;
  const weatherLoading = weather?.status === 'loading';
  const timesLoading = jewishTimes?.status === 'loading';
  const times = jewishTimes?.data || {};

  return (
    <section aria-labelledby="five-towns-today" className="space-y-2.5">
      <div className="flex items-end justify-between px-0.5">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#2861E8]">Live utility</span>
          <h1 id="five-towns-today" className="mt-0.5 text-[23px] font-black tracking-[-0.055em] text-[#101A2E]">Five Towns today</h1>
        </div>
        <span className="pb-1 text-[9px] font-bold text-slate-400">Official sources</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <UtilityCell
          icon={CloudSun}
          label="Weather"
          value={weatherReady ? `${weather.data.temperature}°` : weatherLoading ? 'Loading weather' : 'Weather unavailable'}
          detail={weatherReady ? weather.data.condition : weatherLoading ? 'Getting local conditions' : 'Tap source to check'}
          tone="bg-sky-50 text-sky-700"
        />
        <UtilityCell
          icon={Flame}
          label="Candle lighting"
          value={timesLoading ? 'Checking times' : formatTime(times.candleLighting)}
          detail="This coming Shabbat"
          tone="bg-amber-50 text-amber-700"
        />
        <UtilityCell
          icon={Sunrise}
          label="Sunrise"
          value={timesLoading ? 'Checking times' : formatTime(times.sunrise)}
          detail={timesLoading ? 'Getting local solar times' : `Sunset ${formatTime(times.sunset)}`}
          tone="bg-orange-50 text-orange-700"
        />
        <UtilityCell
          icon={MoonStar}
          label="Shabbat ends"
          value={timesLoading ? 'Checking times' : formatTime(times.havdalah)}
          detail="Hebcal local calculation"
          tone="bg-indigo-50 text-indigo-700"
        />
      </div>

      <TrafficRow traffic={traffic} />
      <span className="sr-only">Sunset {formatTime(times.sunset)}</span>
    </section>
  );
}
