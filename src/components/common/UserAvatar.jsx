import React, { useState } from 'react';

const AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8' }, // blue
  { bg: '#D1FAE5', text: '#065F46' }, // green
  { bg: '#FEF3C7', text: '#92400E' }, // amber
  { bg: '#EDE9FE', text: '#5B21B6' }, // purple
  { bg: '#FCE7F3', text: '#9D174D' }, // pink
  { bg: '#FFEDD5', text: '#9A3412' }, // orange
  { bg: '#CFFAFE', text: '#0E7490' }, // cyan
  { bg: '#F0FDF4', text: '#166534' }, // lime green
];

function getColorForName(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function UserAvatar({ user, name, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-24 h-24'
  };

  const fontSizes = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-[12px]',
    lg: 'text-[14px]',
    xl: 'text-[32px]'
  };

  const displayName = name || user?.display_name || user?.full_name || user?.user_name || user?.author_name || '';
  const avatarUrl = user?.avatar_url;
  const sizeClass = sizes[size] || sizes.md;
  const fontClass = fontSizes[size] || fontSizes.md;

  if (avatarUrl && !imgError) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 ${className}`}>
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  const color = getColorForName(displayName);
  const initials = getInitials(displayName);

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-bold select-none ${fontClass} ${className}`}
      style={{ background: color.bg, color: color.text, border: `2px solid ${color.bg}` }}
    >
      {initials}
    </div>
  );
}