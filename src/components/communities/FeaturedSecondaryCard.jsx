import React from 'react';

export default function FeaturedSecondaryCard({ community, onOpen, onJoin, isJoined, isJoining }) {
  const initials = community.name?.slice(0, 2).toUpperCase() || 'CO';

  return (
    <div
      onClick={() => onOpen(community.id)}
      className="min-w-[220px] rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm cursor-pointer active:scale-95 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700">
            Featured
          </div>
          <div className="truncate text-sm font-bold text-slate-900">{community.name}</div>
          <div className="mt-1 text-xs text-slate-500">
            {(community.follower_count || 0).toLocaleString()} members
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onJoin(community); }}
          disabled={isJoining}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 shrink-0"
          style={{ background: isJoined ? '#94A3B8' : '#2563EB' }}
        >
          {isJoining ? '...' : isJoined ? '✓' : 'Join'}
        </button>
      </div>
    </div>
  );
}
      className="h-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 active:scale-95"
      style={{
        background: `linear-gradient(135deg, ${accentColor}06, rgba(255,255,255,0.4))`,
        border: `2px solid ${accentColor}15`,
        boxShadow: `0 4px 16px ${accentColor}08, 0 1px 2px ${accentColor}05`,
      }}
    >
      {/* Premium accent bar */}
      <div className="h-2" style={{
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}dd)`,
        borderRadius: '0 0 12px 0'
      }} />

      <div className="p-5 flex flex-col h-full space-y-4">
        {/* Header with avatar and name */}
        <div className="flex items-start gap-3.5 min-w-0">
          {community.logo_url ? (
            <img src={community.logo_url} alt={community.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
              }}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate leading-tight">{community.name}</h3>
            <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span className="font-medium">{(community.follower_count || 0).toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Join button */}
        <button
          onClick={e => { e.stopPropagation(); onJoin(community); }}
          disabled={isJoining}
          className="w-full rounded-lg font-semibold text-xs py-2.5 transition-all active:scale-95 disabled:opacity-60 mt-auto hover:shadow-md"
          style={{
            background: isJoined ? '#E2E8F0' : accentColor,
            color: isJoined ? '#475569' : '#FFFFFF',
            boxShadow: isJoined ? 'none' : `0 4px 12px ${accentColor}20`
          }}
        >
          {isJoining ? '...' : isJoined ? '✓ Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}