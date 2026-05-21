import React from 'react';
import { Check, Lock, Users } from 'lucide-react';
import { getCommunityTypeConfig } from '@/lib/communityTypes';

// Map tab keys to human-readable "what's inside" labels
const TAB_LABELS = {
  posts: 'Posts',
  events: 'Events',
  resources: 'Resources',
  discussions: 'Discussions',
  openNeeds: 'Open Needs',
  questions: 'Q&A',
  listings: 'Listings',
  chat: 'Group Chat',
  announcements: 'Announcements',
  about: 'About',
};

export default function DiscoverCommunityCard({ community, onOpen, onToggleJoin, loading }) {
  const typeConfig = getCommunityTypeConfig(community);
  const TypeIcon = typeConfig.icon;

  const memberCount = community.follower_count || community.memberCount || 0;
  const description = community.description || community.valueHook || typeConfig.cardFallback;
  const isSensitive = typeConfig.key === 'chesed' || community.communityType === 'support';
  const isPrivate = community.privacy && community.privacy !== 'Public';

  // "What's inside" — primary tabs minus home and members, up to 3
  const features = (typeConfig.primaryTabs || [])
    .filter((t) => t !== 'home' && t !== 'members')
    .map((t) => TAB_LABELS[t])
    .filter(Boolean)
    .slice(0, 3);

  // Activity signal — prefer postsToday, fall back to post_count
  const activitySignal =
    community.postsToday > 0
      ? `${community.postsToday} posts today`
      : community.post_count > 0
      ? `${community.post_count}+ posts`
      : null;

  const brandingSettings = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.branding || {})
    : {};
  const COVER_STYLE_GRADIENTS = {
    midnight: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
    sunrise:  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    forest:   'linear-gradient(135deg, #065f46 0%, #34d399 100%)',
    twilight: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #db2777 100%)',
  };
  const effectiveAccent = brandingSettings.accentColor || community.featured_accent_color;
  const coverStyle = community.cover_url
    ? { backgroundImage: `url(${community.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : effectiveAccent
      ? { background: `linear-gradient(135deg, ${effectiveAccent}CC 0%, ${effectiveAccent}88 100%)` }
      : (brandingSettings.coverStyle && brandingSettings.coverStyle !== 'default' && COVER_STYLE_GRADIENTS[brandingSettings.coverStyle])
        ? { background: COVER_STYLE_GRADIENTS[brandingSettings.coverStyle] }
        : { background: typeConfig.coverPattern };

  const handleJoin = (e) => {
    e.stopPropagation();
    onToggleJoin?.(isSensitive ? { incognito: true } : {});
  };

  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[0.99]"
    >
      {/* Banner */}
      <div className="relative h-[92px]" style={coverStyle}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Type chip — bottom-left */}
        <div className="absolute bottom-2 left-2.5 z-10">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black backdrop-blur-sm ${typeConfig.badgeClass} bg-white/80`}>
            <TypeIcon className="h-2.5 w-2.5" />
            {typeConfig.label}
          </span>
        </div>

        {/* Privacy badge — bottom-right (only if not Public) */}
        {isPrivate && (
          <div className="absolute bottom-2 right-2.5 z-10">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-black/35 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              <Lock className="h-2.5 w-2.5" />
              {community.privacy === 'Private' ? 'Private' : 'Members only'}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="px-3 pt-2.5 pb-3 space-y-2">
        {/* Name + join button row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-black leading-snug text-slate-950">{community.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <Users className="h-3 w-3 shrink-0" />
              {memberCount > 0 ? `${memberCount.toLocaleString()} members` : 'New space'}
            </p>
          </div>
          <button
            onClick={handleJoin}
            disabled={loading}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all disabled:opacity-60 active:scale-[0.97] ${
              community.joined
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : effectiveAccent
                  ? 'text-white shadow-sm hover:opacity-90'
                  : `bg-gradient-to-br ${typeConfig.accent} text-white shadow-sm hover:opacity-90`
            }`}
            style={!community.joined && effectiveAccent ? { background: effectiveAccent } : undefined}
          >
            {loading ? (
              '…'
            ) : community.joined ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Joined</span>
            ) : isSensitive ? (
              'Join private'
            ) : (
              'Join'
            )}
          </button>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-[12px] font-semibold leading-relaxed text-slate-600">
          {description}
        </p>

        {/* "What's inside" feature pills */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {features.map((f) => (
              <span
                key={f}
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${typeConfig.softClass}`}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Activity signal */}
        {activitySignal && (
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            {activitySignal}
          </p>
        )}
      </div>
    </div>
  );
}
