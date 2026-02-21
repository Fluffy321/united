import React, { useState } from 'react';

const TYPE_COLORS = {
  Shul:     { bg: 'bg-blue-100',   text: 'text-blue-700' },
  School:   { bg: 'bg-green-100',  text: 'text-green-700' },
  Yeshiva:  { bg: 'bg-purple-100', text: 'text-purple-700' },
  Seminary: { bg: 'bg-pink-100',   text: 'text-pink-700' },
  Camp:     { bg: 'bg-orange-100', text: 'text-orange-700' },
  Other:    { bg: 'bg-slate-100',  text: 'text-slate-600' },
};

/**
 * Renders a community logo with clean letter-avatar fallback.
 * If logo_url is set (Clearbit or upload) → render img.
 * On error or no logo → show first letter of name with type-colored background.
 */
export default function CommunityLogo({ community, size = 'md', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizes = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
  };
  const textSizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };

  const colors = TYPE_COLORS[community?.type] || TYPE_COLORS.Other;
  const letter = community?.name?.charAt(0)?.toUpperCase() || '?';
  const showImage = community?.logo_url && !imgFailed;

  return (
    <div className={`${sizes[size] || sizes.md} flex items-center justify-center overflow-hidden flex-shrink-0 ${showImage ? 'bg-white border border-slate-100' : colors.bg} ${className}`}>
      {showImage ? (
        <img
          src={community.logo_url}
          alt={community.name}
          className="w-full h-full object-contain p-0.5"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className={`font-bold select-none ${textSizes[size] || textSizes.md} ${colors.text}`}>
          {letter}
        </span>
      )}
    </div>
  );
}