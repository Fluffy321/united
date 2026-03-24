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
  const gradient = getGradient(community.type);

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
      style={{ boxShadow: '0 8px 28px rgba(37,99,235,0.15)', border: '1px solid rgba(226,232,240,0.5)' }}
    >
      <div className={`h-32 bg-gradient-to-r ${gradient} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/15 font-black text-7xl">{getInitials(community.name)}</span>
        </div>
        <div className="absolute top-3 left-3">
          <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ Trending</span>
        </div>
      </div>

      <div className="p-4 -mt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {community.logo_url ? (
              <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[16px] font-black text-slate-700">{getInitials(community.name)}</span>
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); if (!isJoined) onJoin(community); }}
            disabled={isJoining}
            className={`mt-9 rounded-full px-5 py-2 text-[13px] font-bold transition-all shadow-sm ${
              isJoined ? 'bg-slate-100 text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isJoining ? '…' : isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>

        <button onClick={() => onOpen(community.id)} className="w-full text-left mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[18px] font-bold text-slate-900">{community.name}</span>
            {community.is_verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
          </div>
          {community.description_short && (
            <p className="text-[13px] text-slate-500 mt-1 line-clamp-2">{community.description_short}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(community.follower_count || 0).toLocaleString()} members</span>
            <span>•</span>
            <span className="text-green-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" /> Active now
            </span>
          </div>
          <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600 leading-relaxed">
            {community.description_long
              ? community.description_long.slice(0, 120) + (community.description_long.length > 120 ? '…' : '')
              : `See announcements, discussions, and upcoming events from ${community.name}.`}
          </div>
        </button>
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