import React from 'react';
import { MapPin, Users } from 'lucide-react';

export const categoryAccent = {
  Shuls:         'from-violet-500 to-indigo-500',
  Chesed:        'from-emerald-500 to-teal-500',
  Learning:      'from-amber-400 to-orange-500',
  Events:        'from-rose-500 to-pink-500',
  Singles:       'from-fuchsia-500 to-violet-500',
  Parents:       'from-orange-400 to-amber-500',
  Neighborhoods: 'from-cyan-500 to-blue-500',
  Hobbies:       'from-lime-500 to-emerald-500',
  Lifestyle:     'from-teal-500 to-cyan-500',
  Values:        'from-indigo-500 to-blue-500',
  'Buy/Sell':    'from-stone-500 to-slate-700',
};

const categoryStyles = {
  Shuls:         'bg-violet-50 text-violet-700',
  Chesed:        'bg-emerald-50 text-emerald-700',
  Learning:      'bg-amber-50 text-amber-700',
  Events:        'bg-rose-50 text-rose-700',
  Singles:       'bg-fuchsia-50 text-fuchsia-700',
  Parents:       'bg-orange-50 text-orange-700',
  Neighborhoods: 'bg-cyan-50 text-cyan-700',
  Hobbies:       'bg-lime-50 text-lime-700',
  Lifestyle:     'bg-teal-50 text-teal-700',
  Values:        'bg-indigo-50 text-indigo-700',
  'Buy/Sell':    'bg-stone-50 text-stone-700',
};

const DEFAULT_DESCRIPTIONS = {
  Shuls:         'A shul community for minyanim, shiurim, and neighborhood announcements.',
  Chesed:        'A chesed circle for coordinating help, meals, rides, and community support.',
  Learning:      'A daily learning group for Torah discussions, Daf, and study.',
  Events:        'A community board for simchas, events, and local announcements.',
  Singles:       'A moderated space for singles events and social opportunities.',
  Parents:       'A parent group for carpools, playdates, and local family tips.',
  Neighborhoods: 'A neighborhood board for local updates and community news.',
  Hobbies:       'A hobby and activity group for local recreation.',
  Lifestyle:     'A lifestyle community for Shabbos, hosting, and local connections.',
  Values:        'A thoughtful discussion group for Jewish family values and home life.',
  'Buy/Sell':    'A community marketplace for items, gemach, and local trades.',
};

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function CommunityHubCard({ community, onOpen, onToggleJoin, loading = false }) {
  const accent = categoryAccent[community.category] || 'from-blue-500 to-slate-700';
  const description = community.description || DEFAULT_DESCRIPTIONS[community.category] || 'A local Jewish community group.';

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      {/* Gradient banner */}
      <div
        className={`relative h-24 bg-gradient-to-br ${accent}`}
        style={
          community.cover_url
            ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        {community.cover_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        )}
        {!community.cover_url && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_65%)]" />
        )}
      </div>

      {/* Card body — relative ensures it paints on top of the positioned banner */}
      <div className="relative -mt-8 px-4 pb-4">
        {/* Avatar + join button */}
        <div className="flex items-end justify-between gap-3">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${accent} text-[17px] font-black text-white shadow-lg ring-[3px] ring-white`}
          >
            {community.logo_url ? (
              <img src={community.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(community.name)
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleJoin();
            }}
            disabled={loading}
            className={`shrink-0 rounded-full px-5 py-2 text-[13px] font-bold transition-all active:scale-[0.97] disabled:opacity-60 ${
              community.joined
                ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                : `bg-gradient-to-br ${accent} text-white shadow-sm hover:opacity-90`
            }`}
          >
            {loading ? '…' : community.joined ? 'Joined' : 'Join'}
          </button>
        </div>

        {/* Name + meta + description — full area clickable */}
        <button onClick={onOpen} className="mt-3 w-full text-left">
          <h3 className="text-[16px] font-bold leading-tight text-slate-950">{community.name}</h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {community.category && community.category !== 'General' && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${categoryStyles[community.category] || 'bg-slate-100 text-slate-600'}`}>
                {community.category}
              </span>
            )}
            <span className="flex items-center gap-1 text-[12px] text-slate-400">
              <Users className="h-3 w-3" />
              {(community.memberCount || 0).toLocaleString()} members
            </span>
            {community.location && (
              <span className="flex items-center gap-1 truncate text-[12px] text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                {community.location}
              </span>
            )}
          </div>

          <p className={`mt-2.5 line-clamp-3 text-[13px] leading-relaxed ${
            community.description ? 'text-slate-600' : 'italic text-slate-400'
          }`}>
            {description}
          </p>
        </button>
      </div>
    </div>
  );
}
