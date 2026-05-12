import React from 'react';
import { ArrowRight, BadgeCheck, EyeOff, Lock, MapPin, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { COMMUNITY_TYPE_CONFIG, getCommunityTypeConfig } from '@/lib/communityTypes';

export const categoryAccent = Object.fromEntries(
  Object.values(COMMUNITY_TYPE_CONFIG).map((config) => [config.label, config.accent])
);

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function CommunityHubCard({ community, onOpen, onToggleJoin, loading = false }) {
  const typeConfig = getCommunityTypeConfig(community);
  const Icon = typeConfig.icon;
  const accent = typeConfig.accent;
  const description = community.description || typeConfig.cardFallback;
  const privacy = community.privacy || 'Public';
  const isSensitive = community.communityType === 'support' || typeConfig.key === 'chesed';
  const typeLabel = community.communityType === 'official'
    ? 'Official'
    : community.communityType === 'support'
      ? 'Safe space'
      : community.communityType === 'lifestyle'
        ? 'Lifestyle'
        : 'Member-led';

  return (
    <div className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* Gradient banner */}
      <div
        className={`relative h-24 bg-gradient-to-br ${accent}`}
        style={
          community.cover_url
            ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: typeConfig.coverPattern }
        }
      >
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
              Trending
            </span>
          )}
        </div>
        {community.cover_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        )}
        {!community.cover_url && (
          <div className="absolute inset-0">
            <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
              <Icon className="h-6 w-6" />
            </div>
            <div className="absolute bottom-3 left-3 right-16 line-clamp-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black leading-4 text-white ring-1 ring-white/20">
              {typeConfig.tagline}
            </div>
          </div>
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
              <div className="flex flex-col items-center leading-none">
                <Icon className="mb-1 h-5 w-5" />
                <span className="text-[11px]">{initials(community.name) || typeConfig.emoji}</span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleJoin?.(isSensitive ? { incognito: true } : {});
            }}
            disabled={loading}
            className={`shrink-0 rounded-full px-5 py-2 text-[13px] font-bold transition-all active:scale-[0.97] disabled:opacity-60 ${
              community.joined
                ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                : `bg-gradient-to-br ${accent} text-white shadow-sm hover:opacity-90`
            }`}
          >
            {loading ? '…' : community.joined ? 'Open' : isSensitive ? 'Join Private' : 'Join'}
          </button>
        </div>

        {/* Name + meta + description — full area clickable */}
        <button onClick={onOpen} className="mt-3 w-full text-left">
          <h3 className="text-[16px] font-bold leading-tight text-slate-950">{community.name}</h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${typeConfig.badgeClass}`}>
              <Icon className="h-3 w-3" />
              {typeConfig.label}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{typeLabel}</span>
            {(community.memberCount || community.follower_count) > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-slate-400">
                <Users className="h-3 w-3" />
                {(community.memberCount || community.follower_count).toLocaleString()} members
              </span>
            )}
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

          {community.dailyPrompt && (
            <div className={`mt-3 rounded-2xl border px-3 py-2 ${typeConfig.softClass}`}>
              <p className="text-[10px] font-black uppercase tracking-wide opacity-80">Try this</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] font-bold leading-4 text-slate-800">{community.dailyPrompt}</p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {([...(typeConfig.descriptors || []), ...(community.identityTags || [])]).slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{tag}</span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[11px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1">
              {isSensitive ? <EyeOff className="h-3 w-3" /> : privacy === 'Public' ? <ShieldCheck className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {privacy}
            </span>
            {community.postsToday > 0 && <span>{community.postsToday} posts today</span>}
            {community.growth && community.growth !== '+ active' && <span>{community.growth}</span>}
            <span className="inline-flex items-center gap-1">
              {community.joined ? 'Open community' : typeConfig.primaryCta}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
