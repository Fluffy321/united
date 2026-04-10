import React from 'react';

export default function FeaturedHeroCard({ community, onOpen, onJoin, isJoined, isJoining }) {
  const initials = community.name?.slice(0, 2).toUpperCase() || 'CO';

  return (
    <div
      onClick={() => onOpen(community.id)}
      className="mb-4 rounded-[28px] overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white shadow-lg cursor-pointer"
    >
      <div className="p-5">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
          <span>⚡</span>
          <span>🔥 Featured</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {community.logo_url ? (
              <img
                src={community.logo_url}
                alt={community.name}
                className="h-20 w-20 shrink-0 rounded-3xl object-cover border border-white/20"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-2xl font-bold">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-3xl font-bold leading-tight">{community.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-white/85">
                {community.featured_tagline || community.description_short || 'Featured community'}
              </p>
              <div className="mt-3 flex items-center gap-5 text-sm text-white/80">
                <span>👥 {(community.follower_count || 0).toLocaleString()}</span>
                <span>📈 {community.posts_this_week || 0} posts</span>
              </div>
            </div>
          </div>

          <button
            onClick={e => { e.stopPropagation(); onJoin(community); }}
            disabled={isJoining}
            className="shrink-0 rounded-full border border-white/25 bg-white/15 px-5 py-2.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-60"
          >
            {isJoining ? '...' : isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}