import React from 'react';
import { COMMUNITIES_ENABLED } from '@/config/features';
import { PIN_TYPES, PRIMARY_FILTERS } from './shared';

export default function MitzvahMapFilterBar({
  personalized,
  activeLayers,
  activeTypes,
  activePrimaryFilter,
  showTypeFilters,
  hasActiveFilters,
  onSetActiveTypes,
  onSetShowTypeFilters,
  onApplyPrimaryFilter,
  onToggleType,
  onToggleLayer,
}) {
  return (
    <>
      {/* Five Towns hub banner */}
      {personalized && (
        <div className="border-b border-blue-100 bg-blue-50 px-3 py-2">
          <p className="text-[12px] font-black text-blue-900">
            Five Towns map
            <span className="ml-2 font-medium text-blue-700">
              {COMMUNITIES_ENABLED
                ? 'Kosher food, shuls, schools, events, mitzvahs, and community posts'
                : 'Kosher food, shuls, schools, events, and mitzvah needs'}
            </span>
          </p>
        </div>
      )}

      {/* Primary filter chips — horizontal scroll, matches Communities chip pattern */}
      <div className="mobile-scroll-x flex gap-2 border-b border-slate-200 bg-white px-2 py-2">
        {[
          { key: 'places', label: 'Places' },
          ...(COMMUNITIES_ENABLED ? [{ key: 'community', label: 'Community' }] : []),
          { key: 'help', label: 'Help' },
        ].map((layer) => {
          const active = activeLayers.has(layer.key);
          return (
            <button
              key={layer.key}
              type="button"
              aria-pressed={active}
              onClick={() => onToggleLayer(layer.key)}
              className={`motion-press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${
                active ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {layer.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onSetActiveTypes(new Set())}
          className={`motion-press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${
            activeTypes.size === 0 ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          All
        </button>
        {PRIMARY_FILTERS.map((filter) => {
          const active = activePrimaryFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onApplyPrimaryFilter(filter)}
              className={`motion-press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${
                active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onSetShowTypeFilters((v) => !v)}
          className={`motion-press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${
            showTypeFilters ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          {showTypeFilters ? 'Fewer filters' : 'More filters'}
        </button>
      </div>

      {/* Granular type chips — collapsed by default so the map isn't buried under two filter rows */}
      {showTypeFilters && (
      <div className="mobile-scroll-x flex gap-2 border-b border-slate-200 bg-white px-2 py-2">
        {Object.entries(PIN_TYPES).filter(([type]) => type !== 'other').map(([type, config]) => {
          const active = activeTypes.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggleType(type)}
              className={`motion-press flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : config.color }}
              />
              {config.label}
            </button>
          );
        })}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onSetActiveTypes(new Set())}
            className="motion-press flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700 transition hover:bg-blue-100"
          >
            Clear
          </button>
        )}
      </div>
      )}
    </>
  );
}
