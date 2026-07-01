import React from 'react';
import { CalendarDays, Car, Handshake, MapPin, MessageCircle, Sparkles, Store } from 'lucide-react';

export default function FiveTownsConversationHub({ posts = [], networkLabel = 'Five Towns', onCreate, onOpenMap, onOpenMitzvah, onOpenEvents, onOpenMarketplace }) {
  // Include daily_greeting posts so the "updated" timestamp always reflects today's auto-post
  const allPosts = [...posts];
  const recentPosts = allPosts
    .filter((post) => post.type !== 'prompt' && post.type !== 'daily_greeting')
    .slice(0, 4);
  const activeThreads = allPosts.filter((post) => Number(post.comments_count || 0) > 0).length;
  const needsToday = allPosts.filter((post) => /need|help|ride|meal|tonight|today|urgent/i.test(`${post.title || ''} ${post.body || ''}`)).length;
  // Prefer daily_greeting post's timestamp so the hub always shows "updated today"
  const greetingPost = allPosts.find((post) => post.type === 'daily_greeting');
  const latest = greetingPost || recentPosts[0];
  const latestDate = latest?.updated_date || latest?.created_date || latest?.created_at || new Date().toISOString();
  const updatedText = latestDate
    ? (() => {
      const minutes = Math.max(1, Math.round((Date.now() - new Date(latestDate).getTime()) / 60000));
      if (minutes < 60) return `Updated ${minutes} min ago`;
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `Updated ${hours} hr${hours === 1 ? '' : 's'} ago`;
      const days = Math.round(hours / 24);
      if (days < 7) return `Updated ${days}d ago`;
      const weeks = Math.round(days / 7);
      return `Updated ${weeks}w ago`;
    })()
    : 'Ready for the first useful post';

  const actions = [
    {
      label: 'Ask neighbors',
      detail: 'Fast local answer',
      icon: MessageCircle,
      onClick: () => onCreate('feed', 'question', ''),
    },
    {
      label: 'Need help',
      detail: 'Meals, rides, favors',
      icon: Handshake,
      onClick: () => onCreate('help', 'chesed', ''),
    },
    {
      label: 'Plan something',
      detail: 'Event or meetup',
      icon: CalendarDays,
      onClick: () => onCreate('event', 'local_event', ''),
    },
    {
      label: 'Business update',
      detail: 'Useful, not spam',
      icon: Store,
      onClick: () => onCreate('marketplace', 'business_update', ''),
    },
    {
      label: 'Mitzvah',
      detail: 'Share or step up',
      icon: Sparkles,
      onClick: () => onCreate('help', 'mitzvah', ''),
    },
  ];

  const supportingLinks = [
    { label: 'Mitzvahs', icon: Handshake, onClick: onOpenMitzvah },
    { label: 'Map', icon: MapPin, onClick: onOpenMap },
    { label: 'Events', icon: CalendarDays, onClick: onOpenEvents },
    { label: 'Marketplace', icon: Store, onClick: onOpenMarketplace },
  ];

  return (
    <section className="mb-3 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.07)]">
      <div className="bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[18px] font-black leading-tight">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              Talk to the Five Towns
            </h2>
            <p className="mt-1 max-w-xl text-[12px] font-semibold leading-5 text-white/75">
              Questions, plans, rides, needs, and local updates.
            </p>
          </div>
          {activeThreads > 0 && (
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right">
              <p className="text-[16px] font-black leading-none">{activeThreads}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-white/60">active</p>
            </div>
          )}
        </div>
        {/* Never surface zero-counts — an empty stat line reads as "this app is dead". */}
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide text-white/65">
          {recentPosts.length > 0 && <span>{recentPosts.length} recent posts</span>}
          {recentPosts.length > 0 && needsToday > 0 && <span>•</span>}
          {needsToday > 0 && <span>{needsToday} needs today</span>}
          {(recentPosts.length > 0 || needsToday > 0) && <span>•</span>}
          <span>{recentPosts.length > 0 || needsToday > 0 ? updatedText : 'Be the first to post today'}</span>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="motion-press rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50"
              >
                <Icon className="h-4 w-4 text-blue-600" />
                <p className="mt-1.5 text-[13px] font-black text-slate-950">{action.label}</p>
                <p className="mt-0.5 text-[11px] font-bold text-slate-500">{action.detail}</p>
              </button>
            );
          })}
        </div>

        <div className="mobile-scroll-x flex gap-2 pb-1">
          {supportingLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className="motion-press inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700"
              >
                <Icon className="h-3.5 w-3.5 text-blue-600" />
                {link.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onCreate('feed', 'carpool', '')}
            className="motion-press inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700"
          >
            <Car className="h-3.5 w-3.5 text-blue-600" />
            Carpool
          </button>
        </div>
      </div>
    </section>
  );
}
