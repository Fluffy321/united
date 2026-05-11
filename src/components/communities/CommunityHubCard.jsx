import React from 'react';
import { BadgeCheck, EyeOff, Lock, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react';

const categoryAccent = {
  Official:      'from-blue-600 to-indigo-600',
  Local:         'from-sky-500 to-blue-600',
  Support:       'from-violet-600 to-fuchsia-600',
  Shuls:         'from-violet-500 to-indigo-500',
  Chesed:        'from-emerald-500 to-teal-500',
  Learning:      'from-amber-400 to-orange-500',
  Events:        'from-rose-500 to-pink-500',
  Singles:       'from-fuchsia-500 to-violet-500',
  Parents:       'from-orange-400 to-amber-500',
  Neighborhoods: 'from-cyan-500 to-blue-500',
  Hobbies:       'from-lime-500 to-emerald-500',
  Lifestyle:     'from-teal-500 to-cyan-500',
  Sports:        'from-emerald-500 to-lime-500',
  Creative:      'from-fuchsia-500 to-rose-500',
  Business:      'from-slate-800 to-blue-700',
  Values:        'from-indigo-500 to-blue-500',
  'Buy/Sell':    'from-stone-500 to-slate-700',
};

const categoryStyles = {
  Official:      'bg-blue-50 text-blue-700 border-blue-100',
  Local:         'bg-sky-50 text-sky-700 border-sky-100',
  Support:       'bg-violet-50 text-violet-700 border-violet-100',
  Shuls:         'bg-violet-50 text-violet-700 border-violet-100',
  Chesed:        'bg-emerald-50 text-emerald-700 border-emerald-100',
  Learning:      'bg-amber-50 text-amber-700 border-amber-100',
  Events:        'bg-rose-50 text-rose-700 border-rose-100',
  Singles:       'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  Parents:       'bg-orange-50 text-orange-700 border-orange-100',
  Neighborhoods: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  Hobbies:       'bg-lime-50 text-lime-700 border-lime-100',
  Lifestyle:     'bg-teal-50 text-teal-700 border-teal-100',
  Sports:        'bg-emerald-50 text-emerald-700 border-emerald-100',
  Creative:      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  Business:      'bg-slate-100 text-slate-700 border-slate-200',
  Values:        'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Buy/Sell':    'bg-stone-50 text-stone-700 border-stone-100',
};

// Geometric CSS-only pattern per category — overlaid on the gradient header
const HEADER_PATTERNS = {
  Official:      { img: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 12px)', size: 'auto' },
  Local:         { img: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 16px)', size: 'auto' },
  Support:       { img: 'radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)', size: '18px 18px' },
  Shuls:         { img: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 12px)', size: 'auto' },
  Chesed:        { img: 'radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)', size: '20px 20px' },
  Learning:      { img: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 1px, transparent 1px, transparent 14px)', size: 'auto' },
  Events:        { img: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 12px)', size: 'auto' },
  Singles:       { img: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 1px, transparent 1px, transparent 20px)', size: 'auto' },
  Parents:       { img: 'radial-gradient(circle, rgba(255,255,255,0.16) 2px, transparent 2px)', size: '18px 18px' },
  Neighborhoods: { img: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 18px)', size: 'auto' },
  Hobbies:       { img: 'repeating-linear-gradient(30deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 14px)', size: 'auto' },
  Lifestyle:     { img: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 18px)', size: 'auto' },
  Sports:        { img: 'repeating-linear-gradient(-30deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 12px)', size: 'auto' },
  Creative:      { img: 'radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)', size: '17px 17px' },
  Business:      { img: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 14px)', size: 'auto' },
  Values:        { img: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 10px)', size: 'auto' },
  'Buy/Sell':    { img: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 12px)', size: 'auto' },
};

function initials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function authorInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function CommunityHubCard({ community, onOpen, onToggleJoin, featured = false }) {
  const latestPost = community.posts?.[0];
  const isPrivate = community.privacy?.includes('Private') || community.privacy?.includes('Anonymous');
  const accent = categoryAccent[community.category] || 'from-blue-500 to-slate-700';
  const pattern = HEADER_PATTERNS[community.category] || { img: 'none', size: 'auto' };
  const typeLabel = community.communityType === 'official'
    ? 'Official'
    : community.communityType === 'support'
      ? 'Safe space'
      : community.communityType === 'lifestyle'
        ? 'Lifestyle'
        : 'Member-led';

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 ${
        featured ? 'min-h-[360px]' : 'min-h-[340px]'
      }`}
    >
      {/* ── Pattern / Cover header ── */}
      <div
        className={`relative h-[88px] shrink-0 bg-gradient-to-br ${accent}`}
        style={
          community.cover_url
            ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { backgroundImage: pattern.img, backgroundSize: pattern.size }
        }
      >
        {/* Darkening overlay for cover photos so text + avatar remain legible */}
        {community.cover_url && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />}

        {featured && (
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Featured
          </div>
        )}

        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          {community.verified && (
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-white/95 px-2 text-[10px] font-black text-blue-700 shadow-sm">
              <BadgeCheck className="h-3 w-3" />
              Official
            </span>
          )}
          {community.trending && (
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-white/95 px-2 text-[10px] font-black text-emerald-700 shadow-sm">
              <TrendingUp className="h-3 w-3" />
              Hot
            </span>
          )}
        </div>

        {/* Initials avatar — overlaps the header's bottom edge into the card body */}
        <div
          className={`absolute -bottom-5 left-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-[13px] font-black text-white shadow-md ring-2 ring-white`}
        >
          {initials(community.name)}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-8">
        <button onClick={onOpen} className="flex flex-1 flex-col text-left">

          {/* Name + location + category chip */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[15px] font-bold leading-5 text-slate-950">{community.name}</h3>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{community.location}</p>
            </div>
            <span
              className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                categoryStyles[community.category] || 'bg-slate-50 text-slate-700 border-slate-100'
              }`}
            >
              {typeLabel}
            </span>
          </div>

          {/* Description — 2 lines */}
          <p className="mt-2.5 line-clamp-2 text-[13px] leading-5 text-slate-600">{community.description}</p>

          {community.dailyPrompt && (
            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">Today’s prompt</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] font-bold leading-4 text-slate-800">{community.dailyPrompt}</p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(community.identityTags || []).slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">
                {tag}
              </span>
            ))}
          </div>

          {/* Latest post preview — avatar · author · one-line snippet */}
          {latestPost && (
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-[9px] font-black text-white`}
              >
                {authorInitials(latestPost.author)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-800">{latestPost.author}</span>
                <span className="text-[11px] text-slate-400"> · </span>
                <span className="line-clamp-1 text-[11px] text-slate-500">{latestPost.body || latestPost.title}</span>
              </div>
            </div>
          )}
        </button>

        {/* Stats — muted, bottom-left */}
        <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {community.memberCount.toLocaleString()} members
          </span>
          <span className="inline-flex items-center gap-1">
            {community.supportsIncognito ? <EyeOff className="h-3 w-3" /> : isPrivate ? <Lock className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            {community.privacyLabel || community.privacy}
          </span>
        </div>
        {community.recommendationReason && (
          <p className="mt-2 line-clamp-1 text-[11px] font-bold text-blue-600">{community.recommendationReason}</p>
        )}

        {/* CTAs — View transitions from outline → solid fill on hover */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={onOpen}
            className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 transition-all duration-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700 hover:border-blue-600 hover:bg-blue-600 hover:text-white active:scale-[0.98]"
          >
            View
          </button>
          <button
            onClick={() => onToggleJoin(community.supportsIncognito ? { incognito: true } : {})}
            className={`h-10 flex-1 rounded-xl text-sm font-bold transition-all duration-150 active:scale-[0.98] ${
              community.joined
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {community.joined ? 'Leave' : community.supportsIncognito ? 'Join Private' : 'Join'}
          </button>
        </div>
      </div>
    </article>
  );
}
