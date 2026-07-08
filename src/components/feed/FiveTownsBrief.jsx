import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MapPin, Sparkles } from 'lucide-react';
import { getTodayHebrew, getShabbatTimes, getZmanim, getDafYomi, getParshaDescription, getTodayEvents } from '@/lib/hebrewDate';
import { getStoredCandleOffset } from '@/lib/shabbatLocation';
import useShabbatLocation from '@/hooks/useShabbatLocation';

const BRIEF_SLIDE_GRADIENTS = {
  today:   'from-[#0a1628] via-[#0d1f3c] to-[#152a52]',
  mitzvah: 'from-[#081a10] via-[#0d2e1a] to-[#0f3d20]',
  events:  'from-[#130a28] via-[#1e0d3c] to-[#2a1255]',
  nearby:  'from-[#081a1a] via-[#0d2e2e] to-[#0f3d3d]',
  pulse:   'from-[#0a1628] via-[#0d1a38] to-[#0f2040]',
  shabbos: 'from-[#1a0f05] via-[#2e1a08] to-[#3d2010]',
};

const FIVE_TOWNS_LAT = 40.6198;
const FIVE_TOWNS_LNG = -73.7298;

export default function FiveTownsBrief({ brief, momentum, posts = [], joinedCommunityIds, communitiesEnabled = true, prompt, streak, onOpenMap, onOpenCommunities, onCreate }) {
  const { location: candleLocation } = useShabbatLocation();
  const [activeSlide, setActiveSlide] = useState(0);
  const briefScrollerRef = useRef(null);
  const carouselRef = useRef(null);
  const safeBrief = brief || {};

  const [hebrewDate, setHebrewDate] = useState(null);
  const [candleLighting, setCandleLighting] = useState(null);
  const [zmanOfDay, setZmanOfDay] = useState(null);
  const [parshaDescription, setParshaDescription] = useState(null);
  const [dafYomi, setDafYomi] = useState(null);
  const [todayJewishEvents, setTodayJewishEvents] = useState([]);
  const [shareTarget, setShareTarget] = useState(null);
  const [thoughtText, setThoughtText] = useState('');
  const [mitzvahText, setMitzvahText] = useState('');
  const [mitzvahShareTarget, setMitzvahShareTarget] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mitzvahProgress] = useState(() => Math.min(100, Math.max(0, (momentum?.mitzvahs || 0) * 2 + 28)));
  const currentStreak = streak?.current_streak || 0;

  useEffect(() => {
    getTodayHebrew().then(setHebrewDate);
    const loc = (candleLocation && candleLocation.type !== 'default') ? candleLocation : { lat: FIVE_TOWNS_LAT, lng: FIVE_TOWNS_LNG, tzid: 'America/New_York' };
    getShabbatTimes(loc.lat, loc.lng, loc.tzid || 'America/New_York', new Date(), undefined, getStoredCandleOffset()).then((times) => {
      if (times?.candleLighting) {
        const dt = new Date(times.candleLighting);
        if (!isNaN(dt.getTime())) {
          const parshaTitle = times.parsha;
          setCandleLighting({
            timeStr: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }),
            date: dt,
            parsha: parshaTitle,
          });
          if (parshaTitle) getParshaDescription(parshaTitle).then(setParshaDescription);
        }
      }
    });
    getDafYomi().then(setDafYomi);
    getTodayEvents().then(setTodayJewishEvents);
    const now = new Date();
    const isWeekday = now.getDay() !== 0 && now.getDay() !== 6;
    if (isWeekday) {
      getZmanim(loc.lat, loc.lng).then((times) => {
        if (!times) return;
        const isAfternoon = now.getHours() >= 13;
        const key = isAfternoon ? 'minchaGedola' : 'sofZmanShma';
        const label = isAfternoon ? 'Mincha from' : 'Latest Shacharis';
        const raw = times[key];
        if (raw) {
          const dt = new Date(raw);
          if (!isNaN(dt.getTime())) {
            setZmanOfDay({
              label,
              timeStr: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }),
            });
          }
        }
      });
    }
  }, [candleLocation?.lat, candleLocation?.lng, candleLocation?.tzid]);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayHour = today.getHours();
  const msUntilCandles = candleLighting?.date ? candleLighting.date - today : null;
  // Wed afternoon (≥13:00) through Friday before candle lighting
  const isWedAfternoon = dayOfWeek === 3 && todayHour >= 13;
  const isThuOrFri = (dayOfWeek === 4 || dayOfWeek === 5) && (msUntilCandles === null || msUntilCandles > 0);
  const showShabbos = isWedAfternoon || isThuOrFri;
  // 'prep' = Wed; 'countdown' = Thu/Fri
  const shabbosMode = isThuOrFri ? 'countdown' : 'prep';
  const hoursUntil = msUntilCandles ? Math.max(0, Math.floor(msUntilCandles / 3_600_000)) : 0;
  const minutesUntil = msUntilCandles ? Math.max(0, Math.floor((msUntilCandles % 3_600_000) / 60_000)) : 0;

  const curatedNewsItems = (safeBrief.topLocalUpdates || []).map((item, index) => ({
    id: item.id || `curated-local-${index}`,
    title: item.title || 'Verified local update',
    community_name: item.source_label || item.source || 'Verified local source',
  }));
  const fallbackNewsItems = posts
    .filter((post) => post.type === 'news' || /update|brief|eruv|traffic|school|notice|local/i.test(`${post.title || ''} ${post.body || ''}`))
    .slice(0, 3);
  const parshaName = candleLighting?.parsha?.replace(/^Parashat\s+/i, '') || null;
  const defaultNewsItems = [
    parshaName
      ? { id: 'n1', title: parshaDescription || `This week's parsha: ${parshaName}`, community_name: `Parashat ${parshaName}` }
      : { id: 'n1', title: 'Look for one small way to help a neighbor today.', community_name: 'Daily mitzvah' },
    dafYomi
      ? { id: 'n2', title: `Today's Daf Yomi: ${dafYomi.title}`, community_name: 'Daf Yomi' }
      : { id: 'n2', title: 'A Jewish community is built one thoughtful action at a time.', community_name: 'Torah thought' },
    todayJewishEvents.length
      ? { id: 'n3', title: todayJewishEvents[0].title, community_name: todayJewishEvents[0].category || 'Jewish calendar' }
      : { id: 'n3', title: "Check today's schedule for local times, events, and community moments.", community_name: "Today's schedule" },
  ];
  const newsItems = curatedNewsItems.length ? curatedNewsItems : fallbackNewsItems.length ? fallbackNewsItems : defaultNewsItems;

  const now = new Date();
  const mitzvahNeeds = posts
    .filter((post) => post.type === 'help' || /help|chesed|meal|ride|offer|volunteer/i.test(`${post.title || ''} ${post.body || ''}`))
    .slice(0, 3)
    .map((post) => {
      const expiresAt = post.expires_at ? new Date(post.expires_at) : null;
      const urgent = expiresAt && (expiresAt - now) < 2 * 3_600_000 && expiresAt > now;
      return { ...post, urgent };
    });
  const mitzvahItems = mitzvahNeeds.length ? mitzvahNeeds : [
    { id: 'm1', title: 'Meal needed — Schwartz family', community_name: 'Chesed', location_text: '0.3 mi · Tonight', urgent: false },
    { id: 'm2', title: 'Ride needed — Mrs. Cohen', community_name: 'Chesed', location_text: '1.1 mi · By 2 PM', urgent: true },
  ];

  const communityEvents = posts
    .filter((post) => post.type === 'event')
    .slice(0, 3);
  const eventItems = communityEvents.length ? communityEvents : [
    { id: 'e1', title: 'Shacharis', community_name: 'Young Israel Woodmere', location_text: '7:30 AM' },
    { id: 'e2', title: 'Daf Yomi Shiur', community_name: 'Agudah Lawrence', location_text: '8:00 PM' },
    { id: 'e3', title: 'Community Board Meeting', community_name: 'Cedarhurst', location_text: '9:00 PM' },
  ];

  const trendingMoments = [...posts]
    .sort((a, b) => ((b.comments_count || 0) * 2 + (b.likes_count || 0)) - ((a.comments_count || 0) * 2 + (a.likes_count || 0)))
    .filter((p) => (p.comments_count || 0) + (p.likes_count || 0) > 0)
    .slice(0, 3)
    .map((p) => ({ emoji: '🔥', text: `Most discussed: ${p.title || p.body || 'Community thread'}` }));
  const pulseStats = [
    ...(trendingMoments.length ? trendingMoments : [
      { emoji: '🔥', text: 'Most discussed: Hatzalah fundraiser in Cedarhurst' },
      { emoji: '🔥', text: 'Hot thread: Eruv status update — Lawrence' },
    ]),
    { emoji: '🍲', text: `${Math.max(1, momentum?.mitzvahs || 3)} meal requests open` },
    { emoji: '📋', text: `${Math.max(1, momentum?.joinedPosts || 7)} new community posts` },
  ].slice(0, 4);

  const slideKeys = ['today', 'mitzvah', 'events', 'nearby', 'pulse', ...(showShabbos ? ['shabbos'] : [])];
  const slideLabels = ['Today', 'Daily Mitzvah', 'Events', 'Near You', 'Pulse', ...(showShabbos ? [shabbosMode === 'prep' ? 'Shabbos Prep' : 'Shabbos'] : [])];

  useEffect(() => {
    if (activeSlide >= slideKeys.length) setActiveSlide(0);
  }, [activeSlide, slideKeys.length]);


  const visibleSlide = Math.min(activeSlide, slideKeys.length - 1);
  const currentKey = slideKeys[visibleSlide];
  const englishDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border border-white/8 shadow-[0_14px_32px_rgba(10,18,40,0.18)]">
      <style>{`
        @keyframes brief-progress { from { width: 0 } }
        .brief-progress-bar { animation: brief-progress 1.1s cubic-bezier(.4,0,.2,1) both; }
        @keyframes brief-pulse { 0%,100% { opacity:1 } 50% { opacity:.55 } }
        .brief-last-chance { animation: brief-pulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .brief-progress-bar,.brief-last-chance { animation: none; } }
        .brief-share-input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>

      <div className={`bg-gradient-to-br ${BRIEF_SLIDE_GRADIENTS[currentKey]} p-4 text-white transition-all duration-500`}>

        {/* Header row — always visible, toggles open/close */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen(o => !o)}
            className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em]"
            style={{ color: '#D4A843' }}
          >
            <Sparkles className="h-3 w-3" />
            Five Towns Daily Brief
            {isOpen
              ? <ChevronUp className="h-3 w-3 ml-0.5 opacity-70" />
              : <ChevronDown className="h-3 w-3 ml-0.5 opacity-70" />}
          </button>
          {!isOpen && hebrewDate?.hebrewDate && (
            <span className="text-[11px] font-semibold text-white/60">{hebrewDate.hebrewDate}</span>
          )}
          {/* Dot indicators + desktop prev/next */}
          <div className="flex items-center gap-2">
            {/* Prev/next arrows — hidden on touch devices, visible on desktop */}
            <button
              type="button"
              onClick={() => goToSlide((visibleSlide - 1 + slideKeys.length) % slideKeys.length)}
              className="hidden sm:flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white/15 active:scale-90"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-white/60" />
            </button>
            <div className="flex items-center gap-1">
              {slideKeys.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSlide(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    height: '5px',
                    width: i === visibleSlide ? '18px' : '5px',
                    background: i === visibleSlide ? '#D4A843' : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goToSlide((visibleSlide + 1) % slideKeys.length)}
              className="hidden sm:flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white/15 active:scale-90"
              aria-label="Next slide"
            >
              <ChevronRight className="h-3.5 w-3.5 text-white/60" />
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateRows: isOpen ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
        <div style={{ overflow: 'hidden' }}>
        {/* Gold rule */}
        <div className="mt-3 mb-3" style={{ height: '1px', background: 'linear-gradient(90deg, #D4A843 0%, rgba(212,168,67,0.15) 100%)' }} />

        {/* Slide label + slide name tabs (horizontal scroll, compact) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {slideLabels.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => goToSlide(i)}
              className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide transition-all"
              style={{
                background: i === visibleSlide ? '#D4A843' : 'rgba(255,255,255,0.08)',
                color: i === visibleSlide ? '#0a1628' : 'rgba(255,255,255,0.6)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Slides container — show only the active slide to avoid dead space from height mismatch */}
        <div className="mt-4" ref={carouselRef}>

          {/* SLIDE 1 — Today */}
          <div className={visibleSlide === 0 ? '' : 'hidden'}>
            <div className="mb-3">
              <p className="text-[22px] font-black leading-tight tracking-tight">{englishDate}</p>
              <p className="mt-0.5 text-sm font-semibold" style={{ fontFamily: "'Heebo', 'Arial Hebrew', sans-serif", direction: 'rtl', color: '#D4A843' }}>
                {hebrewDate?.hebrewString || ''}
              </p>
              {hebrewDate?.display && (
                <p className="text-[11px] font-semibold" style={{ color: 'rgba(212,168,67,0.6)' }}>{hebrewDate.display}</p>
              )}
            </div>
            <div className="mb-3 rounded-xl px-3 py-2" style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)' }}>
              {candleLighting && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">🕯</span>
                  <span className="text-xs font-semibold text-white/70">Candle lighting</span>
                  <span className="text-xs font-black text-white">{candleLighting.timeStr}</span>
                  {candleLighting.parsha && <span className="ml-auto text-[10px] text-white/40">{candleLighting.parsha}</span>}
                </div>
              )}
              {zmanOfDay && !showShabbos && (
                <div className="flex items-center gap-2 mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(212,168,67,0.15)' }}>
                  <span className="text-sm">🕍</span>
                  <span className="text-xs font-semibold text-white/70">{zmanOfDay.label}</span>
                  <span className="text-xs font-black text-white">{zmanOfDay.timeStr}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {newsItems.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)', borderLeft: '2px solid #D4A843' }}>
                  <p className="text-[10px] font-black uppercase tracking-wide mb-0.5" style={{ color: '#D4A843' }}>{item.community_name}</p>
                  <p className="text-[13px] font-semibold leading-snug text-white">{item.title}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onOpenMap}
              className="motion-press mt-3 w-full rounded-xl py-2.5 text-[12px] font-black flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)' }}
            >
              <MapPin className="h-3.5 w-3.5" />
              View Five Towns Map
            </button>
          </div>

          {/* SLIDE 2 — Daily Mitzvah */}
          <div className={visibleSlide === 1 ? '' : 'hidden'}>
            <div className="flex items-start justify-between mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#4CAF7D' }}>Daily Mitzvah</p>
              {currentStreak > 1 && (
                <span className="text-[11px] font-black" style={{ color: '#fb923c' }}>🔥 {currentStreak} days in a row</span>
              )}
            </div>
            <p className="text-[19px] font-black leading-snug mb-1">
              {(safeBrief.topLocalUpdates?.[0]?.title) || 'Look for one small way to help a neighbor today.'}
            </p>
            <p className="text-xs mb-3 text-white/50">Five Towns · {englishDate}</p>

            {/* Progress bar */}
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-wide mb-2 text-white/40">Community progress</p>
              <div className="rounded-full overflow-hidden" style={{ height: '7px', background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="brief-progress-bar h-full rounded-full"
                  style={{ width: `${mitzvahProgress}%`, background: 'linear-gradient(90deg, #4CAF7D, #6fcf97)', animationDuration: '1.1s' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-white/20">Starting out</span>
                <span className="text-[9px] text-white/20">Community goal</span>
              </div>
            </div>

            {/* Composer box 1 — Mitzvah / act of kindness */}
            {(() => {
              const TARGETS = [
                { label: 'Yourself',    type: 'feed',    subtype: 'self_note' },
                { label: 'A Friend',    type: 'message', subtype: 'friend'    },
                { label: 'The Feed',    type: 'feed',    subtype: 'thought'   },
              ];
              const send = () => {
                const t = TARGETS.find(x => x.label === mitzvahShareTarget);
                if (t) onCreate(t.type, t.subtype, mitzvahText);
                setMitzvahText(''); setMitzvahShareTarget(null);
              };
              return (
                <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)' }}>
                  <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: '#4CAF7D' }}>✦ Share a mitzvah or act of kindness you did today</p>
                  <textarea
                    className="brief-share-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none mb-3"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${mitzvahText ? 'rgba(76,175,125,0.6)' : 'rgba(255,255,255,0.1)'}`, minHeight: '72px', lineHeight: '1.5' }}
                    placeholder="I helped a neighbor carry groceries today…"
                    value={mitzvahText}
                    onChange={e => setMitzvahText(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    {TARGETS.map(({ label }) => (
                      <button key={label} type="button"
                        onClick={() => { setMitzvahShareTarget(mitzvahShareTarget === label ? null : label); }}
                        className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                        style={{
                          background: mitzvahShareTarget === label ? '#4CAF7D' : 'rgba(255,255,255,0.09)',
                          color: mitzvahShareTarget === label ? '#081a10' : 'white',
                          border: `1px solid ${mitzvahShareTarget === label ? '#4CAF7D' : 'rgba(255,255,255,0.12)'}`,
                        }}
                      >{label}</button>
                    ))}
                    <button type="button" disabled className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      Communities ·
                    </button>
                    {mitzvahText.trim() && mitzvahShareTarget && (
                      <button type="button" onClick={send}
                        className="ml-auto rounded-full px-4 py-1.5 text-[12px] font-black transition-all"
                        style={{ background: '#4CAF7D', color: '#081a10' }}>
                        Share →
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Composer box 2 — Thought or Dvar Torah */}
            {(() => {
              const TARGETS = [
                { label: 'Yourself',    type: 'feed',    subtype: 'self_note' },
                { label: 'A Friend',    type: 'message', subtype: 'friend'    },
                { label: 'The Feed',    type: 'feed',    subtype: 'thought'   },
              ];
              const send = () => {
                const t = TARGETS.find(x => x.label === shareTarget);
                if (t) onCreate(t.type, t.subtype, thoughtText);
                setThoughtText(''); setShareTarget(null);
              };
              return (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <p className="text-[11px] font-black uppercase tracking-widest mb-3 text-white/60">📖 Share a thought or Dvar Torah</p>
                  <textarea
                    className="brief-share-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none mb-3"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${thoughtText ? 'rgba(76,175,125,0.6)' : 'rgba(255,255,255,0.1)'}`, minHeight: '72px', lineHeight: '1.5' }}
                    placeholder="This week's parsha teaches us…"
                    value={thoughtText}
                    onChange={e => setThoughtText(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    {TARGETS.map(({ label }) => (
                      <button key={label} type="button"
                        onClick={() => { setShareTarget(shareTarget === label ? null : label); }}
                        className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                        style={{
                          background: shareTarget === label ? '#4CAF7D' : 'rgba(255,255,255,0.09)',
                          color: shareTarget === label ? '#081a10' : 'white',
                          border: `1px solid ${shareTarget === label ? '#4CAF7D' : 'rgba(255,255,255,0.12)'}`,
                        }}
                      >{label}</button>
                    ))}
                    <button type="button" disabled className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      Communities ·
                    </button>
                    {thoughtText.trim() && shareTarget && (
                      <button type="button" onClick={send}
                        className="ml-auto rounded-full px-4 py-1.5 text-[12px] font-black transition-all"
                        style={{ background: '#4CAF7D', color: '#081a10' }}>
                        Share →
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* SLIDE 3 — Today's Events */}
          <div className={visibleSlide === 2 ? '' : 'hidden'}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#a78bfa' }}>Today&rsquo;s Events</p>
            <div className="space-y-2 mb-4">
              {eventItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-[11px] font-black shrink-0" style={{ color: '#a78bfa', minWidth: '52px' }}>{item.location_text || ''}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold leading-tight text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{item.community_name || item.location_text || 'Five Towns'}</p>
                  </div>
                </div>
              ))}
              {eventItems.length === 0 && (
                <p className="text-sm text-white/30 py-3 text-center">No events posted yet today.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onCreate('event', 'local_event', '')}
              className="motion-press w-full rounded-xl py-2.5 text-[12px] font-black transition-opacity hover:opacity-80"
              style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              + Post an event
            </button>
          </div>

          {/* SLIDE 4 — Mitzvahs Near You */}
          <div className={visibleSlide === 3 ? '' : 'hidden'}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#4CAF7D' }}>Mitzvahs Near You</p>
            <div className="space-y-2 mb-4">
              {mitzvahItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{
                    background: item.urgent ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.06)',
                    border: item.urgent ? '1px solid rgba(251,146,60,0.3)' : '1px solid transparent',
                  }}
                >
                  <div className="min-w-0 mr-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold leading-tight text-white">{item.title}</p>
                      {item.urgent && <span className="text-[10px] font-black shrink-0" style={{ color: '#fb923c' }}>⏳ Urgent</span>}
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5">{item.location_text || item.community_name || 'Five Towns'}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-black"
                    style={{ background: item.urgent ? 'rgba(251,146,60,0.2)' : 'rgba(76,175,125,0.15)', color: item.urgent ? '#fb923c' : '#4CAF7D' }}
                  >
                    Help →
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onCreate('help', 'chesed', '')}
              className="motion-press w-full rounded-xl py-2.5 text-[12px] font-black transition-opacity hover:opacity-80"
              style={{ background: 'rgba(76,175,125,0.12)', color: '#4CAF7D', border: '1px solid rgba(76,175,125,0.2)' }}
            >
              + Post a mitzvah
            </button>
          </div>

          {/* SLIDE 5 — Community Pulse */}
          <div className={visibleSlide === 4 ? '' : 'hidden'}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#D4A843' }}>Community Pulse</p>
            <p className="text-[19px] font-black leading-snug mb-4">What&rsquo;s happening in the Five Towns right now</p>
            <div className="space-y-2">
              {pulseStats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-base">{stat.emoji}</span>
                  <span className="text-[13px] font-semibold text-white">{stat.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SLIDE 6 — Shabbos (Wed prep / Thu–Fri countdown) */}
          {showShabbos && (() => {
            const lastChance = msUntilCandles !== null && msUntilCandles < 30 * 60_000 && msUntilCandles > 0;

            if (shabbosMode === 'prep') {
              const prepChecklist = [
                { emoji: '🛒', label: 'Groceries & Shabbos shopping' },
                { emoji: '🍲', label: 'Meal prep — check what you need' },
                { emoji: '🚗', label: 'Post ride needs or offers' },
                { emoji: '👥', label: 'Confirm Shabbos guests' },
                { emoji: '🕯️', label: `Candles: ${candleLighting?.timeStr || '—'} · Five Towns` },
              ];
              return (
                <div className={`pt-1 pb-1 ${visibleSlide === 5 ? '' : 'hidden'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-center" style={{ color: '#fb923c' }}>
                    Shabbos Prep
                  </p>
                  {candleLighting?.parsha && (
                    <p className="text-[15px] font-black leading-tight mb-3 text-white text-center">{candleLighting.parsha}</p>
                  )}
                  <ul className="space-y-1.5">
                    {prepChecklist.map(({ emoji, label }) => (
                      <li key={label} className="flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2">
                        <span className="text-base leading-none">{emoji}</span>
                        <span className="text-[12px] font-semibold text-white/90 leading-tight">{label}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={onCreate}
                    className="mt-3 w-full rounded-xl py-2 text-[12px] font-black text-white/80 border border-white/15 hover:bg-white/10 transition-colors"
                  >
                    + Post a Shabbos need
                  </button>
                </div>
              );
            }

            return (
              <div className={`text-center pt-2 pb-1 ${visibleSlide === 5 ? '' : 'hidden'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: lastChance ? '#ef4444' : '#fb923c' }}>
                  {lastChance ? '⚠️ Last Chance' : 'Shabbos Countdown'}
                </p>
                {candleLighting?.parsha && (
                  <p className="text-[22px] font-black leading-tight mb-3 text-white">{candleLighting.parsha}</p>
                )}
                <div className={`mb-1 ${lastChance ? 'brief-last-chance' : ''}`}>
                  <span className="font-black leading-none tracking-tight" style={{ fontSize: lastChance ? '44px' : '52px', color: lastChance ? '#ef4444' : '#fb923c' }}>
                    {hoursUntil}h {minutesUntil}m
                  </span>
                </div>
                <p className="text-sm text-white/50 mb-1">until candle lighting</p>
                <p className="text-base font-black text-white">{candleLighting?.timeStr || '8:14 PM'} · Five Towns</p>
                <p className="mt-5 text-2xl font-black" style={{ fontFamily: "'Heebo', 'Arial Hebrew', sans-serif", color: '#D4A843' }}>
                  שבת שלום
                </p>
              </div>
            );
          })()}

        </div>
        </div>
        </div>
      </div>
    </section>
  );
}
