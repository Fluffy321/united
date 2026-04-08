import React from 'react';

export const DISCOVER_CATEGORIES = [
  { key: 'shabbos',  label: 'Shabbos & Meals',  emoji: '🍽️', gradient: 'from-orange-400 to-red-500',     filterValue: 'Shabbos & Meals' },
  { key: 'jobs',     label: 'Jobs & Careers',    emoji: '💼', gradient: 'from-blue-500 to-indigo-600',    filterValue: 'Careers & Networking' },
  { key: 'housing',  label: 'Housing',           emoji: '🏠', gradient: 'from-green-500 to-emerald-600',  filterValue: 'Housing' },
  { key: 'travel',   label: 'Travel',            emoji: '✈️', gradient: 'from-cyan-500 to-teal-500',      filterValue: 'Travel' },
  { key: 'learning', label: 'Learning & Torah',  emoji: '📚', gradient: 'from-amber-400 to-orange-500',   filterValue: 'Learning & Torah' },
  { key: 'chessed',  label: 'Chessed',           emoji: '🤝', gradient: 'from-purple-500 to-indigo-500',  filterValue: 'Chessed & Volunteering' },
  { key: 'events',   label: 'Events',            emoji: '🎉', gradient: 'from-pink-500 to-rose-500',      filterValue: 'Social & Events' },
];

export default function DiscoverCategoryCards({ activeCategory, onSelectCategory }) {
  return (
    <div className="mb-6">
      <div className="text-lg font-bold text-slate-900 mb-3">Discover</div>
      <div className="grid grid-cols-2 gap-3">
        {DISCOVER_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(activeCategory === cat.key ? 'all' : cat.key)}
            className={`rounded-3xl p-4 text-white text-left bg-gradient-to-br ${cat.gradient} shadow-md active:scale-95 transition-transform duration-100 relative overflow-hidden ${
              activeCategory === cat.key ? 'ring-2 ring-white ring-offset-2' : ''
            }`}
          >
            <div className="text-2xl">{cat.emoji}</div>
            <div className="mt-2 font-bold">{cat.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}