import React from 'react';
import { Flame, MessageCircle } from 'lucide-react';

const MOCK_ACTIVITY = [
  { id: 1, emoji: '🏀', label: 'Pickup Basketball', sub: 'Active now · 4 new posts', hot: true },
  { id: 2, emoji: '🚨', label: 'Five Towns Alerts', sub: '3 new alerts today', hot: true },
  { id: 3, emoji: '❤️', label: 'Meal Train Group', sub: 'New volunteer needed', hot: false },
  { id: 4, emoji: '📚', label: 'Daf Yomi', sub: '12 replies on today\'s daf', hot: false },
  { id: 5, emoji: '☕', label: 'Coffee Meetups', sub: 'Event posted for Sunday', hot: false },
];

export default function CommunityActivityStrip({ groups = [], onGroupClick }) {
  // Use seeded group data if available, fall back to mock
  const items = groups.length > 0
    ? groups.slice(0, 5).map((g, i) => ({
        id: g.id,
        emoji: ['🏀', '🚨', '❤️', '📚', '☕'][i % 5],
        label: g.name,
        sub: `${g.member_count || 0} members`,
        hot: i < 2,
        group: g,
      }))
    : MOCK_ACTIVITY;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2.5 px-0.5">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-[13px] font-bold text-slate-900">Community Activity</span>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => item.group && onGroupClick && onGroupClick(item.group)}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-3.5 py-2.5 cursor-pointer active:scale-[0.99] transition-transform"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <span className="text-xl flex-shrink-0">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{item.label}</p>
              <p className="text-[11px] text-slate-500">{item.sub}</p>
            </div>
            {item.hot && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex-shrink-0">
                <Flame className="w-2.5 h-2.5" /> HOT
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}