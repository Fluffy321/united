import React from 'react';

const QUICK_PROMPTS = [
  { emoji: '🕍', text: 'Where are you for Shabbos?' },
  { emoji: '🚗', text: 'Anyone driving to Brooklyn tonight?' },
  { emoji: '🍕', text: 'Best pizza in the area?' },
  { emoji: '✈️', text: 'Need a ride to JFK?' },
];

export default function QuickPromptChips({ onPostClick }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 -mx-1 px-1">
      {QUICK_PROMPTS.map(({ emoji, text }) => (
        <button
          key={text}
          onClick={() => onPostClick('feed', 'question', text)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 active:scale-95 transition-all whitespace-nowrap"
        >
          <span>{emoji}</span>
          {text}
        </button>
      ))}
    </div>
  );
}