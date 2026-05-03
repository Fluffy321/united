import React from 'react';
import { CalendarDays, Lock, MessageSquare, Radio, ShieldCheck, Sparkles, Users } from 'lucide-react';

const categoryStyles = {
  Shuls: 'bg-violet-50 text-violet-700 border-violet-100',
  Schools: 'bg-sky-50 text-sky-700 border-sky-100',
  Chesed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Learning: 'bg-amber-50 text-amber-700 border-amber-100',
  Events: 'bg-rose-50 text-rose-700 border-rose-100',
  Singles: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  Parents: 'bg-orange-50 text-orange-700 border-orange-100',
  Neighborhoods: 'bg-cyan-50 text-cyan-700 border-cyan-100',
};

const categoryAccent = {
  Shuls: 'from-violet-500 to-indigo-500',
  Schools: 'from-sky-500 to-blue-500',
  Chesed: 'from-emerald-500 to-teal-500',
  Learning: 'from-amber-400 to-orange-500',
  Events: 'from-rose-500 to-pink-500',
  Singles: 'from-fuchsia-500 to-violet-500',
  Parents: 'from-orange-400 to-amber-500',
  Neighborhoods: 'from-cyan-500 to-blue-500',
};

function initials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function CommunityHubCard({ community, onOpen, onToggleJoin, featured = false }) {
  const latestPost = community.posts?.[0];
  const isPrivate = community.privacy === 'Private';
  const accent = categoryAccent[community.category] || 'from-blue-500 to-slate-700';

  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg ${featured ? 'min-h-[320px]' : 'min-h-[300px]'}`}>
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
      {featured && (
        <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Featured
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
      <button onClick={onOpen} className="flex flex-1 flex-col text-left">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-sm font-black text-white shadow-sm`}>
              {initials(community.name)}
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-bold leading-5 text-slate-950">{community.name}</h3>
              <p className="mt-1 truncate text-xs font-medium text-slate-500">{community.location}</p>
            </div>
          </div>

          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${categoryStyles[community.category]}`}>
            {community.category}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-slate-600">{community.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Users className="h-3.5 w-3.5" />
              {community.memberCount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">members</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {community.privacy}
            </div>
            <p className="text-[11px] text-slate-400">privacy</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-500">
          <div className="mb-1 flex items-center gap-1.5 font-bold text-slate-700">
            <Radio className="h-3.5 w-3.5 text-blue-600" />
            Recent activity
          </div>
          <p className="line-clamp-1">{community.recentActivity}</p>
        </div>

        {latestPost && (
          <div className="mt-3 rounded-xl bg-blue-50/70 px-3 py-2 text-xs text-slate-600">
            <div className="mb-1 flex items-center gap-1.5 font-bold text-blue-800">
              <MessageSquare className="h-3.5 w-3.5" />
              Latest post
            </div>
            <p className="line-clamp-1">{latestPost.title}</p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
            <MessageSquare className="h-3 w-3" />
            {community.posts.length} posts
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
            <CalendarDays className="h-3 w-3" />
            {community.events.length} events
          </span>
        </div>
      </button>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onOpen}
          className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
        >
          View
        </button>
        <button
          onClick={onToggleJoin}
          className={`h-10 flex-1 rounded-xl text-sm font-bold transition active:scale-[0.98] ${
            community.joined
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {community.joined ? 'Leave' : 'Join'}
        </button>
      </div>
      </div>
    </article>
  );
}
