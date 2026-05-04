import React from 'react';
import { MapPin, Settings, Sparkles } from 'lucide-react';
import { differenceInDays, differenceInHours, parseISO } from 'date-fns';

function getActivityLabel(user) {
  const date = user.updated_date || user.created_date;
  if (!date) return null;
  const now = new Date();
  const d = parseISO(date);
  const hrs = differenceInHours(now, d);
  const days = differenceInDays(now, d);
  if (hrs < 48) return { label: 'Active this week', color: 'bg-emerald-100 text-emerald-700' };
  if (days < 7) return { label: `Active ${days}d ago`, color: 'bg-slate-100 text-slate-500' };
  return { label: `Last seen ${days}d ago`, color: 'bg-slate-100 text-slate-400' };
}
import UserAvatar from '@/components/common/UserAvatar';

export default function ModernProfileHeader({ user, isOwnProfile, onMessage, onReport, onBlock, onSettings }) {
  return (
    <div className="px-3 pt-3">
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="relative h-24 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[42px] bg-blue-100/70" />
          <div className="absolute left-4 top-4 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Profile
          </div>
        {isOwnProfile && onSettings &&
        <button
          onClick={onSettings}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700 shadow-sm transition active:scale-95">
          
            <Settings className="w-4 h-4" />
            Settings
          </button>
        }
        </div>

      {/* Avatar + Info row */}
      <div className="px-4 -mt-8 flex items-end gap-3 pb-3 relative z-10">
        <div className="w-20 h-20 rounded-[22px] border-4 border-white shadow-xl bg-white overflow-hidden flex-shrink-0">
          <UserAvatar user={user} size="xl" className="!w-full !h-full !rounded-none" />
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <h1 className="text-xl font-black text-slate-900 leading-tight truncate">
            {user.display_name || user.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-slate-500 font-semibold">@{user.username || user.email?.split('@')[0]}</p>
          {(user.cityPreset || user.location_text) && (
            <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              {user.cityPreset || user.location_text}
            </p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 pb-4 flex flex-wrap gap-1.5">
        {user.age_range === '13-17' &&
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">👤 Teen</span>
        }
        {user.is_verified && user.verified_type &&
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">✓ Verified {user.verified_type}</span>
        }
        {(user.current_streak || 0) > 0 &&
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-700">🔥 {user.current_streak} Day Streak</span>
        }
        {(user.communities_joined_count || 0) > 0 &&
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">🏘️ Community Member</span>
        }
        {(() => { const a = getActivityLabel(user); return a ? <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${a.color}`}>🕐 {a.label}</span> : null; })()}
      </div>
      </div>
    </div>);

}
