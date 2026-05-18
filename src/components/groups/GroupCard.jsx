import React from 'react';
import { Users, MapPin, Lock } from 'lucide-react';

const CATEGORY_EMOJI = {
  'Torah Learning': '📖',
  'Shabbat': '🕯️',
  'Chesed': '🤝',
  'Events': '📅',
  'Youth': '⭐',
  'Families': '👨‍👩‍👧',
  'Seniors': '💛',
  'General': '💬',
};

// Category-specific gradient pairs — warm, brand-aligned
const CATEGORY_GRADIENT = {
  'Torah Learning': 'from-blue-700 to-indigo-900',
  'Shabbat':        'from-amber-500 to-amber-800',
  'Chesed':         'from-emerald-600 to-emerald-900',
  'Events':         'from-violet-600 to-violet-900',
  'Youth':          'from-sky-500 to-sky-800',
  'Families':       'from-rose-500 to-rose-800',
  'Seniors':        'from-amber-600 to-orange-800',
  'General':        'from-slate-600 to-slate-900',
};

export default function GroupCard({ group, isMember, onJoin, onLeave, onClick }) {
  const gradient = CATEGORY_GRADIENT[group.category] || CATEGORY_GRADIENT.General;

  return (
    <div
      className="j-card overflow-hidden cursor-pointer motion-press"
      onClick={onClick}
    >
      {/* Cover */}
      <div className={`h-[72px] flex items-center justify-center text-4xl bg-gradient-to-br ${gradient}`}>
        {CATEGORY_EMOJI[group.category] || '💬'}
      </div>

      <div className="p-3">
        <div className="flex items-start gap-1.5 mb-0.5">
          <p className="font-bold text-[14px] text-slate-900 truncate flex-1 min-w-0">{group.name}</p>
          {group.is_private && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />}
        </div>

        <p className="text-[11.5px] text-slate-500 line-clamp-2 leading-[1.45]">{group.description}</p>

        <div className="flex items-center gap-2 mt-2 text-[10.5px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-0.5">
            <Users className="w-3 h-3" />
            {group.member_count || 0}
          </span>
          {group.location && (
            <span className="flex items-center gap-0.5 min-w-0 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{group.location}</span>
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            isMember ? onLeave(group) : onJoin(group);
          }}
          className={`mt-2.5 w-full py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-95 ${
            isMember
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {isMember ? '✓ Joined' : group.is_private ? 'Request to Join' : 'Join Group'}
        </button>
      </div>
    </div>
  );
}
