import React from 'react';
import { User } from 'lucide-react';

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-10 h-10'
  };

  const sizeClass = sizes[size] || sizes.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  // Show profile photo
  if (user?.avatar_url) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-slate-200 shadow-sm ${className}`}>
        <img 
          src={user.avatar_url} 
          alt={user.display_name || user.full_name || ''} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<div class="w-full h-full bg-slate-200 flex items-center justify-center"><svg class="${iconSize} text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>`;
          }}
        />
      </div>
    );
  }

  // Loading state - gray circle with user icon
  return (
    <div className={`${sizeClass} rounded-full bg-slate-200 flex items-center justify-center ${className}`}>
      <User className={`${iconSize} text-slate-400`} strokeWidth={2} />
    </div>
  );
}