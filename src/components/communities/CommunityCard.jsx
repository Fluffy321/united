import React, { useMemo } from 'react';
import { Loader2, Pin, PinOff, ChevronRight } from 'lucide-react';

const CATEGORY_EMOJI = {
  'Local Life': '📍', 'Local': '📍',
  'Chessed': '❤️',
  'Social': '🏀',
  'Learning': '📚',
  'Institutional': '🏛️',
  'Shul': '🕍',
  'School': '🏫',
  'Camp': '⛺',
  'Other': '🏘️',
};

const BRAND_COLORS = [
  'bg-blue-100', 'bg-purple-100', 'bg-pink-100', 'bg-green-100',
  'bg-orange-100', 'bg-yellow-100', 'bg-indigo-100', 'bg-teal-100'
];

function getColorIndex(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % BRAND_COLORS.length;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getEmoji(item) {
  return CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI[item.type] || '🏘️';
}

export function MyCommunityCard({ community, onOpen, isPinned, onPin, activity }) {
  return (
    <button 
      onClick={() => onOpen(community.id)} 
      className="w-full bg-white rounded-2xl p-3 text-left shadow-sm active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {community.logo_url ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
              <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${BRAND_COLORS[getColorIndex(community.name)]} text-slate-700`}>
              {getInitials(community.name)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[13px] text-slate-900 line-clamp-2">{community.name}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{community.follower_count || 0} members · {activity}</div>
          {community.description_short && (
            <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">{community.description_short}</div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onPin(community.id); }}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isPinned ? (
              <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />
            ) : (
              <PinOff className="w-4 h-4 text-slate-300" />
            )}
          </button>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>
      </div>
    </button>
  );
}

export function DiscoverCommunityCard({ community, onOpen }) {
  return (
    <div 
      onClick={() => onOpen(community.id)}
      className="bg-white rounded-2xl p-3.5 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {community.logo_url ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${BRAND_COLORS[getColorIndex(community.name)]} text-slate-700`}>
              {getInitials(community.name)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[13px] text-slate-900 line-clamp-2">{community.name}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{(community.follower_count || 0) > 0 ? `${community.follower_count} members` : 'New'}</div>
          {community.description_short && (
            <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">{community.description_short}</div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
      </div>
    </div>
  );
}

export function SuggestedCommunityCard({ community, onOpen }) {
  return (
    <div 
      onClick={() => onOpen(community.id)}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-transform border border-blue-100"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {community.logo_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold ${BRAND_COLORS[getColorIndex(community.name)]} text-slate-700`}>
              {getInitials(community.name)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14px] text-slate-900 line-clamp-2">{community.name}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{(community.follower_count || 0) > 0 ? `${community.follower_count} members` : 'New'}</div>
          {community.description_short && (
            <div className="text-[12px] text-slate-700 mt-1.5 line-clamp-2">{community.description_short}</div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
      </div>
    </div>
  );
}