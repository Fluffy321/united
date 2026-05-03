import React from 'react';
import { Filter } from 'lucide-react';

const CATEGORY_FILTERS = [
  { id: 'all', label: '📰 All Posts', icon: null },
  { id: 'help', label: '🆘 Help Needed', icon: null },
  { id: 'event', label: '📅 Events', icon: null },
  { id: 'feed', label: '💬 Discussion', icon: null },
  { id: 'job', label: '💼 Jobs', icon: null },
  { id: 'housing', label: '🏠 Housing', icon: null },
];

export default function FeedFilterBar({ activeFilter, onFilterChange, communities, selectedCommunity, onCommunityChange }) {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-3 overflow-hidden">
      {/* Main filter bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
          {CATEGORY_FILTERS.map(cat => (
            <button
              key={cat.id}
              onClick={() => onFilterChange(cat.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                activeFilter === cat.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`ml-2 p-1.5 rounded-full transition-colors flex-shrink-0 ${
            showFilters ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Community filter (expandable) */}
      {showFilters && communities.length > 0 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Filter by community</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCommunityChange(null)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                selectedCommunity === null
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              All Communities
            </button>
            {communities.map(community => (
              <button
                key={community.id}
                onClick={() => onCommunityChange(community.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
                  selectedCommunity === community.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {community.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}