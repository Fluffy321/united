import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight, Pin, MessageCircle, Radio, Send, UserPlus } from 'lucide-react';
import ZmanimWidget from '@/components/jewish/ZmanimWidget';
import ParshaWidget from '@/components/jewish/ParshaWidget';
import { isSunday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCommunityActionCopy, timeAgo } from '@/lib/liveNow';

// ─── Skeleton loader ────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

// ─── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ title, onViewAll }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
      {onViewAll && (
        <button onClick={onViewAll} className="flex items-center gap-0.5 text-[13px] font-semibold text-[#0F5ED7]">
          See all <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function getCommunityRoomType(community) {
  const text = `${community?.name || ''} ${community?.category || ''} ${community?.type || ''}`.toLowerCase();
  if (text.includes('sport')) return 'sports';
  if (text.includes('food') || text.includes('kosher') || text.includes('shabbos') || text.includes('meal')) return 'food';
  if (text.includes('chessed') || text.includes('chesed') || text.includes('mitzvah') || text.includes('help')) return 'chesed';
  if (text.includes('torah') || text.includes('learning') || text.includes('gemara') || text.includes('halacha')) return 'learning';
  if (text.includes('parent') || text.includes('school') || text.includes('camp') || text.includes('carpool')) return 'parents';
  if (text.includes('shul') || text.includes('minyan') || text.includes('chabad') || text.includes('israel')) return 'shul';
  if (text.includes('job') || text.includes('business') || text.includes('hustle')) return 'business';
  if (text.includes('support') || text.includes('mental') || text.includes('anxiety') || text.includes('family')) return 'support';
  return 'local';
}

function buildRoomFeedPreviews({ community, posts = [], events = [], opportunities = [] }) {
  const liveItems = [
    ...opportunities.filter(o => o?.is_active !== false).slice(0, 2).map(o => ({
      label: 'Needs response',
      title: o.title || 'Someone needs help',
      meta: o.location_text || o.category || 'Mitzvah Circle',
      cta: 'Help',
      tone: 'border-red-100 bg-red-50/70 text-red-700',
    })),
    ...events.slice(0, 2).map(e => ({
      label: e.start_time ? `Starts ${e.start_time}` : 'Event',
      title: e.title || 'Community event',
      meta: e.location || e.start_date || 'Happening nearby',
      cta: 'View',
      tone: 'border-amber-100 bg-amber-50/70 text-amber-700',
    })),
    ...posts.slice(0, 2).map(p => ({
      label: p.reply_count ? `${p.reply_count} replies` : 'Active post',
      title: p.title || p.body || 'Community update',
      meta: p.author_name ? `Posted by ${p.author_name}` : 'From this room',
      cta: 'Reply',
      tone: 'border-blue-100 bg-blue-50/70 text-blue-700',
    })),
  ];

  if (liveItems.length >= 3) return liveItems.slice(0, 3);

  const type = getCommunityRoomType(community);
  const fallbackByType = {
    sports: [
      ['Tonight', 'Who wants to play after Maariv?', 'Find a game or fill a team', 'Join'],
      ['Need 2 more', 'Pickup basketball forming', 'Woodmere / Lawrence', 'Respond'],
      ['Training', 'Looking for a running partner', 'This week', 'Message'],
    ],
    food: [
      ['Open now', 'Best quick dinner option tonight?', 'Kosher recs from locals', 'Answer'],
      ['Before Shabbos', 'Extra challah, kugel, or seats?', 'Share what you have', 'Post'],
      ['Need help', 'Family looking for a meal lead', 'Community-only', 'Help'],
    ],
    chesed: [
      ['Needs help now', 'One ride or meal can close this out', 'People are responding', 'Help'],
      ['Almost done', 'Volunteer slot still open', 'Finish the mitzvah', 'Take it'],
      ['Thank you', 'Share a completed mitzvah moment', 'Build momentum', 'Post'],
    ],
    learning: [
      ['Today', 'What are you learning tonight?', 'Find a chavrusa or shiur', 'Join'],
      ['Question', 'Ask one Torah question here', 'Get a real answer', 'Ask'],
      ['Friday prep', 'Share a short parsha thought', 'Useful for Shabbos tables', 'Post'],
    ],
    parents: [
      ['Today', 'Carpool, babysitter, or school question?', 'Get a fast parent answer', 'Ask'],
      ['Camp / school', 'What should parents know this week?', 'Local help', 'Post'],
      ['Need one seat', 'Ride coordination for families', 'Make life easier', 'Help'],
    ],
    shul: [
      ['Minyan today', 'Who is going and who needs a ride?', 'Coordinate now', 'Join'],
      ['This week', 'Shiur, kiddush, or speaker update?', 'Keep people in the loop', 'Post'],
      ['Lost at shul', 'Post found items or requests', 'Fast local visibility', 'Share'],
    ],
    business: [
      ['Hiring', 'Who is looking for work or help?', 'Local opportunities', 'Post'],
      ['Lead', 'Need a trusted Five Towns service?', 'Ask the room', 'Ask'],
      ['Support local', 'Share a Jewish-owned business win', 'Build trust', 'Share'],
    ],
    support: [
      ['Private space', 'Ask anonymously if you need to', 'Membership can stay hidden', 'Ask'],
      ['Check-in', 'What would help today feel easier?', 'Supportive replies only', 'Share'],
      ['Safe help', 'Find someone who understands', 'Community-only', 'Connect'],
    ],
    local: [
      ['Right now', 'What should neighbors know today?', 'Alerts, openings, recs', 'Post'],
      ['Tonight', 'What is happening nearby?', 'Make plans easier', 'Share'],
      ['Question', 'Ask the room before asking a giant chat', 'Fast local answer', 'Ask'],
    ],
  };

  return (fallbackByType[type] || fallbackByType.local).map(([label, title, meta, cta]) => ({
    label,
    title,
    meta,
    cta,
    tone: 'border-slate-200 bg-white text-slate-700',
  })).slice(0, 3);
}

function CommunityActionRoom({ community, posts, events, opportunities, members, onTabChange }) {
  const copy = getCommunityActionCopy(community);
  const roomFeedPreviews = buildRoomFeedPreviews({ community, posts, events, opportunities });
  const activeNeed = opportunities.find(o => o.is_active !== false);
  const latestPost = posts[0];
  const nextEvent = events
    .filter(e => !e.start_date || new Date(`${e.start_date}T00:00:00`) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0))[0];
  const activePeople = Math.max(members.length, community.follower_count || community.member_count || 0);
  const promptChips = [
    ...(copy.prompts || []),
    activeNeed ? `Help with ${activeNeed.title?.slice(0, 28)}` : null,
  ].filter(Boolean).slice(0, 4);

  const statusCards = [
    {
      label: 'Right now',
      value: activeNeed ? 'Need open' : latestPost ? 'Active thread' : 'Open',
      sub: activeNeed?.title || latestPost?.title || latestPost?.body || 'Start the next useful post',
      tone: activeNeed ? 'text-red-700 bg-red-50 border-red-100' : 'text-blue-700 bg-blue-50 border-blue-100',
    },
    {
      label: 'Next win',
      value: nextEvent ? nextEvent.title : copy.nextWin,
      sub: nextEvent?.start_time || 'Make this room useful today',
      tone: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      label: 'People',
      value: `${activePeople} here`,
      sub: activePeople > 1 ? 'Members who can respond' : 'Invite the first responders',
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="overflow-hidden rounded-[26px] border border-blue-100 bg-white shadow-sm"
    >
      <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 72%, #1E3A8A 100%)' }}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 text-[13px] font-extrabold">
            {(community.name || 'J').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/75">
              <Radio className="h-3.5 w-3.5" />
              {copy.room}
            </div>
            <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.01em]">{copy.question}</h2>
            <p className="mt-2 max-w-xl text-[14px] font-semibold leading-relaxed text-white/85">{copy.promise}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {statusCards.map(card => (
            <button
              key={card.label}
              onClick={() => onTabChange(card.label === 'People' ? 'members' : card.label === 'Next win' ? 'events' : 'feed')}
              className={`rounded-2xl border p-3 text-left transition-transform active:scale-[0.98] ${card.tone}`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-70">{card.label}</p>
              <p className="mt-1 truncate text-[15px] font-extrabold">{card.value}</p>
              <p className="mt-1 line-clamp-1 text-[11px] font-semibold opacity-75">{card.sub}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {promptChips.map(chip => (
            <button
              key={chip}
              onClick={() => onTabChange('feed')}
              className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] font-extrabold text-blue-700 active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>

        <button
          onClick={() => onTabChange('feed')}
          className="w-full rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50/60 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-extrabold text-slate-900">Ask, plan, or invite someone in {community.name}</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                {latestPost ? `Last activity ${timeAgo(latestPost.created_date || latestPost.updated_date)}` : 'Make it easy for a real person nearby to answer.'}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-[12px] font-extrabold text-white">
              <Send className="h-3.5 w-3.5" />
              Post
            </span>
          </div>
        </button>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Room feed</p>
            <button onClick={() => onTabChange('feed')} className="text-[12px] font-extrabold text-blue-600">See posts</button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {roomFeedPreviews.map((item, index) => (
              <button
                key={`${item.title}-${index}`}
                onClick={() => onTabChange('feed')}
                className={`rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 active:scale-[0.99] ${item.tone}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-70">{item.label}</p>
                    <p className="mt-1 line-clamp-2 text-[14px] font-extrabold text-slate-900">{item.title}</p>
                    <p className="mt-1 line-clamp-1 text-[11px] font-semibold opacity-75">{item.meta}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-extrabold text-blue-700 shadow-sm">
                    {item.cta}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { title: 'Ask someone here', sub: 'Get a fast local answer', icon: MessageCircle, tab: 'feed', cls: 'bg-sky-50 text-sky-700 border-sky-100' },
            { title: 'Make a plan', sub: 'Tonight, rides, games, help', icon: Calendar, tab: 'events', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
            { title: 'Bring people in', sub: 'Invite the right friends', icon: UserPlus, tab: 'members', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          ].map(action => (
            <button
              key={action.title}
              onClick={() => onTabChange(action.tab)}
              className={`rounded-2xl border p-3 text-left active:scale-[0.98] ${action.cls}`}
            >
              <action.icon className="mb-2 h-4 w-4" />
              <p className="text-[13px] font-extrabold">{action.title}</p>
              <p className="mt-0.5 text-[11px] font-semibold opacity-75">{action.sub}</p>
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── Welcome strip ───────────────────────────────────────────────────────────
function WelcomeStrip({ community, currentUser, postsThisWeek, onTabChange }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = currentUser?.display_name || currentUser?.full_name?.split(' ')[0] || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onTabChange('feed')}
      className="cursor-pointer rounded-2xl p-4 flex items-center gap-3"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)', border: '1px solid #DBEAFE' }}
    >
      <div className="text-2xl flex-shrink-0">👋</div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-900">
          {greeting}{name ? `, ${name}` : ''}.
        </p>
        {postsThisWeek > 0 ? (
          <p className="text-[12px] text-slate-600 mt-0.5">
            <span className="font-semibold text-blue-700">{postsThisWeek} new post{postsThisWeek !== 1 ? 's' : ''}</span> in {community.name} this week.
          </p>
        ) : (
          <p className="text-[12px] text-slate-500 mt-0.5">Welcome to {community.name}!</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
    </motion.div>
  );
}

// ─── Live activity ticker ────────────────────────────────────────────────────
function ActivityTicker({ posts, events, members }) {
  const [index, setIndex] = useState(0);

  const items = [
    ...posts.slice(0, 5).map(p => `${p.author_name || 'Someone'} just posted in Feed`),
    ...events.slice(0, 3).map(e => `New event: ${e.title}`),
    members.length > 0 ? `${members.length} members in this community` : null,
  ].filter(Boolean);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIndex(i => (i + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 flex items-center gap-2 overflow-hidden">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-[12px] text-slate-600 font-medium truncate"
        >
          {items[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ─── Pinned admin announcements carousel ────────────────────────────────────
function PinnedCarousel({ announcements }) {
  const pinned = announcements.slice(0, 3);
  const [idx, setIdx] = useState(0);
  if (pinned.length === 0) return null;

  return (
    <div>
      <SectionHeader title="📌 Pinned" />
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl p-4"
            style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)', border: '2px solid #FCD34D' }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Admin Post</span>
            </div>
            {pinned[idx].title && <h3 className="font-bold text-slate-900 text-[14px] mb-1">{pinned[idx].title}</h3>}
            <p className="text-[13px] text-slate-700 leading-relaxed line-clamp-3">{pinned[idx].body}</p>
          </motion.div>
        </AnimatePresence>
        {pinned.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {pinned.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-amber-500' : 'bg-slate-200'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upcoming events (upgraded) ──────────────────────────────────────────────
function UpcomingEventsModule({ events, communityId, currentUser, onTabChange }) {
  const upcoming = events
    .filter(e => !e.start_date || new Date(e.start_date + 'T00:00:00') >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 3);

  const { data: myRSVPs = [] } = useQuery({
    queryKey: ['community-rsvps', communityId, currentUser?.id],
    queryFn: () => base44.entities.CommunityEventRSVP.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 60000,
  });

  const rsvpedIds = new Set(myRSVPs.map(r => r.event_id));

  const handleRSVP = async (ev, e) => {
    e.stopPropagation();
    if (!currentUser) { navigate('/login'); return; }
    if (rsvpedIds.has(ev.id)) return;
    await base44.entities.CommunityEventRSVP.create({
      event_id: ev.id,
      community_id: communityId,
      user_id: currentUser.id,
      user_name: currentUser.display_name || currentUser.full_name,
      status: 'going',
    });
  };

  if (upcoming.length === 0) return null;

  return (
    <div>
      <SectionHeader title="📅 Upcoming Events" onViewAll={() => onTabChange('events')} />
      <div className="space-y-3">
        {upcoming.map((ev, i) => {
          const isRSVPed = rsvpedIds.has(ev.id);
          const dateStr = ev.start_date
            ? new Date(ev.start_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : null;

          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
            >
              {ev.cover_image_url && (
                <img src={ev.cover_image_url} alt="" className="w-full h-28 object-cover" />
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {dateStr && (
                      <p className="text-[11px] font-bold text-[#2563EB] mb-1">{dateStr}{ev.start_time ? ` · ${ev.start_time}` : ''}</p>
                    )}
                    <h3 className="font-bold text-slate-900 text-[14px] leading-snug">{ev.title}</h3>
                    {ev.location && (
                      <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />{ev.location}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleRSVP(ev, e)}
                    className={`flex-shrink-0 h-8 px-3 rounded-full text-[12px] font-bold transition-colors active:scale-95 ${
                      isRSVPed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-[#2563EB] text-white hover:bg-[#1d4ed8]'
                    }`}
                  >
                    {isRSVPed ? '✓ Going' : 'RSVP'}
                  </button>
                </div>
                {ev.tickets_sold > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1.5">🎟 {ev.tickets_sold} going</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trending this week ──────────────────────────────────────────────────────
function TrendingModule({ posts, onTabChange }) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const trending = posts
    .filter(p => p.created_date && new Date(p.created_date).getTime() > weekAgo)
    .sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0) * 2) - ((a.likes_count || 0) + (a.comments_count || 0) * 2))
    .slice(0, 3);

  if (trending.length === 0) return null;

  return (
    <div>
      <SectionHeader title="🔥 Trending This Week" onViewAll={() => onTabChange('feed')} />
      <div className="space-y-2">
        {trending.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-xl border border-slate-100 p-3 flex items-start gap-3"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-extrabold flex-shrink-0"
              style={{ background: i === 0 ? '#FEF3C7' : i === 1 ? '#F3F4F6' : '#FEE2E2', color: i === 0 ? '#D97706' : i === 1 ? '#6B7280' : '#DC2626' }}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              {post.title && <p className="font-bold text-slate-900 text-[13px] leading-snug">{post.title}</p>}
              <p className="text-[12px] text-slate-600 line-clamp-1 mt-0.5">{post.body}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                <span>❤️ {post.likes_count || 0}</span>
                <span><MessageCircle className="w-3 h-3 inline mr-0.5" />{post.comments_count || 0}</span>
                <span className="text-slate-400">{post.author_name}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Community Mitzvah Circle (scoped) ──────────────────────────────────────
function MitzvahCircleModule({ opportunities, onTabChange }) {
  const active = opportunities.filter(o => o.is_active !== false).slice(0, 2);
  if (active.length === 0) return null;

  return (
    <div>
      <SectionHeader title="🤝 Mitzvah Circle" onViewAll={() => onTabChange('mitzvah')} />
      <div className="space-y-2">
        {active.map(op => (
          <div key={op.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-lg">🤝</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-[13px]">{op.title}</p>
              {op.description && <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5">{op.description}</p>}
            </div>
            <button
              onClick={() => onTabChange('mitzvah')}
              className="flex-shrink-0 h-8 px-3 rounded-full text-[12px] font-bold bg-purple-600 text-white active:scale-95 transition-all"
            >
              Help
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Photos strip ────────────────────────────────────────────────────────────
function PhotosStrip({ posts }) {
  const [lightbox, setLightbox] = useState(null);
  const photos = posts.filter(p => p.image_url || (p.image_urls?.length > 0)).slice(0, 8);

  if (photos.length === 0) return null;

  return (
    <div>
      <SectionHeader title="📸 Photos This Week" />
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {photos.map(p => {
          const url = p.image_url || p.image_urls?.[0];
          return (
            <button
              key={p.id}
              onClick={() => setLightbox(url)}
              className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-100 active:scale-95 transition-transform"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}

// ─── Weekly recap (Sunday only) ──────────────────────────────────────────────
function WeeklyRecapCard({ community, posts, events, members }) {
  if (!isSunday(new Date())) return null;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekPosts = posts.filter(p => p.created_date && new Date(p.created_date).getTime() > weekAgo);
  const weekEvents = events.filter(e => e.start_date && new Date(e.start_date).getTime() > weekAgo);
  if (weekPosts.length === 0 && weekEvents.length === 0) return null;

  const topPost = weekPosts.sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)))[0];

  return (
    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)' }}>
      <p className="text-[11px] font-bold text-white/70 uppercase tracking-wide mb-1">📊 This Week at {community.name}</p>
      <div className="flex gap-4 flex-wrap mt-2">
        {[
          { n: weekPosts.length, label: 'posts' },
          { n: weekEvents.length, label: 'events' },
          { n: members.length, label: 'members' },
        ].map(s => (
          <div key={s.label}>
            <div className="text-[20px] font-extrabold text-white">{s.n}</div>
            <div className="text-[11px] text-white/60">{s.label}</div>
          </div>
        ))}
      </div>
      {topPost && (
        <p className="text-[12px] text-white/80 mt-3 border-t border-white/20 pt-2">
          Top post: "<span className="font-semibold text-white">{(topPost.title || topPost.body || '').slice(0, 60)}</span>"
        </p>
      )}
    </div>
  );
}

// ─── Invite CTA ──────────────────────────────────────────────────────────────
function InviteCTA({ community }) {
  const handleShare = async () => {
    const url = `${window.location.origin}/communities/${community.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Join ${community.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  const typeWord = community.type === 'School' ? 'a parent or alum'
    : community.type === 'Shul' ? 'a member'
    : 'someone you know';

  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)', border: '1px solid #DBEAFE' }}>
      <p className="text-[14px] font-bold text-slate-900 mb-1">Invite {typeWord}</p>
      <p className="text-[12px] text-slate-500 mb-3">Help grow {community.name} — share the link</p>
      <button
        onClick={handleShare}
        className="bg-[#2563EB] text-white rounded-full px-6 py-2 text-[13px] font-bold active:scale-95 transition-all"
      >
        Share Community →
      </button>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function CommunityHomepage({ community, posts, events, opportunities, onTabChange, stats, members = [], currentUser }) {
  const navigate = useNavigate();
  const postsThisWeek = community.posts_this_week || posts.filter(p => {
    return p.created_date && (Date.now() - new Date(p.created_date).getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const announcements = posts.filter(p => p.type === 'announcement' || p.post_type === 'announcement');
  const feedPosts = posts.filter(p => p.type !== 'announcement');

  return (
    <div className="space-y-5 pt-4 pb-28">
      {/* 1. Live action room */}
      <CommunityActionRoom
        community={community}
        posts={feedPosts}
        events={events}
        opportunities={opportunities}
        members={members}
        onTabChange={onTabChange}
      />

      {/* 2. Live activity ticker */}
      <ActivityTicker posts={feedPosts} events={events} members={members} />

      {/* 3. Welcome strip */}
      {postsThisWeek > 0 && (
        <WelcomeStrip
          community={community}
          currentUser={currentUser}
          postsThisWeek={postsThisWeek}
          onTabChange={onTabChange}
        />
      )}

      {/* 4. Pinned announcements */}
      <PinnedCarousel announcements={announcements} />

      {/* 5. Weekly recap (Sunday only) */}
      <WeeklyRecapCard community={community} posts={feedPosts} events={events} members={members} />

      {/* 6. Upcoming Events */}
      <UpcomingEventsModule
        events={events}
        communityId={community.id}
        currentUser={currentUser}
        onTabChange={onTabChange}
      />

      {/* 6. Trending this week */}
      <TrendingModule posts={feedPosts} onTabChange={onTabChange} />

      {/* 7. Mitzvah Circle */}
      <MitzvahCircleModule opportunities={opportunities} onTabChange={onTabChange} />

      {/* 8. Photos strip */}
      <PhotosStrip posts={feedPosts} />

      {/* 9. Parsha of the week */}
      <ParshaWidget />

      {/* 10. Zmanim */}
      <ZmanimWidget compact />

      {/* 11. Invite CTA */}
      <InviteCTA community={community} />
    </div>
  );
}
