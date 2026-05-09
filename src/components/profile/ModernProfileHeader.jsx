import React from 'react';
import { Award, MapPin, Settings } from 'lucide-react';
import { differenceInDays, differenceInHours, format, parseISO } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';

/* Shabbat Gold → soft cream gradient — used when no cover photo is set */
const FALLBACK_COVER_STYLE = {
  background: 'linear-gradient(135deg, #D4AF37 0%, #E8D07A 40%, #F5EDD5 72%, #FDFCF8 100%)',
};

/* Subtle geometric pattern overlay (SVG data URI) rendered on top of the gradient */
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

export default function ModernProfileHeader({ user, isOwnProfile, onMessage, onReport, onBlock, onSettings, onLocationClick }) {
  const since = memberSince(user.created_date);
  const neighborhood = user.cityPreset || user.location_text;
  const bio = user.bio;

  return (
    <div className="px-3 pt-3">
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

        {/* ── Cover photo / Shabbat Gold gradient header ── */}
        <div
          className="relative h-[200px]"
          style={
            user.cover_url
              ? { backgroundImage: `url(${user.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { ...FALLBACK_COVER_STYLE, backgroundImage: PATTERN_OVERLAY }
          }
        >
          {/* Bottom vignette — softens the transition into the white card body */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Settings button — top-right */}
          {isOwnProfile && onSettings && (
            <button
              onClick={onSettings}
              className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-2xl border border-white/30 bg-black/25 px-3 py-2 text-[12px] font-black text-white backdrop-blur-sm transition active:scale-95"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          )}
        </div>

        {/* ── Avatar + name row (avatar overlaps the cover bottom by ~40px) ── */}
        <div className="px-4 pb-0">
          <div className="-mt-10 flex items-end gap-3">

            {/* Avatar with white border and member badge */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-[22px] border-4 border-white bg-white shadow-xl">
                <UserAvatar user={user} size="xl" className="!w-full !h-full !rounded-none" />
              </div>

              {/* Member badge — bottom-right corner of avatar */}
              <div
                className="absolute -bottom-1 -right-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white shadow-md ring-[1.5px] ring-[#D4AF37]"
                title={since ? `Member since ${since}` : 'Verified Community Member'}
              >
                <Award className="h-3 w-3 text-amber-500" />
              </div>
            </div>

            {/* Display name — visible at same level as avatar bottom while it overlaps */}
            <div className="min-w-0 pb-1 flex-1">
              <h1 className="truncate text-xl font-black leading-tight text-slate-900">
                {user.display_name || user.full_name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-[13px] font-semibold text-slate-400">
                @{user.username || user.display_name?.toLowerCase().replace(/[^a-z0-9]+/g, '') || `member${String(user.id || '').slice(0, 6)}`}
              </p>
            </div>
          </div>

          {/* ── Bio ── */}
          {bio && (
            <p className="mt-3 text-[14px] leading-relaxed text-slate-700 line-clamp-3">
              {bio}
            </p>
          )}

          {/* ── Neighborhood tag ── */}
          {neighborhood && (
            <button
              onClick={onLocationClick}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-95"
            >
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              {neighborhood}
            </button>
          )}

          {/* Member since — small muted line */}
          {since && (
            <p className="mt-1.5 text-[11px] text-slate-400">
              Member since {since}
            </p>
          )}
        </div>

        {/* ── Badges strip ── */}
        <div className="flex flex-wrap gap-1.5 px-4 py-3 pt-3">
          {user.age_range === '13-17' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              👤 Teen
            </span>
          )}
          {user.is_verified && user.verified_type && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
              ✓ Verified {user.verified_type}
            </span>
          )}
          {(user.current_streak || 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
              🔥 {user.current_streak} Day Streak
            </span>
          )}
          {(user.communities_joined_count || 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
              🏘️ Community Member
            </span>
          )}
          {(() => {
            const a = getActivityLabel(user);
            return a ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${a.color}`}>
                🕐 {a.label}
              </span>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
