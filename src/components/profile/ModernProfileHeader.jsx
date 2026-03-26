import React from 'react';
import { Settings } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

export default function ModernProfileHeader({ user, isOwnProfile, onMessage, onReport, onBlock, onSettings }) {
  return (
    <div className="relative">
      {/* Gradient header */}
      <div className="relative h-28 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 overflow-hidden">
        <div className="opacity-65 rounded absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-screen blur-3xl" />
        </div>
        {isOwnProfile && onSettings &&
        <button
          onClick={onSettings}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[13px] font-semibold hover:bg-white/30 transition-colors">
          
            <Settings className="w-4 h-4" />
            Settings
          </button>
        }
      </div>

      {/* Avatar + Info row */}
      <div className="px-5 -mt-10 flex items-end gap-4 pb-3">
        <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl bg-white overflow-hidden flex-shrink-0">
          <UserAvatar user={user} size="xl" className="!w-full !h-full !rounded-none" />
        </div>
        <div className="pb-1 min-w-0 flex-1">
          <h1 className="text-xl font-black text-slate-900 leading-tight truncate">
            {user.display_name || user.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-slate-400 font-medium">@{user.username || user.email?.split('@')[0]}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {user.age_range === '13-17' &&
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">👤 Teen</span>
        }
        {user.is_verified &&
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">✓ Verified</span>
        }
        {(user.current_streak || 0) > 0 &&
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-700">🔥 {user.current_streak} Day Streak</span>
        }
        {(user.communities_joined_count || 0) > 0 &&
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">🏘️ Community Member</span>
        }
      </div>
    </div>);

}