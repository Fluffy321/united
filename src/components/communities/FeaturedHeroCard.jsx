import React from 'react';
import { Star, Users, TrendingUp } from 'lucide-react';

export default function FeaturedHeroCard({ community, onOpen, onJoin, isJoined, isJoining }) {
  const accentColor = community.featured_accent_color || '#2563EB';
  const initials = community.name?.slice(0, 2).toUpperCase() || 'CO';

  return (
    <div
      onClick={() => onOpen(community.id)}
      className="w-full rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      style={{
        background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
        border: `2px solid ${accentColor}30`,
      }}
    >
      {/* Featured badge */}
      <div className="flex items-center justify-center gap-1.5 py-2 px-4 text-sm font-bold text-white"
        style={{background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`}}>
        <Star className="w-4 h-4 fill-current" />
        Featured Community
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {community.logo_url ? (
              <img src={community.logo_url} alt={community.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                style={{background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`}}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{community.name}</h2>
              <p className="text-slate-600 text-sm mb-2">{community.featured_tagline || community.description_short}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-700">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-semibold">{(community.follower_count || 0).toLocaleString()} members</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">{community.posts_this_week || 0} posts this week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Join button */}
          <button
            onClick={e => { e.stopPropagation(); onJoin(community); }}
            disabled={isJoining}
            className="flex-shrink-0 rounded-full font-bold text-sm transition-all active:scale-95 disabled:opacity-60 px-6 py-2"
            style={{
              background: isJoined ? '#E2E8F0' : accentColor,
              color: isJoined ? '#475569' : '#FFFFFF'
            }}
          >
            {isJoining ? '...' : isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>

        {community.description_long && (
          <p className="text-sm text-slate-600 line-clamp-2">{community.description_long}</p>
        )}
      </div>
    </div>
  );
}