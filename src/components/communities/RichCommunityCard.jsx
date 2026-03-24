import React from 'react';
import { ChevronRight, Users, Zap, CheckCircle } from 'lucide-react';

const TYPE_COLORS = {
  Shul: { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  School: { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  Yeshiva: { bg: 'from-purple-500 to-violet-600', light: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  Seminary: { bg: 'from-pink-500 to-rose-500', light: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700' },
  Camp: { bg: 'from-green-500 to-teal-500', light: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  Other: { bg: 'from-slate-500 to-slate-600', light: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
};

function getColors(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.Other;
}

function getInitials(name) {
  return (name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function ActivityDot({ activity }) {
  const isActive = activity === 'Active now';
  return (
    <span className={`flex items-center gap-1 text-[11px] font-medium ${isActive ? 'text-green-600' : 'text-slate-400'}`}>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      {activity}
    </span>
  );
}

export function FeaturedHeroCard({ community, onOpen, onJoin, isJoined, isJoining }) {
  const colors = getColors(community.type);
  return (
    <div
      className="relative overflow-hidden rounded-3xl cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 8px 32px rgba(37,99,235,0.18)' }}
      onClick={() => onOpen(community.id)}
    >
      {community.cover_image_url ? (
        <img src={community.cover_image_url} alt="" className="w-full h-48 object-cover" />
      ) : (
        <div className={`w-full h-48 bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
          <span className="text-white text-5xl font-black opacity-20">{getInitials(community.name)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${colors.badge}`}>
              {community.type}
            </div>
            <h2 className="text-white text-[18px] font-bold leading-tight">{community.name}</h2>
            <p className="text-white/75 text-[12px] mt-1 line-clamp-1">{community.description_short || community.neighborhood}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-white/70 text-[11px] flex items-center gap-1">
                <Users className="w-3 h-3" /> {(community.follower_count || 0).toLocaleString()} members
              </span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span className="text-green-400 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active now
              </span>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); if (!isJoined) onJoin(community); }}
            disabled={isJoining}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold transition-all ${
              isJoined ? 'bg-white/20 text-white border border-white/30' : 'bg-white text-blue-700 shadow-md'
            }`}
          >
            {isJoining ? '…' : isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RichCommunityCard({ community, onOpen, onJoin, onLeave, isJoined, isJoining, activity }) {
  const colors = getColors(community.type);
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
      style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04)', border: '1px solid rgba(226,232,240,0.8)' }}
      onClick={() => onOpen(community.id)}
    >
      {/* Banner strip */}
      <div className={`h-2 bg-gradient-to-r ${colors.bg}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo/Avatar */}
          <div className="flex-shrink-0">
            {community.logo_url ? (
              <img src={community.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-sm`}>
                <span className="text-white font-black text-[14px]">{getInitials(community.name)}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[14px] text-slate-900 truncate">{community.name}</h3>
                  {community.is_verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                </div>
                {community.description_short && (
                  <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1">{community.description_short}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> {(community.follower_count || 0).toLocaleString()}
              </span>
              {community.neighborhood && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[11px] text-slate-400 truncate">{community.neighborhood}</span>
                </>
              )}
              {activity && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <ActivityDot activity={activity} />
                </>
              )}
            </div>

            {/* Type badge + Join */}
            <div className="flex items-center justify-between mt-3">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${colors.badge}`}>
                {community.type}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (isJoined) onLeave?.(community);
                  else onJoin(community);
                }}
                disabled={isJoining}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                  isJoined
                    ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                    : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                }`}
              >
                {isJoining ? '…' : isJoined ? 'Joined' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyRichCommunityCard({ community, onOpen, activity }) {
  const colors = getColors(community.type);
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all flex items-stretch"
      style={{ boxShadow: '0 2px 10px rgba(15,23,42,0.06)', border: '1px solid rgba(226,232,240,0.8)' }}
      onClick={() => onOpen(community.id)}
    >
      {/* Left color bar */}
      <div className={`w-1.5 bg-gradient-to-b ${colors.bg} flex-shrink-0 rounded-l-2xl`} />

      <div className="flex-1 p-4 flex items-center gap-3">
        {community.logo_url ? (
          <img src={community.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-black text-[13px]">{getInitials(community.name)}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[14px] text-slate-900 truncate">{community.name}</span>
            {community.is_verified && <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400">{(community.follower_count || 0).toLocaleString()} members</span>
            {activity && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <ActivityDot activity={activity} />
              </>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
      </div>
    </div>
  );
}