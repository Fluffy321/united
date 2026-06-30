import React from 'react';
import { Award, BadgeCheck, CalendarDays, Clock3, Flame, Home, MapPin, ShieldCheck } from 'lucide-react';
import { differenceInDays, differenceInHours, format, parseISO } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';

const FALLBACK_COVER_IMAGE = 'linear-gradient(135deg, #2563EB 0%, #6D5DF6 42%, #D4AF37 100%)';

const PATTERN_OVERLAY = `url("data:image/svg+xml,%3Csvg width='28' height='28' viewBox='0 0 28 28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 0l3.5 6h7L21 9.5l2 6.5-9-3.5-9 3.5 2-6.5L3.5 6h7z' fill='%23ffffff' fill-opacity='0.08'/%3E%3C/svg%3E")`;

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
  if (hrs < 48) return { label: 'Active this week', color: 'bg-emerald-100 text-emerald-700' };
  if (days < 7) return { label: `Active ${days}d ago`, color: 'bg-slate-100 text-slate-500' };
  return { label: `Last seen ${days}d ago`, color: 'bg-slate-100 text-slate-400' };
}

export default function ModernProfileHeader({ user, isOwnProfile = false, onLocationClick }) {
  const since = memberSince(user.created_date);
  const neighborhood = user.cityPreset || user.location_text;
  const bio = user.bio;
  const handle = user.username || user.display_name?.toLowerCase().replace(/[^a-z0-9]+/g, '') || `member${String(user.id || '').slice(0, 6)}`;

  return (
    <>
      <div
        className="graphic-stripes relative h-[112px] overflow-hidden sm:h-[124px]"
        style={
          user.cover_url
            ? { backgroundImage: `url(${user.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { backgroundImage: `${PATTERN_OVERLAY}, ${FALLBACK_COVER_IMAGE}` }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
        <div className="absolute -left-10 -top-14 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-8 bottom-2 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="px-4 pb-3">
        <div className="-mt-9 flex items-end gap-3">
          <div className="relative shrink-0">
            <div className="h-20 w-20 overflow-hidden rounded-[24px] border-4 border-white bg-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]">
              <UserAvatar user={user} size="xl" className="!h-full !w-full !rounded-none" />
            </div>

            <div
              className="absolute -bottom-1 -right-1.5 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-white shadow-md ring-[1.5px] ring-[#D4AF37]"
              title={since ? `Member since ${since}` : 'JUnited member'}
            >
              <Award className="h-3.5 w-3.5 text-amber-500" />
            </div>
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-[22px] font-black leading-tight text-slate-950">
                {user.display_name || user.full_name?.split(' ')[0] || 'User'}
              </h1>
              {user.is_verified && (
                <BadgeCheck className="h-[18px] w-[18px] shrink-0 text-blue-600" />
              )}
            </div>
            <p className="truncate text-[13px] font-bold text-slate-400">
              @{handle}
            </p>
          </div>
        </div>

        {bio ? (
          <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-slate-700">
            {bio}
          </p>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-400">
            {isOwnProfile ? 'Add a short bio so people know what circles, causes, and communities matter to you.' : 'This member has not added a bio yet.'}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {neighborhood && (
            <button
              onClick={onLocationClick}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[12px] font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95"
            >
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              {neighborhood}
            </button>
          )}

          {since && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-bold text-slate-500">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              Since {since}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.age_range === '13-17' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              <ShieldCheck className="h-3 w-3" />
              Teen
            </span>
          )}
          {user.is_verified && user.verified_type && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
              <BadgeCheck className="h-3 w-3" />
              Verified {user.verified_type}
            </span>
          )}
          {(user.current_streak || 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
              <Flame className="h-3 w-3" />
              {user.current_streak} Day Streak
            </span>
          )}
          {(user.communities_joined_count || 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
              <Home className="h-3 w-3" />
              {user.communities_joined_count} {user.communities_joined_count === 1 ? 'Community' : 'Communities'}
            </span>
          )}
          {!isOwnProfile && (() => {
            const a = getActivityLabel(user);
            return a ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${a.color}`}>
                <Clock3 className="h-3 w-3" />
                {a.label}
              </span>
            ) : null;
          })()}
        </div>
      </div>
    </>
  );
}
