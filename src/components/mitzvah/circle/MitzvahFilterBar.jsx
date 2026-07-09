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
    <div className="mb-3">
      {activeView === 'browse' && (
        <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3"><p className="text-[14px] font-black text-slate-950">Open requests</p>
            {browseCount > 0 && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                {browseCount} open
              </span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
            <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Search requests" className="app-input h-10 pl-10 pr-3 text-sm" /></label>
            <label className="relative"><ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select value={activeCategory} onChange={(e) => onChangeBrowseCategory(e.target.value)} className="app-input h-10 w-full pl-10 pr-3 text-sm font-bold">{CATEGORY_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</select></label>
          </div>
        </div>
      )}

      {activeView !== 'browse' && <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search requests"
            className="app-input h-11 pl-10 pr-3 text-sm"
          />
        </label>
        {
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
        }
      </div>
      }
    </div>
  );
}
