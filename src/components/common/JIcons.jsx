/**
 * JUnited Custom Icon Set
 * SVG icons for JUnited-specific concepts.
 * All icons accept { size, className, style } props.
 */
import React from 'react';

const base = (d, opts = {}) => ({ size = 20, className = '', style = {}, strokeWidth = 1.8, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={opts.fill ? 'currentColor' : 'none'}
    stroke={opts.fill ? 'none' : 'currentColor'}
    strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style} {...rest}
  >
    {d}
  </svg>
);

/** Helping hands — Mitzvah / Chesed */
export const MitzvahIcon = ({ size = 20, className = '', strokeWidth = 1.8, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    {/* Two cupped hands reaching up */}
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1" />
    <path d="M8 14V9a2 2 0 0 1 4 0v5" />
    <path d="M12 14V9" />
    <path d="M16 14V9a2 2 0 0 0-4 0" />
    <path d="M5 19h14a1 1 0 0 0 1-1v-2H4v2a1 1 0 0 0 1 1z" />
    <path d="M8 6a4 4 0 0 1 8 0" />
  </svg>
);

/** Dome / Shul */
export const ShulIcon = ({ size = 20, className = '', strokeWidth = 1.8, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    <path d="M12 3c-3.87 0-7 3.13-7 7v1h14v-1c0-3.87-3.13-7-7-7z" />
    <rect x="5" y="11" width="14" height="9" rx="1" />
    <path d="M9 20v-5h6v5" />
    <line x1="12" y1="3" x2="12" y2="1" />
    <line x1="11" y1="1" x2="13" y2="1" />
    <rect x="9" y="13" width="2" height="3" rx="0.5" />
    <rect x="13" y="13" width="2" height="3" rx="0.5" />
  </svg>
);

/** Book + mortarboard — School */
export const SchoolIcon = ({ size = 20, className = '', strokeWidth = 1.8, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    <path d="M12 3L2 8l10 5 10-5-10-5z" />
    <path d="M7 10.5V16a5 5 0 0 0 10 0v-5.5" />
    <line x1="22" y1="8" x2="22" y2="14" />
    <circle cx="22" cy="14" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** Three people in circle — Community */
export const CommunityIcon = ({ size = 20, className = '', strokeWidth = 1.8, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    <circle cx="12" cy="7" r="2.5" />
    <circle cx="5"  cy="11" r="2" />
    <circle cx="19" cy="11" r="2" />
    <path d="M12 10c-3 0-5 2-5 4v2h10v-2c0-2-2-4-5-4z" />
    <path d="M5 14c-1.5 0-3 1-3 2.5V18h5" />
    <path d="M19 14c1.5 0 3 1 3 2.5V18h-5" />
  </svg>
);

/** Candles — Hachnasas Orchim / Shabbos */
export const CandleIcon = ({ size = 20, className = '', strokeWidth = 1.8, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    {/* Left candle */}
    <rect x="4" y="13" width="4" height="8" rx="1" />
    <line x1="6" y1="13" x2="6" y2="10" />
    <ellipse cx="6" cy="9" rx="1.2" ry="2" fill="currentColor" stroke="none" opacity="0.8" />
    {/* Right candle */}
    <rect x="16" y="13" width="4" height="8" rx="1" />
    <line x1="18" y1="13" x2="18" y2="10" />
    <ellipse cx="18" cy="9" rx="1.2" ry="2" fill="currentColor" stroke="none" opacity="0.8" />
    {/* Center candle (taller) */}
    <rect x="10" y="10" width="4" height="11" rx="1" />
    <line x1="12" y1="10" x2="12" y2="6" />
    <ellipse cx="12" cy="5" rx="1.4" ry="2.5" fill="currentColor" stroke="none" opacity="0.85" />
  </svg>
);

/** Star of David — Events / Featured */
export const StarOfDavidIcon = ({ size = 20, className = '', strokeWidth = 1.8, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    <polygon points="12,3 5,14 19,14" />
    <polygon points="12,21 5,10 19,10" />
  </svg>
);

/** Gift box — alternative Mitzvah icon */
export const GiftIcon = ({ size = 20, className = '', strokeWidth = 1.8, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);