import React from 'react';
import { Star, Users } from 'lucide-react';

export default function FeaturedSecondaryCard({ community, onOpen, onJoin, isJoined, isJoining }) {
  const accentColor = community.featured_accent_color || '#2563EB';
  const initials = community.name?.slice(0, 2).toUpperCase() || 'CO';

  return (
    <div
      onClick={() => onOpen(community.id)}
      className="h-full rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95"
      style={{
        background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}03)`,
        border: `1.5px solid ${accentColor}20`,
      }}
    >
      {/* Accent bar */}
      <div className="h-1.5" style={{background: accentColor}} />

      <div className="p-4 flex flex-col h-full space-y-3">
        {/* Header with avatar and name */}
        <div className="flex items-start gap-3 min-w-0">
          {community.logo_url ? (
            <img src={community.logo_url} alt={community.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
              style={{background: accentColor}}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate">{community.name}</h3>
            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {(community.follower_count || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Join button */}
        <button
          onClick={e => { e.stopPropagation(); onJoin(community); }}
          disabled={isJoining}
          className="w-full rounded-lg font-semibold text-xs py-2 transition-all active:scale-95 disabled:opacity-60 mt-auto"
          style={{
            background: isJoined ? '#E2E8F0' : accentColor,
            color: isJoined ? '#475569' : '#FFFFFF'
          }}
        >
          {isJoining ? '...' : isJoined ? '✓' : 'Join'}
        </button>
      </div>
    </div>
  );
}