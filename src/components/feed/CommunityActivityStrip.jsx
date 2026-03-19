import React from 'react';

const EMOJIS = ['🏀', '🚨', '❤️', '📚', '☕', '🕯️', '🤝', '🎉'];

export default function CommunityActivityStrip({ groups = [] }) {
  if (groups.length === 0) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide mb-3 -mx-4 px-4">
      {groups.slice(0, 8).map((g, i) => (
        <div
          key={g.id}
          className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xl shadow-sm">
            {EMOJIS[i % EMOJIS.length]}
          </div>
          <span className="text-[10px] font-semibold text-slate-600 max-w-[52px] text-center leading-tight line-clamp-2">{g.name}</span>
        </div>
      ))}
    </div>
  );
}