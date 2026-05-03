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
    <div className="mobile-scroll-x -mx-1 flex gap-2 px-1 py-2.5">
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`mobile-touch flex-shrink-0 rounded-2xl border px-4 text-[13px] font-bold whitespace-nowrap transition-all touch-manipulation active:scale-95 ${
              isActive
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 shadow-sm'
            }`}
            style={{
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
