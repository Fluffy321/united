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
      className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-4"
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={activeTab === tab.id ? tabActive : tabInactive}
          style={activeTab === tab.id ? gradientStyle : {}}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}