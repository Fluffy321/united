import React from 'react';
import { ArrowRight, BadgeCheck, EyeOff, Flame, Lock, MapPin, MessageCircle, ShieldCheck, TrendingUp, Users, Zap } from 'lucide-react';
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

function ProfileBubbles({ count = 0, muted = false }) {
  const visible = Math.max(0, Math.min(count || 0, 4));
  if (!visible) return null;
  return (
    <div className="flex -space-x-2">
      {Array.from({ length: visible }, (_, index) => (
        <span
          key={index}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-black ${
            muted ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white'
          }`}
        >
          {String.fromCharCode(65 + ((index + count) % 20))}
        </span>
      ))}
    </div>
  );
}

export default function CommunityHubCard({ community, onOpen, onTryPrompt, onToggleJoin, loading = false }) {
  const typeConfig = getCommunityTypeConfig(community);
  const Icon = typeConfig.icon;
  const accent = typeConfig.accent;
  const description = community.description || typeConfig.cardFallback;
  const privacy = community.privacy || 'Public';
  const isSensitive = community.communityType === 'support' || typeConfig.key === 'chesed';
  const valueHook = community.valueHook || community.dailyPrompt || description;
  const activeNow = community.activeNow || 0;
  const friendsInCommunity = community.friendsInCommunity || 0;
  const typeLabel = community.communityType === 'official'
    ? 'Official'
    : community.communityType === 'support'
      ? 'Safe space'
      : community.communityType === 'lifestyle'
        ? 'Lifestyle'
        : 'Member-led';

  return (
    <div className="group overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* Gradient banner */}
      <div
        className={`relative h-20 bg-gradient-to-br ${accent}`}
        style={
          community.cover_url
            ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: typeConfig.coverPattern }
        }
      >
        {(community.verified || community.trending || activeNow > 20) && (
          <div className="absolute left-3 top-2.5 z-10 flex gap-1.5">
            {community.verified && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-white/95 px-2 text-[10px] font-black text-blue-700 shadow-sm">
                <BadgeCheck className="h-3 w-3" />
                Official
              </span>
            )}
            {community.trending && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-white/95 px-2 text-[10px] font-black text-emerald-700 shadow-sm">
                <TrendingUp className="h-3 w-3" />
                Trending
              </span>
            )}
            {activeNow > 20 && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-white/95 px-2 text-[10px] font-black text-rose-700 shadow-sm">
                <Flame className="h-3 w-3" />
                Most active
              </span>
            )}
          </div>
        )}
        {community.cover_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        )}
        {!community.cover_url && (
          <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="relative -mt-6 px-3.5 pb-3.5">
        {/* Avatar + join button */}
        <div className="flex items-end justify-between gap-2">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${accent} text-[13px] font-black text-white shadow-md ring-[2px] ring-white`}
          >
            {community.logo_url ? (
              <img src={community.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleJoin?.(isSensitive ? { incognito: true } : {});
            }}
            disabled={loading}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold transition-all active:scale-[0.97] disabled:opacity-60 ${
              community.joined
                ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                : `bg-gradient-to-br ${accent} text-white shadow-sm hover:opacity-90`
            }`}
          >
            {loading ? '…' : community.joined ? 'Open' : isSensitive ? 'Join Private' : 'Join'}
          </button>
        </div>

        {/* Name + meta + description */}
        <div onClick={onOpen} className="mt-2.5 w-full cursor-pointer text-left">
          <h3 className="text-[15px] font-bold leading-tight text-slate-950">{community.name}</h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${typeConfig.badgeClass}`}>
              <Icon className="h-3 w-3" />
              {typeConfig.label}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{typeLabel}</span>
            {(community.memberCount || community.follower_count) > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Users className="h-3 w-3" />
                {(community.memberCount || community.follower_count).toLocaleString()}
              </span>
            )}
            {community.location && (
              <span className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                {community.location}
              </span>
            )}
          </div>

          <p className="mt-2 line-clamp-2 text-[13px] font-black leading-relaxed text-slate-900">
            {valueHook}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2">
              <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                <MessageCircle className="h-3 w-3" />
                Activity
              </p>
              <p className="mt-0.5 text-[12px] font-black text-slate-800">
                {community.postsToday || 0} posts today
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2">
              <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-emerald-600">
                <Zap className="h-3 w-3" />
                Live now
              </p>
              <p className="mt-0.5 text-[12px] font-black text-emerald-800">
                {activeNow} active now
              </p>
            </div>
          </div>

          {community.dailyPrompt && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTryPrompt?.(community.dailyPrompt);
              }}
              className={`motion-press mt-2 w-full rounded-xl border px-2.5 py-1.5 text-left transition hover:brightness-[0.98] ${typeConfig.softClass}`}
            >
              <p className="text-[10px] font-black uppercase tracking-wide opacity-80">Try this</p>
              <p className="mt-0.5 line-clamp-1 text-[11px] font-bold leading-4 text-slate-800">{community.dailyPrompt}</p>
            </button>
          )}

          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2">
            <div className="flex items-center gap-2">
              <ProfileBubbles count={friendsInCommunity || activeNow} muted={isSensitive} />
              <span className="text-[11px] font-black text-slate-600">
                {isSensitive
                  ? 'Anonymous-safe space'
                  : friendsInCommunity > 0
                    ? `${friendsInCommunity} friends in this community`
                    : community.socialProof || 'Trending in Five Towns'}
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {([...(typeConfig.descriptors || []), ...(community.identityTags || [])]).slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{tag}</span>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1">
              {isSensitive ? <EyeOff className="h-3 w-3" /> : privacy === 'Public' ? <ShieldCheck className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {privacy}
            </span>
            {community.postsToday > 0 && <span>{community.postsToday} posts today</span>}
            {community.growth && community.growth !== '+ active' && <span>{community.growth}</span>}
            <span className="inline-flex items-center gap-1">
              {community.joined ? 'Open' : typeConfig.primaryCta}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
