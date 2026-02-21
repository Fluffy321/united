import React, { useState } from 'react';

const TYPE_EMOJI = { Shul: '🕍', School: '📚', Yeshiva: '📖', Seminary: '🎓', Camp: '⛺', Other: '🏛️' };

/**
 * Renders a community logo with graceful fallback.
 * If logo_url is set (from Clearbit or upload) → render img.
 * On 404 / error → fall back to emoji/letter avatar.
 */
export default function CommunityLogo({ community, size = 'md', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizes = {
    sm:  'w-9 h-9 rounded-xl text-base',
    md:  'w-12 h-12 rounded-xl text-xl',
    lg:  'w-16 h-16 rounded-2xl text-2xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  const fallback = TYPE_EMOJI[community?.type] || community?.name?.charAt(0) || '?';

  const showImage = community?.logo_url && !imgFailed;

  return (
    <div className={`${sizeClass} bg-[#EEF4FF] flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 ${className}`}>
      {showImage ? (
        <img
          src={community.logo_url}
          alt={community.name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className={`${size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl'} select-none`}>
          {fallback}
        </span>
      )}
    </div>
  );
}