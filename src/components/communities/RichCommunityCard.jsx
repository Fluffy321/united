import React from 'react';
import { Users, CheckCircle } from 'lucide-react';

const TYPE_GRADIENTS = {
  Shul: 'from-blue-600 via-indigo-500 to-purple-500',
  School: 'from-amber-500 via-orange-400 to-rose-400',
  Yeshiva: 'from-purple-600 via-violet-500 to-indigo-500',
  Seminary: 'from-pink-500 via-rose-400 to-orange-400',
  Camp: 'from-green-500 via-teal-400 to-cyan-500',
  Other: 'from-slate-500 via-slate-400 to-slate-600',
};

const TYPE_BADGE = {
  Shul: 'bg-blue-100 text-blue-700',
  School: 'bg-amber-100 text-amber-700',
  Yeshiva: 'bg-purple-100 text-purple-700',
  Seminary: 'bg-pink-100 text-pink-700',
  Camp: 'bg-green-100 text-green-700',
  Other: 'bg-slate-100 text-slate-700',
};

function getGradient(type) {
  return TYPE_GRADIENTS[type] || TYPE_GRADIENTS.Other;
}

function getBadge(type) {
  return TYPE_BADGE[type] || TYPE_BADGE.Other;
}

function getInitials(name) {
  return (name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getActivityLabel(activity) {
  if (!activity || activity === 'No recent activity') return 'New discussions this week';
  return activity;
}

// Full card used in Discover
export function RichCommunityCard({ community, onOpen, onJoin, onLeave, isJoined, isJoining, activity }) {
  const gradient = getGradient(community.type);

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
      style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04)', border: '1px solid rgba(226,232,240,0.6)' }}
    >
      {/* Banner */}
      <div className={`h-24 bg-gradient-to-r ${gradient}`} />

      <div className="p-4 -mt-8">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {community.logo_url ? (
              <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[16px] font-black text-slate-700">{getInitials(community.name)}</span>
            )}
          </div>

          {/* Join button */}
          <button
            onClick={e => {
              e.stopPropagation();
              if (isJoined) onLeave?.(community);
              else onJoin(community);
            }}
            disabled={isJoining}
            className={`mt-9 rounded-full px-4 py-2 text-[13px] font-bold transition-all ${
              isJoined
                ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
            }`}
          >
            {isJoining ? '…' : isJoined ? 'Joined' : 'Join'}
          </button>
        </div>

        <button onClick={() => onOpen(community.id)} className="w-full text-left mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[17px] font-bold text-slate-900">{community.name}</span>
            {community.is_verified && <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />}
          </div>
          {community.description_short && (
            <p className="text-[13px] text-slate-500 mt-1 line-clamp-2">{community.description_short}</p>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2.5">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(community.follower_count || 0).toLocaleString()} members</span>
            {community.type && (
              <>
                <span>•</span>
                <span className={`px-1.5 py-0.5 rounded-full font-semibold text-[10px] ${getBadge(community.type)}`}>{community.type}</span>
              </>
            )}
            <span>•</span>
            <span>{getActivityLabel(activity)}</span>
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600 leading-relaxed">
            {community.description_long
              ? community.description_long.slice(0, 100) + (community.description_long.length > 100 ? '…' : '')
              : `See announcements, discussions, and upcoming events from ${community.name}.`}
          </div>
        </button>
      </div>
    </div>
  );
}

// Featured hero card at the top of Discover
export function FeaturedHeroCard({ community, onOpen, onJoin, isJoined, isJoining }) {
  if (!community) return null;

  return (
    <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white shadow-lg mb-2">
      <div className="p-6">
        <div className="text-[12px] font-semibold text-white/75 mb-2 uppercase tracking-wide">⭐ Featured Community</div>
        <div className="text-[22px] font-bold leading-tight">{community.name}</div>
        <div className="text-white/80 mt-2 text-[13px] leading-relaxed line-clamp-2">
          {community.description_short || community.description_long || 'An active community you should know about.'}
        </div>

        <div className="flex items-center gap-3 text-[12px] text-white/70 mt-4">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(community.follower_count || 0).toLocaleString()} members</span>
          <span>•</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />Trending now</span>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => onOpen(community.id)}
            className="bg-white text-slate-900 rounded-full px-5 py-2.5 text-[13px] font-bold shadow"
          >
            View Community
          </button>
          {!isJoined && (
            <button
              onClick={e => { e.stopPropagation(); onJoin(community); }}
              disabled={isJoining}
              className="bg-white/20 border border-white/30 text-white rounded-full px-5 py-2.5 text-[13px] font-bold"
            >
              {isJoining ? '…' : 'Join'}
            </button>
          )}
          {isJoined && <span className="text-white/70 text-[12px] font-semibold">✓ You're a member</span>}
        </div>
      </div>
    </div>
  );
}

// Compact card for My Communities tab
export function MyRichCommunityCard({ community, onOpen, activity }) {
  const gradient = getGradient(community.type);

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
      style={{ boxShadow: '0 2px 10px rgba(15,23,42,0.06)', border: '1px solid rgba(226,232,240,0.7)' }}
      onClick={() => onOpen(community.id)}
    >
      <div className={`h-12 bg-gradient-to-r ${gradient}`} />
      <div className="px-4 pb-4 -mt-5 flex items-end gap-3">
        <div className="w-12 h-12 rounded-xl bg-white shadow-md border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {community.logo_url ? (
            <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[13px] font-black text-slate-700">{getInitials(community.name)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[14px] text-slate-900 truncate">{community.name}</span>
            {community.is_verified && <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400">{(community.follower_count || 0).toLocaleString()} members</span>
            {activity && activity !== 'No recent activity' && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className={`text-[11px] font-medium ${activity === 'Active now' ? 'text-green-500' : 'text-slate-400'}`}>
                  {activity === 'Active now' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />}
                  {activity}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="pb-1 text-[11px] font-semibold text-slate-400">Open →</div>
      </div>
    </div>
  );
}