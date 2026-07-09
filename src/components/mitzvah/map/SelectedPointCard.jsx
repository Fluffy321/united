import React from 'react';
import { DIRECTORY_LAST_REVIEWED, PIN_TYPES, getTrustLabel } from './shared';

export default function SelectedPointCard({ point, mapLinks, distance, onClose }) {
  if (!point) return null;

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[550]">
      <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/96 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="mb-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black text-white"
              style={{ backgroundColor: (PIN_TYPES[point.type] || PIN_TYPES.other).color }}
            >
              {(PIN_TYPES[point.type] || PIN_TYPES.other).label}
            </div>
            <p className="truncate text-[14px] font-black text-slate-950">{point.title}</p>
            <p className="mt-1 line-clamp-3 text-[12px] font-semibold leading-5 text-slate-600">
              {point.description || 'Tap the marker to view details for this map item.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[16px] font-black text-slate-500 transition hover:bg-slate-100"
            aria-label="Close map summary"
          >
            ×
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
          {point.location_text && (
            <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-600 ring-1 ring-slate-200">
              {point.location_text}
            </span>
          )}
          {distance && (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 ring-1 ring-blue-100">
              {distance}
            </span>
          )}
          {getTrustLabel(point) && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-emerald-100">
              {getTrustLabel(point)}
            </span>
          )}
          {point.source_url && (
            <span className="rounded-full bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200">
              Reviewed {point.last_verified || DIRECTORY_LAST_REVIEWED}
            </span>
          )}
          {point.communityName && (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 ring-1 ring-blue-100">
              {point.communityName}
            </span>
          )}
          {point.posterName && (
            <span className="rounded-full bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200">
              {point.posterName}
            </span>
          )}
        </div>
        {mapLinks && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <a
              href={mapLinks.google}
              target="_blank"
              rel="noreferrer"
              className="motion-press rounded-xl bg-blue-600 px-2 py-2 text-center text-[11px] font-black text-white shadow-sm"
            >
              Google Maps
            </a>
            <a
              href={mapLinks.apple}
              target="_blank"
              rel="noreferrer"
              className="motion-press rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-[11px] font-black text-slate-700"
            >
              Apple Maps
            </a>
            <a
              href={mapLinks.waze}
              target="_blank"
              rel="noreferrer"
              className="motion-press rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-2 text-center text-[11px] font-black text-cyan-700"
            >
              Waze
            </a>
          </div>
        )}
        {point.source_url && (
          <a
            href={point.source_url}
            target="_blank"
            rel="noreferrer"
            className="motion-press mt-2 inline-flex w-full items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700"
          >
            Open listing source
          </a>
        )}
      </div>
    </div>
  );
}
