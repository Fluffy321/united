import React, { useRef, useState, useEffect } from 'react';

const TABS = [
  { id: 'trending', label: '🔥 Trending' },
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
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}