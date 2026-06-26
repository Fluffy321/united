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
            Directory pick
          </div>
          <div className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{community.name}</div>
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
