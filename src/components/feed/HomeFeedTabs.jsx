import React, { useRef } from 'react';

const TABS = [
  { id: 'for_you',   label: '✨ For You'  },
  { id: 'trending',  label: '🔥 Trending'  },
  { id: 'events',    label: '📅 Events'    },
  { id: 'nearby',    label: '📍 Near You'  },
  { id: 'chessed',   label: '❤️ Chessed'   },
  { id: 'learning',  label: '📚 Learning'  },
  { id: 'social',    label: '🏀 Social'    },
];

export default function HomeFeedTabs({ activeTab, onChange }) {
  const scrollRef = useRef(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto scrollbar-hide py-2 px-3"
    >
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              background: isActive ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : 'rgba(255,255,255,0.08)',
              color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              border: isActive ? 'none' : '1px solid rgba(255,255,255,0.12)',
              boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.4)' : 'none',
            }}
            className="flex-shrink-0 min-h-[34px] px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all touch-manipulation"
          >
            <span className="pointer-events-none">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}