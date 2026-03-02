import React from 'react';

export const BADGE_CONFIG = {
  none: null,
  trusted: {
    emoji: '⭐',
    label: 'Trusted Helper',
    description: 'Completed 10+ helping acts',
    gradient: 'from-amber-400 to-yellow-300',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    glow: 'shadow-amber-100',
  },
  volunteer: {
    emoji: '🕊',
    label: 'Community Volunteer',
    description: 'Completed 25+ helping acts',
    gradient: 'from-blue-500 to-indigo-400',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    glow: 'shadow-blue-100',
  },
  leader: {
    emoji: '🧡',
    label: 'Chesed Leader',
    description: 'Completed 50+ helping acts',
    gradient: 'from-orange-500 to-rose-400',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    glow: 'shadow-orange-100',
  },
};

export default function HelperBadge({ badge = 'none', size = 'sm' }) {
  const config = BADGE_CONFIG[badge];
  if (!config) return null;

  if (size === 'lg') {
    return (
      <div
        title={config.description}
        className={`inline-flex items-center gap-2.5 rounded-2xl border ${config.bg} ${config.border} px-4 py-2.5 shadow-md ${config.glow}`}
      >
        <span className="text-2xl">{config.emoji}</span>
        <div>
          <p className={`font-bold text-[13px] ${config.text}`}>{config.label}</p>
          <p className="text-[11px] text-slate-400">{config.description}</p>
        </div>
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div
        title={config.description}
        className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${config.text} px-3 py-1 font-semibold text-[12px]`}
      >
        <span className="text-[15px]">{config.emoji}</span>
        <span>{config.label}</span>
      </div>
    );
  }

  // sm (default) — compact pill, used on post cards
  return (
    <span
      title={config.description}
      className={`inline-flex items-center gap-1 rounded-full border ${config.bg} ${config.border} ${config.text} px-2 py-0.5 font-semibold text-[11px]`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}