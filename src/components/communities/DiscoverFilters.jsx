import React from 'react';
import { Users, Zap, TrendingUp } from 'lucide-react';

export const SIZE_OPTIONS = [
  { key: 'all_sizes', label: 'Any Size' },
  { key: 'small', label: 'Small', description: '< 100', min: 0, max: 99 },
  { key: 'medium', label: 'Medium', description: '100–500', min: 100, max: 500 },
  { key: 'large', label: 'Large', description: '500+', min: 501, max: Infinity },
];

export const ACTIVITY_OPTIONS = [
  { key: 'all_activity', label: 'Any Activity' },
  { key: 'high', label: '🔥 High Activity', minPosts: 5 },
  { key: 'medium', label: '🟢 Active', minPosts: 1 },
  { key: 'low', label: 'Low / New', minPosts: 0, maxPosts: 0 },
];

export function applyExtraFilters(communities, sizeFilter, activityFilter) {
  let result = communities;

  const size = SIZE_OPTIONS.find(o => o.key === sizeFilter);
  if (size && size.key !== 'all_sizes') {
    result = result.filter(c => {
      const fc = c.follower_count || 0;
      return fc >= size.min && fc <= size.max;
    });
  }

  const activity = ACTIVITY_OPTIONS.find(o => o.key === activityFilter);
  if (activity && activity.key !== 'all_activity') {
    result = result.filter(c => {
      const pw = c.posts_this_week || c.post_count || 0;
      if (activity.key === 'low') return pw <= (activity.maxPosts ?? 0);
      return pw >= activity.minPosts;
    });
  }

  return result;
}

export default function DiscoverFilters({ sizeFilter, setSizeFilter, activityFilter, setActivityFilter }) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Size filter */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 flex-shrink-0">
          <Users className="w-3 h-3" /> Size
        </div>
        {SIZE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSizeFilter(opt.key)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
              sizeFilter === opt.key
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
            }`}
          >
            {opt.label}{opt.description && <span className="ml-1 opacity-70">{opt.description}</span>}
          </button>
        ))}
      </div>

      {/* Activity filter */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 flex-shrink-0">
          <Zap className="w-3 h-3" /> Activity
        </div>
        {ACTIVITY_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setActivityFilter(opt.key)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
              activityFilter === opt.key
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}