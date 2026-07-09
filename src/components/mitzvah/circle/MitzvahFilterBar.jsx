import React from 'react';
import { ListFilter, Search } from 'lucide-react';
import { CATEGORIES, CATEGORY_GROUPS } from './shared';

export default function MitzvahFilterBar({
  activeView,
  activeCategory,
  onChangeBrowseCategory,
  browseCount,
  query,
  onQueryChange,
  detailCategoryFilter,
  onDetailCategoryFilterChange,
}) {
  if (['shuls', 'mealtrains', 'rides', 'dvar-torah'].includes(activeView)) return null;

  return (
    <div className="surface-panel-soft mb-3 space-y-3 rounded-[24px] p-3">
      {activeView === 'browse' && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-black text-slate-950">Browse by need</p>
              <p className="text-[12px] font-semibold text-slate-500">
                Choose the kind of chesed you want to help with.
              </p>
            </div>
            {browseCount > 0 && (
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                {browseCount} open
              </span>
            )}
          </div>
          <div className="mobile-scroll-x flex gap-2">
            {CATEGORY_GROUPS.map((group) => {
              const Icon = group.icon;
              const selected = activeCategory === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => onChangeBrowseCategory(group.id)}
                  className={`motion-press shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                    selected
                      ? `${group.tone} shadow-sm`
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2 text-[12px] font-black">
                    <Icon className="h-4 w-4" />
                    {group.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={activeView === 'browse' ? 'grid gap-2' : 'grid gap-2 sm:grid-cols-[1fr_220px]'}>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search requests"
            className="app-input h-11 pl-10 pr-3 text-sm"
          />
        </label>
        {activeView !== 'browse' && (
          <label className="relative">
            <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={detailCategoryFilter}
              onChange={(e) => onDetailCategoryFilterChange(e.target.value)}
              className="app-input h-11 pl-10 pr-3 text-sm font-black"
            >
              <option>All</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
