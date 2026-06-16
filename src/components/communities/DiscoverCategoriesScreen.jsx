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
  return (
    <div className="mb-6">
      <div className="text-lg font-bold text-slate-900 mb-3">Discover communities that are useful today</div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {DISCOVER_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(activeCategory === cat.key ? 'all' : cat.key)}
            className={`relative min-w-[178px] overflow-hidden rounded-[28px] p-4 text-left text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] bg-gradient-to-br ${cat.gradient} ${
              activeCategory === cat.key ? 'ring-2 ring-slate-900 ring-offset-2' : ''
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_28%)]" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm">
                {cat.emoji}
              </div>
              <div className="min-w-0">
                <div className="font-bold leading-tight">{cat.label}</div>
                <div className="mt-1 text-[11px] font-semibold text-white/80">Join a room with a reason</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
