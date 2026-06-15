import React from 'react';
import { COMMUNITY_TYPE_CONFIG } from '@/lib/communityTypes';

const COMPOSER_PROMPTS_BY_MODE = {
  message:  'Share a quick update or question...',
  post:     'Write a post for your community...',
  chesed:   'Request help · Offer help · Share a need',
  official: 'Post an official announcement...',
};

const HOME_EMPHASIS_LABELS = {
  feed:          '💬 Feed-first home',
  announcements: '📣 Announcements at the top',
  events:        '📅 Events-forward',
  resources:     '📎 Resources-forward',
  chesed:        '🤝 Action-forward',
};

const TAB_LABELS = {
  home: 'Home', posts: 'Posts', events: 'Events', members: 'Members',
  openNeeds: 'Needs', questions: 'Q&A', discussions: 'Topics',
  resources: 'Resources', about: 'About', listings: 'Listings',
  announcements: 'Announce', chat: 'Chat',
};

export default function CommunityLivePreview({ form, step, coverUrl, premiumPreview = { enabled: false, layout: {} } }) {
  const typeConfig = form.archetype ? COMMUNITY_TYPE_CONFIG[form.archetype] : null;
  const name = form.name || 'Your Community';
  const hasType = Boolean(typeConfig);
  const coverBg = typeConfig?.coverPattern || 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)';

  const isPremiumActive = premiumPreview.enabled;
  const pLayout = premiumPreview.layout || {};

  // When premium preview is active, override tabs and composer from the premium selections.
  const primaryTabs = (isPremiumActive && pLayout.primaryTabs?.length)
    ? pLayout.primaryTabs
    : (typeConfig?.primaryTabs || []);

  const effectiveComposerPrompt = (isPremiumActive && pLayout.composerMode)
    ? (COMPOSER_PROMPTS_BY_MODE[pLayout.composerMode] || typeConfig?.prompts?.[0] || 'Share something...')
    : (typeConfig?.prompts?.[0] || 'Share something...');

  const showEmphasisIndicator = isPremiumActive
    && pLayout.homeEmphasis
    && pLayout.homeEmphasis !== 'feed';

  const showDescription = Boolean(form.description?.trim().length > 5 && step >= 2);
  const showPrivacy = step >= 3;
  const showFirstPost = step >= 4 && Boolean(form.firstContent?.trim());

  return (
    <div className="flex flex-col items-center">
      {/* Phone shell */}
      <div
        className="relative flex flex-col overflow-hidden bg-white"
        style={{
          width: 248,
          minHeight: 460,
          maxHeight: 500,
          borderRadius: 22,
          border: '1.5px solid rgba(0,0,0,0.14)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        {/* Decorative status bar */}
        <div
          className="absolute left-0 right-0 top-0 z-20 flex justify-between px-5 pt-1.5"
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-[8px] font-black text-white/70 drop-shadow">9:41</span>
          <span className="text-[7px] font-black text-white/60 drop-shadow">●●●</span>
        </div>

        {/* Premium preview badge — top-right corner of phone */}
        {isPremiumActive && (
          <div className="absolute right-2 top-2 z-30 flex items-center gap-0.5 rounded-md bg-violet-600 px-1.5 py-0.5" style={{ pointerEvents: 'none' }}>
            <span className="text-[7px] font-black text-white">✦</span>
            <span className="text-[7px] font-black text-white">Premium</span>
          </div>
        )}

        {/* Cover */}
        <div className="relative flex-shrink-0" style={{ height: 92 }}>
          {coverUrl ? (
            <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: coverBg, transition: 'background 0.35s ease' }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 z-10">
            <p className="font-extrabold leading-tight text-white drop-shadow" style={{ fontSize: 13 }}>
              {name}
            </p>
            <p className="mt-0.5 leading-none text-white/65" style={{ fontSize: 9 }}>
              {typeConfig ? typeConfig.label : 'Community type'}
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-shrink-0 items-center gap-1.5 border-b border-slate-100 bg-white px-2.5 py-1.5">
          <div
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md font-black text-white bg-gradient-to-br ${typeConfig?.accent || 'from-slate-400 to-slate-500'}`}
            style={{ fontSize: 7 }}
          >
            {name[0]?.toUpperCase() || 'C'}
          </div>
          <span className="flex-1 truncate text-slate-400" style={{ fontSize: 8 }}>
            {typeConfig?.tagline || 'Your community on JUnited'}
          </span>
          <span
            className={`flex-shrink-0 rounded-full px-1.5 py-0.5 font-black ${typeConfig?.badgeClass || 'bg-blue-50 text-blue-700'}`}
            style={{ fontSize: 7 }}
          >
            Join
          </span>
        </div>

        {/* Nav tabs */}
        {hasType && (
          <div className="flex flex-shrink-0 gap-0.5 overflow-x-hidden border-b border-slate-100 bg-white px-2 py-1">
            {primaryTabs.slice(0, 4).map((tab, i) => (
              <span
                key={tab}
                className={`flex-shrink-0 rounded px-1.5 py-0.5 font-black uppercase tracking-wide ${
                  i === 0
                    ? (typeConfig?.badgeClass || 'bg-blue-50 text-blue-700')
                    : 'text-slate-400'
                }`}
                style={{ fontSize: 7 }}
              >
                {TAB_LABELS[tab] || tab}
              </span>
            ))}
            {primaryTabs.length > 0 && (
              <span className="flex-shrink-0 px-1 py-0.5 font-black text-slate-300" style={{ fontSize: 7 }}>
                More
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1.5 overflow-hidden bg-[#F8FAFB] px-2 py-2">

          {!hasType && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
              <div className="text-3xl opacity-20">🏠</div>
              <p className="text-[9px] font-bold leading-snug text-slate-400">
                Choose a community type to see your preview come to life
              </p>
            </div>
          )}

          {/* Description */}
          {showDescription && (
            <div className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
              <p className="mb-0.5 font-black text-slate-500" style={{ fontSize: 7 }}>About</p>
              <p className="leading-tight text-slate-700 line-clamp-2" style={{ fontSize: 8 }}>
                {form.description}
              </p>
            </div>
          )}

          {/* Privacy + posting mode */}
          {showPrivacy && (
            <div className="flex flex-shrink-0 flex-wrap gap-1">
              <span className="rounded-full border border-slate-200 bg-white px-1.5 py-0.5 font-bold text-slate-500" style={{ fontSize: 7 }}>
                {form.privacy === 'Private' ? '🔒' : form.privacy === 'Community-only' ? '🏘️' : '🌍'}{' '}
                {form.privacy}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-1.5 py-0.5 font-bold text-slate-500" style={{ fontSize: 7 }}>
                {form.postingMode === 'admin' ? '🔐 Admins post' : '👥 Open posting'}
              </span>
            </div>
          )}

          {/* Home emphasis indicator (premium) */}
          {showEmphasisIndicator && (
            <div className="flex-shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5">
              <p className="font-black text-violet-700 leading-tight" style={{ fontSize: 7 }}>
                {HOME_EMPHASIS_LABELS[pLayout.homeEmphasis] || 'Custom section'}
              </p>
              <p className="text-violet-500 leading-tight" style={{ fontSize: 7 }}>
                Promoted to top of home
              </p>
            </div>
          )}

          {/* Composer */}
          {hasType && (
            <div className={`flex-shrink-0 rounded-lg border px-2 py-1.5 ${isPremiumActive ? 'border-violet-100 bg-white' : 'border-slate-100 bg-white'}`}>
              <p className="leading-tight text-slate-400" style={{ fontSize: 8 }}>
                {effectiveComposerPrompt}
              </p>
            </div>
          )}

          {/* First post draft */}
          {showFirstPost && (
            <div className="flex-shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5">
              <p className="mb-0.5 font-black text-blue-600" style={{ fontSize: 7 }}>First post</p>
              <p className="leading-tight text-blue-800 line-clamp-3" style={{ fontSize: 8 }}>
                {form.firstContent}
              </p>
            </div>
          )}

          {hasType && !showFirstPost && (
            <div className="flex flex-col gap-1 overflow-hidden">
              <div className="flex-shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5">
                <p className="font-black text-blue-700" style={{ fontSize: 7 }}>Chat opens first</p>
                <p className="mt-0.5 leading-tight text-blue-900" style={{ fontSize: 8 }}>
                  {name} will start empty, with the message box ready for your first real note.
                </p>
              </div>
              <div className="flex-shrink-0 rounded-lg border border-slate-100 bg-white px-2 py-2 text-center">
                <p className="font-black text-slate-500" style={{ fontSize: 8 }}>No messages yet</p>
                <p className="mt-0.5 leading-tight text-slate-400" style={{ fontSize: 7 }}>
                  Be the first to start the conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step caption */}
      <p className={`mt-3 max-w-[220px] text-center text-[10px] font-semibold leading-snug ${isPremiumActive ? 'text-violet-300/80' : 'text-white/45'}`}>
        {isPremiumActive
          ? '✦ Premium Preview · Upgrade to publish this layout'
          : 'Preview only. Real messages appear after members post.'}
      </p>
    </div>
  );
}
