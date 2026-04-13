import React from 'react';
import { MapPin, Users, Flame } from 'lucide-react';

const CHIPS = [
  {
    id: 'nearby',
    icon: MapPin,
    label: 'Near you',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBg: 'bg-emerald-600',
  },
  {
    id: 'communities',
    icon: Users,
    label: 'Your communities',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBg: 'bg-blue-600',
  },
  {
    id: 'trending',
    icon: Flame,
    label: 'Popular in Five Towns',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    activeBg: 'bg-orange-500',
  },
];

export default function LocalContextStrip({ activeTab, onTabChange, userCommunityCount = 0 }) {
  return (
    <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
      {CHIPS.map(chip => {
        const Icon = chip.icon;
        const isActive = activeTab === chip.id;
        return (
          <button
            key={chip.id}
            onClick={() => onTabChange(isActive ? 'trending' : chip.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all active:scale-95 touch-manipulation ${
              isActive
                ? `${chip.activeBg} text-white border-transparent shadow-sm`
                : `${chip.bg} ${chip.color} ${chip.border}`
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Icon className="w-3.5 h-3.5" />
            {chip.label}
            {chip.id === 'communities' && userCommunityCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'}`}>
                {userCommunityCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}