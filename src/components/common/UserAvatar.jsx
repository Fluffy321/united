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

export default function UserAvatar({ user, name, size = 'md', className = '', onClick = null, clickable = false, userId = null }) {
  const [imgError, setImgError] = useState(false);
  const displayName = name || user?.display_name || user?.full_name || user?.user_name || user?.author_name || '';
  const finalUserId = userId || user?.id;

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

  const avatarUrl = user?.avatar_url;
  const sizeClass = sizes[size] || sizes.md;
  const fontClass = fontSizes[size] || fontSizes.md;

  const canClick = (clickable || onClick) && finalUserId;

  if (avatarUrl && !imgError) {
    return (
      <div
        className={`${sizeClass} flex-shrink-0 overflow-hidden rounded-full border-2 border-white shadow-[0_8px_18px_rgba(15,23,42,0.12)] ring-1 ring-slate-100/80 ${className} ${canClick ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:opacity-90' : ''}`}
        onClick={canClick ? onClick : undefined}
        role={canClick ? 'button' : undefined}
        tabIndex={canClick ? 0 : undefined}
        onKeyDown={canClick ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      >
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
      className={`${sizeClass} flex flex-shrink-0 items-center justify-center rounded-full font-bold shadow-[0_8px_18px_rgba(15,23,42,0.10)] ring-1 ring-white/80 select-none ${fontClass} ${className} ${canClick ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:opacity-90' : ''}`}
      style={{ background: color.bg, color: color.text, border: '2px solid rgba(255,255,255,0.92)' }}
      onClick={canClick ? onClick : undefined}
      role={canClick ? 'button' : undefined}
      tabIndex={canClick ? 0 : undefined}
      onKeyDown={canClick ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {initials}
    </div>
  );
}
