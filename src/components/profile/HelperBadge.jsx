import React from 'react';

const BADGE_CONFIG = {
  none: null,
  trusted: {
    emoji: '⭐',
    label: 'Trusted Helper',
    description: '10+ helps completed',
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  volunteer: {
    emoji: '🕊',
    label: 'Community Volunteer',
    description: '25+ helps completed',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  },
  leader: {
    emoji: '🧡',
    label: 'Chesed Leader',
    description: '50+ helps completed',
    color: 'bg-orange-50 border-orange-200 text-orange-700'
  }
};

export default function HelperBadge({ badge = 'none', size = 'sm' }) {
  const config = BADGE_CONFIG[badge];
  
  if (!config) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  return (
    <div title={config.description} className={`inline-flex items-center rounded-full border ${config.color} font-semibold ${sizeClasses[size]}`}>
      <span className="text-base">{config.emoji}</span>
      <span>{config.label}</span>
    </div>
  );
}