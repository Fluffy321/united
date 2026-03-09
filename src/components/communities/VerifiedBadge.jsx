import React from 'react';
import { BadgeCheck } from 'lucide-react';

const TYPE_LABEL = {
  Shul:         'Verified Shul',
  School:       'Verified School',
  Yeshiva:      'Verified Yeshiva',
  Seminary:     'Verified Seminary',
  Camp:         'Verified Camp',
  Organization: 'Verified Org',
};

/**
 * VerifiedBadge — drop anywhere next to a community name.
 * size: 'sm' | 'md' (default 'sm')
 * showLabel: show text label (default true)
 */
export default function VerifiedBadge({ community, size = 'sm', showLabel = true }) {
  if (!community?.is_verified) return null;

  const label = TYPE_LABEL[community.verified_type || community.type] || 'Verified';

  if (size === 'md') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
        <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" />
        {showLabel && label}
      </span>
    );
  }

  // sm (default) — compact chip, good for list cards
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
      <BadgeCheck className="w-3 h-3 flex-shrink-0" />
      {showLabel && label}
    </span>
  );
}