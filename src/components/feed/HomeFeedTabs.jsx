import React, { useRef } from 'react';
import { tabActive, tabInactive, gradientStyle } from '@/lib/theme';

const TABS = [
  { id: 'for_you', label: '✨ For You' },
  { id: 'trending', label: '🔥 Trending' },
  { id: 'events', label: '📅 Events' },
  { id: 'nearby', label: '📍 Near You' },
  { id: 'chessed', label: '❤️ Chessed' },
  { id: 'learning', label: '📚 Learning' },
  { id: 'social', label: '🏀 Social' },
];

export default function HomeFeedTabs({ activeTab, onChange }) {
  const scrollRef = useRef(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide py-2.5 px-4"
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all"
          style={activeTab === tab.id
            ? { background: 'white', color: '#2563EB', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
            : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}