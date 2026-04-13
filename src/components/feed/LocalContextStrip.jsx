import React from 'react';
import { MapPin, Users, Flame } from 'lucide-react';

const CHIPS = [
  { id: 'trending',    icon: Flame,   label: 'Popular',          activeBg: '#F97316' },
  { id: 'communities', icon: Users,   label: 'Communities',      activeBg: '#2563EB' },
  { id: 'nearby',      icon: MapPin,  label: 'Near you',         activeBg: '#059669' },
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
            style={{
              WebkitTapHighlightColor: 'transparent',
              background: isActive ? chip.activeBg : '#F8FAFC',
              color: isActive ? '#fff' : '#64748B',
              borderColor: isActive ? chip.activeBg : '#E2E8F0',
            }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all active:scale-95 touch-manipulation"
          >
            <Icon className="w-3.5 h-3.5" />
            {chip.label}
            {chip.id === 'communities' && userCommunityCount > 0 && (
              <span
                style={{ background: isActive ? 'rgba(255,255,255,0.25)' : '#2563EB', color: '#fff' }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              >
                {userCommunityCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}