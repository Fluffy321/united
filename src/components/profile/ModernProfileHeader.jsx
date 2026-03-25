import React from 'react';
import UserAvatar from '@/components/common/UserAvatar';

export default function ModernProfileHeader({ user, isOwnProfile, onMessage, onReport, onBlock }) {
  return (
    <div className="relative pb-20">
      {/* Gradient header with blur backdrop */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 overflow-hidden">
        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-[1px] opacity-90" />
        
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-screen blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-screen blur-3xl" />
        </div>
      </div>

      {/* Overlapping profile image section */}
      <div className="relative px-6 -mt-24">
        <div className="relative inline-block">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 blur-xl opacity-40 scale-110 -z-10" />
          
          {/* Avatar with border */}
          <div className="w-36 h-36 rounded-2xl border-4 border-white shadow-2xl bg-white p-0.5 overflow-hidden">
            <UserAvatar user={user} size="xl" className="!w-full !h-full !rounded-none" />
          </div>
        </div>
      </div>

      {/* Name and info section */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">
          {user.display_name || user.full_name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-base text-slate-500 font-medium mb-3">@{user.username || user.email?.split('@')[0]}</p>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {user.age_range === '13-17' && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              👤 Teen
            </span>
          )}
          {user.is_verified && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              ✓ Verified
            </span>
          )}
          {(user.current_streak || 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
              🔥 {user.current_streak} Day Streak
            </span>
          )}
          {(user.communities_joined_count || 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              🏘️ Community Member
            </span>
          )}
        </div>
      </div>
    </div>
  );
}