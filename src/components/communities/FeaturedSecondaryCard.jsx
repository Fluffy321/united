import React from 'react';
import { Star, Users } from 'lucide-react';

export default function FeaturedSecondaryCard({ community, onOpen, onJoin, isJoined, isJoining }) {
  const accentColor = community.featured_accent_color || '#2563EB';
  const initials = community.name?.slice(0, 2).toUpperCase() || 'CO';

  return (
    <div
      onClick={() => onOpen(community.id)}
      className="w-full rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}06)`,
        border: `1.5px solid ${accentColor}25`,
      }}
    >
      {/* Mini featured badge */}
      <div className="flex items-center justify-center gap-0.5 py-1 px-3 text-xs font-bold text-white"
        style={{background: accentColor}}>
        <Star className="w-3 h-3 fill-current" />
        Featured
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {community.logo_url ? (
            <img src={community.logo_url} alt={community.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`}}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate">{community.name}</h3>
            <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{community.featured_tagline || community.description_short}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <div className="flex items-center gap-1 text-xs">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold">{(community.follower_count || 0).toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-slate-400">{community.posts_this_week || 0} posts</span>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onJoin(community); }}
          disabled={isJoining}
          className="w-full rounded-full font-semibold text-xs py-1.5 transition-all active:scale-95 disabled:opacity-60"
          style={{
            background: isJoined ? '#E2E8F0' : accentColor,
            color: isJoined ? '#475569' : '#FFFFFF'
          }}
        >
          {isJoining ? '...' : isJoined ? '✓ Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}