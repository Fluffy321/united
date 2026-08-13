import React from 'react';

export const DISCOVER_CATEGORIES = [
  { key: 'official', label: 'Official / Daily', emoji: '✅', gradient: 'from-blue-600 to-sky-500', filterValue: 'Official / Daily' },
  { key: 'local', label: 'Five Towns Local', emoji: '📍', gradient: 'from-cyan-500 to-blue-700', filterValue: 'Local Communities' },
  { key: 'shabbos', label: 'Shabbos & Meals', emoji: '🍽️', gradient: 'from-orange-400 to-red-500', filterValue: 'Shabbos & Meals' },
  { key: 'support', label: 'Private Support', emoji: '🛡️', gradient: 'from-violet-500 to-fuchsia-500', filterValue: 'Private Support' },
  { key: 'sports', label: 'Sports & Social', emoji: '🏀', gradient: 'from-emerald-500 to-teal-600', filterValue: 'Sports & Fitness' },
  { key: 'food', label: 'Kosher Food', emoji: '🥯', gradient: 'from-amber-400 to-orange-500', filterValue: 'Food & Lifestyle' },
  { key: 'parents', label: 'Parents & School', emoji: '🎒', gradient: 'from-sky-500 to-indigo-600', filterValue: 'Programs & Youth' },
  { key: 'jobs', label: 'Jobs & Business', emoji: '💼', gradient: 'from-slate-700 to-blue-700', filterValue: 'Careers & Networking' },
  { key: 'learning', label: 'Learning & Torah', emoji: '📚', gradient: 'from-indigo-500 to-purple-600', filterValue: 'Learning & Torah' },
  { key: 'chessed', label: 'Chesed / Help', emoji: '🤝', gradient: 'from-rose-500 to-orange-500', filterValue: 'Chessed & Volunteering' },
];

export default function DiscoverCategoryCards({ activeCategory, onSelectCategory }) {
  const categories = [
    { key: 'all', label: 'All', emoji: '✨' },
    ...DISCOVER_CATEGORIES,
  ];

  return (
    <section className="space-y-2.5" aria-labelledby="community-category-heading">
      <h2 id="community-category-heading" className="text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
        Explore by category
      </h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
          <button
            key={cat.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectCategory(isActive && cat.key !== 'all' ? 'all' : cat.key)}
            className={`motion-press flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-black transition-colors ${
              isActive
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <span aria-hidden="true">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
          );
        })}
      </div>
    </section>
  );
}
