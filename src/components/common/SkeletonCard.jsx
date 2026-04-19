import React from 'react';

/**
 * SkeletonCard — shimmer placeholder matching post card proportions.
 * Use instead of static gray blocks while content loads.
 */
export default function SkeletonCard({ hasImage = false, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 ${className}`}>
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-2.5 w-20 rounded" />
        </div>
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
      {/* Body lines */}
      <div className="space-y-2 mb-3">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
      {/* Optional image */}
      {hasImage && (
        <div className="skeleton w-full rounded-xl mb-3" style={{ paddingBottom: '75%', position: 'relative' }}>
          <div className="absolute inset-0" />
        </div>
      )}
      {/* Action row */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
        <div className="skeleton h-6 w-10 rounded-full ml-auto" />
      </div>
    </div>
  );
}