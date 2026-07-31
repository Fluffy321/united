import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  Compass,
  HeartHandshake,
  MapPin,
  Sparkles,
  SunMedium,
} from 'lucide-react';
import { getTodayHebrew, getShabbatTimes, getZmanim } from '@/lib/hebrewDate';
import { getStoredCandleOffset } from '@/lib/shabbatLocation';
import useShabbatLocation from '@/hooks/useShabbatLocation';
import DailyTapMitzvah from './DailyTapMitzvah';

const EXCLUDED_BRIEF_TYPES = new Set(['daily_greeting', 'dating', 'prompt']);
const TWO_HOURS = 2 * 60 * 60 * 1000;

const postTitle = (post) => String(post?.title || post?.body || '').trim();

const postLabel = (post) => (
  post?.community_name
  || post?.location_text
  || (post?.type === 'help' ? 'Community need' : null)
  || (post?.type === 'event' ? 'Local event' : null)
  || (post?.type === 'question' ? 'Community question' : null)
  || 'Community post'
);

export function buildBriefingItems({ brief, posts = [] } = {}) {
  const curated = Array.isArray(brief?.topLocalUpdates)
    ? brief.topLocalUpdates
      .filter((item) => String(item?.title || '').trim())
      .slice(0, 3)
      .map((item, index) => ({
        id: item.id || `editor-pick-${index}`,
        title: String(item.title).trim(),
        label: item.source_label || item.source || 'Editor pick',
        provenance: 'editor',
        post: null,
      }))
    : [];

  if (curated.length) return curated;

  return posts
    .filter((post) => post && !EXCLUDED_BRIEF_TYPES.has(post.type) && postTitle(post))
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      title: postTitle(post),
      label: postLabel(post),
      provenance: 'feed',
      post,
    }));
}

export function findUrgentNeed(posts = [], now = new Date()) {
  const nowMs = now.getTime();
  return posts
    .filter((post) => post?.type === 'help')
    .map((post) => ({ post, expiresAt: post.expires_at ? new Date(post.expires_at).getTime() : null }))
    .filter(({ post, expiresAt }) => (
      post.urgent === true
      || post.is_urgent === true
      || (Number.isFinite(expiresAt) && expiresAt > nowMs && expiresAt - nowMs <= TWO_HOURS)
    ))
    .sort((a, b) => (a.expiresAt || Infinity) - (b.expiresAt || Infinity))[0]?.post || null;
}

function BriefItem({ item, index, onOpenPost }) {
  const canOpen = item.provenance === 'feed' && item.post?.id && onOpenPost;
  const content = (
    <>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF0F8] text-[11px] font-black text-[#0F1C2E]">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
          {item.provenance === 'editor' ? 'Editor pick · ' : ''}{item.label}
        </span>
        <span className="mt-0.5 block text-[14px] font-bold leading-[1.35] text-[#0F1C2E]">{item.title}</span>
      </span>
      {canOpen && <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />}
    </>
  );

  if (canOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpenPost(item.post)}
        className="motion-press flex min-h-[58px] w-full items-center gap-3 rounded-[17px] px-3 py-2.5 text-left hover:bg-slate-50"
      >
        {content}
      </button>
    );
  }

  return <div className="flex min-h-[58px] items-center gap-3 rounded-[17px] px-3 py-2.5">{content}</div>;
}

function DisclosureButton({ active, controls, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-controls={controls}
      className={`motion-press flex min-h-[68px] flex-1 items-center gap-2.5 rounded-[18px] border px-3 py-2.5 text-left transition ${
        active ? 'border-[#0F1C2E] bg-[#0F1C2E] text-white' : 'border-slate-200 bg-white text-[#0F1C2E] hover:border-slate-300'
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] ${active ? 'bg-white/10' : 'bg-[#EAF0F8]'}`}>
        <Icon className={`h-[17px] w-[17px] ${active ? 'text-white' : 'text-[#315B8A]'}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-black leading-tight">{title}</span>
        <span className={`mt-0.5 block text-[10px] font-semibold ${active ? 'text-white/60' : 'text-slate-400'}`}>{description}</span>
      </span>
      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${active ? 'rotate-180 text-white/60' : 'text-slate-300'}`} />
    </button>
  );
}

export default function FiveTownsBrief({
  brief,
  posts = [],
  streak,
  currentUser,
  networkLabel = 'Your community',
  onOpenMap,
  onOpenPost,
  onCreate,
}) {
  const { location } = useShabbatLocation();
  const [openPanel, setOpenPanel] = useState(null);
  const [hebrewDate, setHebrewDate] = useState(null);
  const [jewishTime, setJewishTime] = useState(null);

  const items = useMemo(() => buildBriefingItems({ brief, posts }), [brief, posts]);
  const urgentNeed = useMemo(() => findUrgentNeed(posts), [posts]);
  const events = useMemo(() => posts.filter((post) => post?.type === 'event' && postTitle(post)).slice(0, 3), [posts]);
  const activeThreads = useMemo(() => posts
    .filter((post) => postTitle(post) && Number(post.comments_count || 0) + Number(post.likes_count || 0) > 0)
    .sort((a, b) => (Number(b.comments_count || 0) + Number(b.likes_count || 0)) - (Number(a.comments_count || 0) + Number(a.likes_count || 0)))
    .slice(0, 2), [posts]);

  useEffect(() => {
    let active = true;
    getTodayHebrew().then((value) => { if (active) setHebrewDate(value); });

    if (location?.lat && location?.lng) {
      const timeZone = location.tzid || 'America/New_York';
      getShabbatTimes(location.lat, location.lng, timeZone, new Date(), undefined, getStoredCandleOffset())
        .then((times) => {
          if (!active || !times?.candleLighting) return;
          const candleDate = new Date(times.candleLighting);
          if (!Number.isNaN(candleDate.getTime())) {
            setJewishTime({
              label: 'Candle lighting',
              value: candleDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone }),
            });
          }
        });

      const now = new Date();
      if (now.getDay() !== 0 && now.getDay() !== 6) {
        getZmanim(location.lat, location.lng).then((times) => {
          if (!active || !times) return;
          const afternoon = now.getHours() >= 13;
          const raw = times[afternoon ? 'minchaGedola' : 'sofZmanShma'];
          if (!raw) return;
          const date = new Date(raw);
          if (!Number.isNaN(date.getTime())) {
            setJewishTime({
              label: afternoon ? 'Mincha from' : 'Latest Shema',
              value: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone }),
            });
          }
        });
      }
    }

    return () => { active = false; };
  }, [location?.lat, location?.lng, location?.tzid]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const togglePanel = (panel) => setOpenPanel((current) => current === panel ? null : panel);
  const primaryAction = () => {
    if (urgentNeed && onOpenPost) onOpenPost(urgentNeed);
    else onCreate?.('feed', 'local_update', '');
  };

  return (
    <section className="overflow-hidden rounded-[26px] border border-[#DDE3EA] bg-white shadow-[0_16px_36px_rgba(15,28,46,0.08)]">
      <header className="relative overflow-hidden border-b border-[#DDE3EA] px-4 pb-4 pt-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{ background: 'radial-gradient(ellipse 80% 62% at 72% 0%, rgba(201,139,46,0.18), transparent 62%), linear-gradient(180deg, #EAF0F8 0%, rgba(234,240,248,0) 100%)' }}
        />
        <div aria-hidden="true" className="absolute left-4 right-4 top-[58px] h-px bg-gradient-to-r from-transparent via-[#C98B2E]/45 to-transparent" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#315B8A]">
              <SunMedium className="h-3.5 w-3.5" />
              Daily brief · {networkLabel}
            </p>
            <h2 className="font-display mt-3 text-[24px] font-semibold leading-none tracking-[-0.025em] text-[#0F1C2E]">
              What matters today
            </h2>
            <p className="mt-1 text-[12px] font-bold text-slate-500">{dateLabel}</p>
          </div>
          {hebrewDate?.hebrewDate && (
            <p className="max-w-[112px] text-right text-[12px] font-semibold leading-snug text-[#6B5A1E]" dir="rtl">
              {hebrewDate.hebrewDate}
            </p>
          )}
        </div>

        {jewishTime && (
          <div className="relative mt-3 inline-flex min-h-8 items-center gap-2 rounded-full border border-[#D9E1EB] bg-white/80 px-3 text-[11px] font-bold text-slate-600 backdrop-blur-sm">
            <Clock3 className="h-3.5 w-3.5 text-[#C98B2E]" />
            {jewishTime.label} <span className="text-[#0F1C2E]">{jewishTime.value}</span>
          </div>
        )}
      </header>

      <div className="p-3">
        {items.length ? (
          <div className="divide-y divide-slate-100">
            {items.map((item, index) => <BriefItem key={item.id || index} item={item} index={index} onOpenPost={onOpenPost} />)}
          </div>
        ) : (
          <div className="rounded-[18px] bg-[#F7F8FA] px-4 py-4">
            <p className="text-[13px] font-black text-[#0F1C2E]">Nothing has been pinned yet.</p>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">
              The live feed is still here. Share something useful if your community should know about it.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={primaryAction}
          className={`motion-press mt-3 flex min-h-12 w-full items-center justify-between rounded-[17px] px-4 text-left ${
            urgentNeed ? 'bg-[#FFF4EC] text-[#8B3F16]' : 'app-button-primary'
          }`}
        >
          <span>
            <span className="block text-[10px] font-black uppercase tracking-[0.13em] opacity-65">
              {urgentNeed ? 'Needs attention' : 'Add what is missing'}
            </span>
            <span className="mt-0.5 block text-[13px] font-black">
              {urgentNeed ? postTitle(urgentNeed) : 'Share a useful local update'}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>

        <div className="mt-3 flex gap-2">
          <DisclosureButton
            active={openPanel === 'mitzvah'}
            controls="daily-brief-mitzvah"
            icon={HeartHandshake}
            title="Today’s mitzvah"
            description="One small action"
            onClick={() => togglePanel('mitzvah')}
          />
          <DisclosureButton
            active={openPanel === 'explore'}
            controls="daily-brief-explore"
            icon={Compass}
            title="Explore today"
            description="Events, map, activity"
            onClick={() => togglePanel('explore')}
          />
        </div>

        {openPanel === 'mitzvah' && (
          <div id="daily-brief-mitzvah" className="mt-3 rounded-[20px] border border-[#DDE7D1] bg-[#F5F8F0] p-3">
            <DailyTapMitzvah currentUser={currentUser} streak={streak} />
            {!currentUser && <p className="text-[12px] font-semibold text-[#556B2F]">Sign in to choose and track today’s mitzvah.</p>}
            <button
              type="button"
              onClick={() => onCreate?.('help', 'chesed', '')}
              className="motion-press mt-2 flex min-h-11 w-full items-center justify-center rounded-[14px] border border-[#CAD9B7] bg-white text-[12px] font-black text-[#3D4F22]"
            >
              Post a need or offer
            </button>
          </div>
        )}

        {openPanel === 'explore' && (
          <div id="daily-brief-explore" className="mt-3 rounded-[20px] border border-[#D9E1EB] bg-[#F6F8FB] p-3">
            {events.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#315B8A]">
                  <CalendarDays className="h-3.5 w-3.5" /> Events
                </p>
                <div className="mt-2 space-y-1.5">
                  {events.map((event) => (
                    <button key={event.id} type="button" onClick={() => onOpenPost?.(event)} className="flex min-h-11 w-full items-center justify-between rounded-[14px] bg-white px-3 text-left text-[12px] font-bold text-[#0F1C2E]">
                      <span className="line-clamp-2">{postTitle(event)}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeThreads.length > 0 && (
              <div className={events.length ? 'mt-4' : ''}>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#315B8A]">Active conversations</p>
                <div className="mt-2 space-y-1.5">
                  {activeThreads.map((post) => (
                    <button key={post.id} type="button" onClick={() => onOpenPost?.(post)} className="flex min-h-11 w-full items-center justify-between rounded-[14px] bg-white px-3 text-left text-[12px] font-bold text-[#0F1C2E]">
                      <span className="line-clamp-2">{postTitle(post)}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {events.length === 0 && activeThreads.length === 0 && (
              <p className="text-[12px] font-semibold leading-relaxed text-slate-500">No events or active conversations are showing yet. The map can still help you find what is nearby.</p>
            )}

            <button
              type="button"
              onClick={onOpenMap}
              className="app-button-primary mt-3 w-full"
            >
              <MapPin className="h-4 w-4" /> Open the local map
            </button>
          </div>
        )}

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <Sparkles className="h-3 w-3" /> Real community activity only
        </p>
      </div>
    </section>
  );
}
