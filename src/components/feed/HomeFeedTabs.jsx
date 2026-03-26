import React, { useRef } from 'react';

const TABS = [
  { id: 'for_you',   label: '✨ For You',  inactive: { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' } },
  { id: 'trending',  label: '🔥 Trending',  inactive: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' } },
  { id: 'events',    label: '📅 Events',    inactive: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' } },
  { id: 'nearby',    label: '📍 Near You',  inactive: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' } },
  { id: 'chessed',   label: '❤️ Chessed',   inactive: { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' } },
  { id: 'learning',  label: '📚 Learning',  inactive: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' } },
  { id: 'social',    label: '🏀 Social',    inactive: { bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' } },
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
            ? { background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }
            : { background: tab.inactive.bg, color: tab.inactive.color, border: `1px solid ${tab.inactive.border}` }
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}