import React from 'react';

export const DISCOVER_CATEGORIES = [
  {
    key: 'shabbos',
    label: 'Shabbos & Meals',
    emoji: '🕯️',
    description: 'Shabbos tables, meal sharing, and holiday gatherings',
    examples: ['Young Israel Woodmere', 'Five Towns Shabbos Network', 'Chabad of Woodmere'],
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    textAccent: 'text-amber-700',
    filterValue: 'Local Communities',
  },
  {
    key: 'jobs',
    label: 'Jobs & Careers',
    emoji: '💼',
    description: 'Job listings, networking, and career development',
    examples: ['Five Towns Professionals', 'Jewish Career Network', 'Tech & Torah'],
    gradient: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50',
    textAccent: 'text-cyan-700',
    filterValue: 'Careers & Networking',
  },
  {
    key: 'housing',
    label: 'Housing',
    emoji: '🏠',
    description: 'Apartments, rentals, roommates, and real estate',
    examples: ['Five Towns Housing', 'Lawrence Rentals', 'Woodmere Homes'],
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    textAccent: 'text-violet-700',
    filterValue: 'Local Communities',
  },
  {
    key: 'travel',
    label: 'Travel',
    emoji: '✈️',
    description: 'Kosher travel, trip planning, and travel tips',
    examples: ['Kosher Travelers', 'Israel Trips', 'Jewish Cruises'],
    gradient: 'from-sky-400 to-teal-500',
    bg: 'bg-sky-50',
    textAccent: 'text-sky-700',
    filterValue: 'Travel',
  },
  {
    key: 'learning',
    label: 'Learning & Torah',
    emoji: '📚',
    description: 'Shiurim, daf yomi, parsha, and Torah discussion',
    examples: ['Daf Yomi Chat', 'Weekly Parsha Group', 'HAFTR Alumni Learning'],
    gradient: 'from-indigo-500 to-violet-600',
    bg: 'bg-indigo-50',
    textAccent: 'text-indigo-700',
    filterValue: 'Learning & Torah',
  },
  {
    key: 'chessed',
    label: 'Chessed',
    emoji: '🤝',
    description: 'Volunteering, helping others, and acts of kindness',
    examples: ['Five Towns Chessed Network', 'Bikur Cholim', 'Mitzvah Map Volunteers'],
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    textAccent: 'text-rose-700',
    filterValue: 'Chessed & Volunteering',
  },
  {
    key: 'social',
    label: 'Social & Events',
    emoji: '🎉',
    description: 'Parties, hangouts, meetups, and community events',
    examples: ['Young Adults Hangouts', 'Five Towns Social', 'Woodmere Families'],
    gradient: 'from-pink-500 to-fuchsia-500',
    bg: 'bg-pink-50',
    textAccent: 'text-pink-700',
    filterValue: 'Social & Events',
  },
];

export default function DiscoverCategoriesScreen({ onSelectCategory }) {
  return (
    <div className="space-y-3">
      <div className="mb-1">
        <h2 className="text-[18px] font-bold text-slate-900">Browse by Category</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Find communities that match your interests</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DISCOVER_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(cat.filterValue)}
            className={`text-left rounded-3xl p-5 bg-gradient-to-br ${cat.gradient} text-white shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.97] transition-all duration-150`}
          >
            <div className="text-3xl mb-2">{cat.emoji}</div>
            <div className="text-[15px] font-bold leading-snug">{cat.label}</div>
            <div className="text-[12px] opacity-80 mt-1 leading-snug">{cat.description}</div>
            <div className="flex flex-wrap gap-1 mt-3">
              {cat.examples.slice(0, 2).map((ex) => (
                <span key={ex} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/20">{ex}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}