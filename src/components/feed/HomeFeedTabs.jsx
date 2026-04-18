import React from 'react';

const TABS = [
  { id: 'for_you',  label: 'For You'  },
  { id: 'trending', label: 'Trending' },
  { id: 'events',   label: 'Events'   },
  { id: 'nearby',   label: 'Near You' },
  { id: 'chessed',  label: 'Chesed'   },
  { id: 'learning', label: 'Learning' },
];

export default function HomeFeedTabs({ activeTab, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-2 px-1">
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="flex-shrink-0 px-3.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all touch-manipulation active:scale-95"
            style={{
              WebkitTapHighlightColor: 'transparent',
              background: isActive ? '#1E40AF' : '#F1F5F9',
              color: isActive ? '#fff' : '#64748B',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}