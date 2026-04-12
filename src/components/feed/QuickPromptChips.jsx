import React, { useMemo } from 'react';

const ALL_PROMPTS = [
  { emoji: '🕍', text: 'Where are you for Shabbos?' },
  { emoji: '🚗', text: 'Anyone need a ride this week?' },
  { emoji: '🍕', text: 'Best food spot right now?' },
  { emoji: '📚', text: 'Any good shiurim this week?' },
  { emoji: '🤝', text: 'Anyone looking for a chavrusa?' },
  { emoji: '🏠', text: 'Anyone hosting for Shabbos?' },
  { emoji: '🎉', text: "What's happening this weekend?" },
  { emoji: '💡', text: 'Hot take: share your opinion' },
  { emoji: '🙏', text: "Share something you're grateful for" },
  { emoji: '🧠', text: 'Question of the day for the community' },
  { emoji: '🌟', text: 'Give a shoutout to someone this week' },
  { emoji: '✈️', text: 'Need a ride to JFK?' },
];

export default function QuickPromptChips({ onPostClick }) {
  // Rotate 3 prompts daily based on day-of-year
  const dailyPrompts = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const start = (dayOfYear * 3) % ALL_PROMPTS.length;
    return [
      ALL_PROMPTS[start % ALL_PROMPTS.length],
      ALL_PROMPTS[(start + 1) % ALL_PROMPTS.length],
      ALL_PROMPTS[(start + 2) % ALL_PROMPTS.length],
    ];
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 -mx-1 px-1">
      {dailyPrompts.map(({ emoji, text }) => (
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