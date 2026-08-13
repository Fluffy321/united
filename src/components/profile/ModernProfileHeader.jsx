import React from 'react';
import { BadgeCheck, CalendarDays, Clock3, Flame, Home, MapPin, ShieldCheck } from 'lucide-react';
import { differenceInDays, differenceInHours, format, parseISO } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';

function memberSince(dateStr) {
  if (!dateStr) return null;
  try {
    return format(parseISO(dateStr), 'MMM yyyy');
  } catch {
    return null;
  }
}

function getActivityLabel(user) {
  const date = user.updated_date || user.created_date;
  if (!date) return null;
  const now = new Date();
  const d = parseISO(date);
  const hrs = differenceInHours(now, d);
  const days = differenceInDays(now, d);
  if (hrs < 48) return { label: 'Active this week', color: 'bg-emerald-50 text-emerald-700' };
  if (days < 7) return { label: `Active ${days}d ago`, color: 'bg-slate-100 text-slate-500' };
  return { label: `Last seen ${days}d ago`, color: 'bg-slate-100 text-slate-400' };
}

export default function ModernProfileHeader({ user, isOwnProfile = false, onLocationClick }) {
  const since = memberSince(user.created_date);
  const neighborhood = user.cityPreset || user.location_text;
  const bio = user.bio;
  const handle = user.username || user.display_name?.toLowerCase().replace(/[^a-z0-9]+/g, '') || `member${String(user.id || '').slice(0, 6)}`;

  return (
    <div className="px-4 pb-3 pt-4">
      <div className="flex min-h-20 items-center gap-3">
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[22px] bg-slate-100 ring-1 ring-slate-200">
          <UserAvatar user={user} size="xl" className="!h-full !w-full !rounded-none" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h1 className="truncate text-[22px] font-black leading-tight tracking-[-0.02em] text-slate-950">
              {user.display_name || user.full_name?.split(' ')[0] || 'User'}
            </h1>
            {user.is_verified && <BadgeCheck className="h-[18px] w-[18px] shrink-0 text-blue-600" />}
          </div>
          <p className="truncate text-[13px] font-bold text-slate-400">@{handle}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {neighborhood && (
              <button
                onClick={onLocationClick}
                className="inline-flex min-h-8 items-center gap-1 rounded-full bg-blue-50 px-2.5 text-[11px] font-bold text-blue-700 transition active:scale-95"
              >
                <MapPin className="h-3 w-3" />
                {neighborhood}
              </button>
            )}
            {since && (
              <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-slate-100 px-2.5 text-[11px] font-bold text-slate-500">
                <CalendarDays className="h-3 w-3" />
                Since {since}
              </span>
            )}
          </div>
        </div>
      </div>

      {bio ? (
        <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-slate-700">{bio}</p>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold leading-relaxed text-slate-400">
          {isOwnProfile ? 'Add a short bio so people know what matters to you.' : 'This member has not added a bio yet.'}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {user.age_range === '13-17' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            <ShieldCheck className="h-3 w-3" /> Teen
          </span>
        )}
        {user.is_verified && user.verified_type && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <BadgeCheck className="h-3 w-3" /> Verified {user.verified_type}
          </span>
        )}
        {(user.current_streak || 0) > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
            <Flame className="h-3 w-3" /> {user.current_streak} day streak
          </span>
        )}
        {(user.communities_joined_count || 0) > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
            <Home className="h-3 w-3" /> {user.communities_joined_count} {user.communities_joined_count === 1 ? 'community' : 'communities'}
          </span>
        )}
        {!isOwnProfile && (() => {
          const activity = getActivityLabel(user);
          return activity ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${activity.color}`}>
              <Clock3 className="h-3 w-3" /> {activity.label}
            </span>
          ) : null;
        })()}
      </div>
    </div>
  );
}
