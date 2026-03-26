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
          type="button"
          onClick={() => onChange(tab.id)}
          onTouchEnd={(e) => { e.preventDefault(); onChange(tab.id); }}
          className="relative z-10 flex-shrink-0 min-h-[44px] px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent', background: activeTab === tab.id ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : tab.inactive.bg, color: activeTab === tab.id ? 'white' : tab.inactive.color, border: activeTab === tab.id ? 'none' : `1px solid ${tab.inactive.border}`, boxShadow: activeTab === tab.id ? '0 2px 8px rgba(37,99,235,0.35)' : 'none' }}
        >
          <span className="pointer-events-none">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}