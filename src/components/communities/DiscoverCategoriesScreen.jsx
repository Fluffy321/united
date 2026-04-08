import React from 'react';

export const DISCOVER_CATEGORIES = [
  {
    key: 'shabbos',
    label: 'Shabbos & Meals',
    emoji: '🍽️',
    description: 'Meals, hosting & Shabbat tables',
    gradient: 'from-amber-400 to-orange-500',
    filterValue: 'Shabbos & Meals',
  },
  {
    key: 'jobs',
    label: 'Jobs & Careers',
    emoji: '💼',
    description: 'Careers, networking & opportunities',
    gradient: 'from-emerald-500 to-teal-600',
    filterValue: 'Careers & Networking',
  },
  {
    key: 'housing',
    label: 'Housing',
    emoji: '🏠',
    description: 'Rentals, roommates & real estate',
    gradient: 'from-blue-500 to-indigo-600',
    filterValue: 'Housing',
  },
  {
    key: 'travel',
    label: 'Travel',
    emoji: '✈️',
    description: 'Kosher travel & trip planning',
    gradient: 'from-sky-400 to-cyan-500',
    filterValue: 'Travel',
  },
  {
    key: 'learning',
    label: 'Learning & Torah',
    emoji: '📚',
    description: 'Shiurim, daf yomi & study groups',
    gradient: 'from-violet-500 to-purple-600',
    filterValue: 'Learning & Torah',
  },
  {
    key: 'chessed',
    label: 'Chessed',
    emoji: '🤝',
    description: 'Volunteering & acts of kindness',
    gradient: 'from-rose-500 to-pink-600',
    filterValue: 'Chessed & Volunteering',
  },
  {
    key: 'events',
    label: 'Events',
    emoji: '🎉',
    description: 'Meetups, parties & community events',
    gradient: 'from-pink-500 to-fuchsia-500',
    filterValue: 'Social & Events',
  },
];

export default function DiscoverCategoryCards({ activeCategory, onSelectCategory }) {
  return (
    <div className="mb-5">
      <h2 className="text-[15px] font-bold text-slate-800 mb-3">Browse by Category</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {DISCOVER_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(isActive ? 'all' : cat.key)}
              className={`flex-shrink-0 w-[130px] rounded-2xl p-3.5 text-left transition-all duration-150 active:scale-95 relative overflow-hidden ${
                isActive ? 'ring-2 ring-offset-1 ring-white shadow-xl scale-[1.03]' : 'shadow-md hover:shadow-lg hover:-translate-y-0.5'
              } bg-gradient-to-br ${cat.gradient}`}
            >
              {/* bg decoration */}
              <div className="absolute right-1 bottom-0 text-[44px] opacity-[0.15] leading-none select-none pointer-events-none">
                {cat.emoji}
              </div>
              <div className="relative">
                <div className="text-[28px] mb-1.5 leading-none">{cat.emoji}</div>
                <div className="text-[13px] font-bold text-white leading-snug">{cat.label}</div>
                <div className="text-[10px] text-white/75 mt-0.5 leading-snug line-clamp-2">{cat.description}</div>
              </div>
              {isActive && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}