import React, { useRef, useState, useEffect } from 'react';

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
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? 'text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600'
          }`}
          style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #2563EB, #7C3AED)' } : {}}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}