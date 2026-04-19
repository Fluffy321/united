import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, HandHeart, ChevronRight, Pin, MessageCircle, TrendingUp, Image as ImageIcon, Users } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isSunday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

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
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
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
  const postsThisWeek = community.posts_this_week || posts.filter(p => {
    return p.created_date && (Date.now() - new Date(p.created_date).getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const announcements = posts.filter(p => p.type === 'announcement' || p.post_type === 'announcement');
  const feedPosts = posts.filter(p => p.type !== 'announcement');

  return (
    <div className="space-y-5 pt-4 pb-28">
      {/* 1. Welcome strip */}
      <WelcomeStrip
        community={community}
        currentUser={currentUser}
        postsThisWeek={postsThisWeek}
        onTabChange={onTabChange}
      />

      {/* 2. Pinned announcements */}
      <PinnedCarousel announcements={announcements} />

      {/* 3. Live activity ticker */}
      <ActivityTicker posts={feedPosts} events={events} members={members} />

      {/* 4. Weekly recap (Sunday only) */}
      <WeeklyRecapCard community={community} posts={feedPosts} events={events} members={members} />

      {/* 5. Upcoming Events */}
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

      {/* 9. Invite CTA */}
      <InviteCTA community={community} />
    </div>
  );
}