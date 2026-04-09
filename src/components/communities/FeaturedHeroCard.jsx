import React from 'react';
import { Zap, Users, Activity } from 'lucide-react';

export default function FeaturedHeroCard({ community, onOpen, onJoin, isJoined, isJoining }) {
  const accentColor = community.featured_accent_color || '#2563EB';
  const initials = community.name?.slice(0, 2).toUpperCase() || 'CO';

  return (
    <div
      onClick={() => onOpen(community.id)}
      className="w-full overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative"
      style={{
        borderRadius: '28px',
        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
        boxShadow: `0 0 40px ${accentColor}40, inset 0 1px 0 ${accentColor}80`,
      }}
    >
      {/* Gradient border glow */}
      <div
        className="absolute inset-0 rounded-[28px] pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accentColor}80, transparent)`,
          padding: '2px',
          borderRadius: '28px',
        }}
      />

      {/* Content wrapper */}
      <div
        className="relative z-10 rounded-[26px] p-8 space-y-5"
        style={{
          background: `linear-gradient(135deg, ${accentColor}ee 0%, ${accentColor}dd 100%)`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Featured badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
          <Zap className="w-4 h-4 text-white fill-white" />
          <span className="text-xs font-bold text-white">🔥 Featured</span>
        </div>

        {/* Main content */}
        <div className="flex items-center justify-between gap-8">
          {/* Left: Avatar + Info */}
          <div className="flex items-start gap-6 flex-1 min-w-0">
            {community.logo_url ? (
              <img
                src={community.logo_url}
                alt={community.name}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border-2 border-white/30"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border-2 border-white/30"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
                }}
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-3xl font-black text-white mb-2 leading-tight break-words hyphens-auto">
                {community.name}
              </h2>
              <p className="text-white/90 text-sm mb-4 line-clamp-2 font-medium leading-relaxed">
                {community.featured_tagline || community.description_short}
              </p>
              <div className="flex items-center gap-6 text-white">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-bold whitespace-nowrap">
                    {(community.follower_count || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-bold whitespace-nowrap">{community.posts_this_week || 0} posts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Join button */}
          <button
            onClick={e => { e.stopPropagation(); onJoin(community); }}
            disabled={isJoining}
            className="flex-shrink-0 rounded-full font-bold text-sm transition-all active:scale-95 disabled:opacity-60 px-6 py-2.5 border-2 border-white/40 backdrop-blur-sm hover:bg-white/20 duration-200 whitespace-nowrap"
            style={{
              background: isJoined ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)',
              color: '#FFFFFF',
            }}
          >
            {isJoining ? '...' : isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>

        {/* Description */}
        {community.description_long && (
          <p className="text-white/85 text-sm leading-relaxed line-clamp-2">
            {community.description_long}
          </p>
        )}
      </div>
    </div>
  );
}