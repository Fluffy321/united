import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function getInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const BG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
];

export default function CommunityActivityStrip({ groups = [] }) {
  const navigate = useNavigate();
  if (groups.length === 0) return null;

  const RING_COLORS = [
    '#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#F97316','#6366F1'
  ];

  return (
    <div
      className="flex gap-3 overflow-x-auto scrollbar-hide mb-3 -mx-4 px-4 py-3 rounded-2xl"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)', marginLeft: 0, marginRight: 0 }}
    >
      {groups.slice(0, 8).map((g, i) => (
        <button
          key={g.id}
          type="button"
          onClick={() => navigate(createPageUrl('Communities') + `?communityId=${g.id}`)}
          className="flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform touch-manipulation bg-transparent border-0 p-0"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold overflow-hidden ${BG_COLORS[i % BG_COLORS.length]}`}
            style={{ border: `2.5px solid ${RING_COLORS[i % RING_COLORS.length]}`, boxShadow: `0 0 0 2px white, 0 2px 8px rgba(0,0,0,0.1)` }}
          >
            {g.cover_image_url ? (
              <img src={g.cover_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              getInitials(g.name)
            )}
          </div>
          <span className="text-[10px] font-semibold text-slate-600 max-w-[52px] text-center leading-tight line-clamp-2">{g.name}</span>
        </button>
      ))}
    </div>
  );
}