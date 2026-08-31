import React from 'react';
import { ArrowUpRight, Car, TriangleAlert } from 'lucide-react';

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

function DailyMetric({ label, value, detail }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.08] px-2 py-2.5 ring-1 ring-inset ring-white/[0.04]">
      <strong className="block truncate text-[13px] font-black leading-none text-white">{value}</strong>
      <span className="mt-1 block truncate text-[8px] font-black uppercase tracking-[0.08em] text-blue-100/70">{label}</span>
      {detail && <span className="mt-1 block truncate text-[7px] font-semibold text-white/48">{detail}</span>}
    </div>
  );
}

function trafficState(traffic) {
  const incidents = traffic?.incidents || traffic?.data?.incidents || [];
  if (traffic?.status === 'ready' && incidents.length) {
    return { kind: 'incident', value: 'Alert', incidents, first: incidents[0] };
  }
  if (traffic?.status === 'empty') return { kind: 'empty', value: 'Clear', incidents: [] };
  if (traffic?.status === 'loading') return { kind: 'loading', value: 'Checking', incidents: [] };
  return { kind: 'unavailable', value: 'Unavailable', incidents: [] };
}

function TrafficSummary({ traffic, state }) {
  const href = traffic?.sourceUrl || 'https://511ny.org/';
  if (state.kind === 'incident') {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="mt-2.5 flex min-h-11 items-center gap-2.5 rounded-xl bg-rose-500/15 px-3 py-2 text-left ring-1 ring-inset ring-rose-300/20">
        <TriangleAlert className="h-4 w-4 shrink-0 text-rose-300" />
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-[10px] font-black text-white">{state.first.description || 'Nearby traffic alert'}</strong>
          <span className="mt-0.5 block truncate text-[8px] font-bold text-rose-100/70">{state.first.road || 'Five Towns roads'} · 511NY{state.incidents.length > 1 ? ` · +${state.incidents.length - 1} more` : ''}</span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-rose-200" />
      </a>
    );
  }

  const copy = state.kind === 'empty'
    ? ['No nearby incidents', 'Checked crashes, closures, and roadwork · 511NY']
    : state.kind === 'loading'
      ? ['Checking roads', 'Looking for nearby 511NY incidents']
      : ['Roads unavailable', 'Open 511NY to check current conditions'];

  return (
    <a href={href} target="_blank" rel="noreferrer" className="mt-2.5 flex min-h-11 items-center gap-2.5 rounded-xl bg-white/[0.07] px-3 py-2 text-left ring-1 ring-inset ring-white/[0.05]">
      <Car className={`h-4 w-4 shrink-0 ${state.kind === 'empty' ? 'text-emerald-300' : 'text-blue-200'}`} />
      <span className="min-w-0 flex-1">
        <strong className="block text-[10px] font-black text-white">{copy[0]}</strong>
        <span className="mt-0.5 block truncate text-[8px] font-bold text-blue-100/60">{copy[1]}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-blue-200/60" />
    </a>
  );
}

export default function FiveTownsDailyPanel({ weather, jewishTimes, traffic }) {
  const weatherReady = weather?.status === 'ready' && weather.data;
  const weatherLoading = weather?.status === 'loading';
  const timesLoading = jewishTimes?.status === 'loading';
  const times = jewishTimes?.data || {};
  const roads = trafficState(traffic);
  const weatherValue = weatherReady ? `${weather.data.temperature}°` : weatherLoading ? 'Loading' : 'Unavailable';
  const weatherDetail = weatherReady ? weather.data.condition : weatherLoading ? 'Loading weather' : 'Weather unavailable';

  return (
    <section aria-labelledby="five-towns-today" className="rounded-[23px] bg-[#0A1A39] p-4 text-white shadow-[0_14px_30px_rgba(10,26,57,0.18)]">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#90AFFF]">Your day in Five Towns</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h1 id="five-towns-today" className="text-[21px] font-black tracking-[-0.05em]">Today at a glance</h1>
        <span className="pb-0.5 text-[8px] font-bold text-blue-100/55">Official sources</span>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <DailyMetric label="Weather" value={weatherValue} detail={weatherDetail} />
        <DailyMetric label="Candle lighting" value={timesLoading ? 'Checking' : formatTime(times.candleLighting)} detail={timesLoading ? 'Checking times' : `Shabbat ends ${formatTime(times.havdalah)}`} />
        <DailyMetric label="Sunset" value={timesLoading ? 'Checking' : formatTime(times.sunset)} detail={timesLoading ? 'Checking times' : `Sunrise ${formatTime(times.sunrise)}`} />
        <DailyMetric label="Roads" value={roads.value} detail="511NY" />
      </div>

      <TrafficSummary traffic={traffic} state={roads} />
    </section>
  );
}
