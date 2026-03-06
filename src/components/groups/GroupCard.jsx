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
  'General': '💬'
};

export default function GroupCard({ group, isMember, onJoin, onLeave, onClick }) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
      style={{ border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      onClick={onClick}
    >
      {/* Cover */}
      <div
        className="h-20 flex items-center justify-center text-4xl"
        style={{ background: 'linear-gradient(135deg, var(--accent), #1d4ed8)' }}
      >
        {CATEGORY_EMOJI[group.category] || '💬'}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-[15px] text-[#0F1C2E] truncate">{group.name}</p>
              {group.is_private && <Lock className="w-3 h-3 text-[#94a3b8] flex-shrink-0" />}
            </div>
            <p className="text-[12px] text-[#64748b] mt-0.5 line-clamp-2">{group.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-[#94a3b8]">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {group.member_count || 0} members
          </span>
          {group.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {group.location}
            </span>
          )}
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f1f5f9] text-[#64748b]">
            {group.category}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            isMember ? onLeave(group) : onJoin(group);
          }}
          className="mt-3 w-full py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95"
          style={
            isMember
              ? { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
              : { background: 'var(--primary)', color: 'white' }
          }
        >
          {isMember ? '✓ Joined' : '+ Join Group'}
        </button>
      </div>
    </div>
  );
}