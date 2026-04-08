import React from 'react';
import { TrendingUp, Users, Eye, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEFAULT_GRADIENTS = [
  'from-blue-600 via-indigo-600 to-violet-700',
  'from-emerald-500 via-teal-600 to-cyan-600',
  'from-rose-500 via-pink-600 to-fuchsia-600',
  'from-amber-500 via-orange-500 to-red-500',
  'from-indigo-600 via-blue-600 to-cyan-500',
];

function getGradient(community, index) {
  if (community.featured_accent_color) {
    return null; // use solid color
  }
  return DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
}

export default function FeaturedCommunityCard({ community, index = 0, isJoined, isJoining, onOpen, onJoin }) {
  const gradient = getGradient(community, index);
  const initials = community.name?.slice(0, 2)?.toUpperCase() || 'CO';

  const handleOpen = () => {
    // Track view
    base44.entities.Community.update(community.id, {
      views_count: (community.views_count || 0) + 1
    }).catch(() => {});
    onOpen(community.id);
  };

  return (
    <div
      onClick={handleOpen}
      className={`relative rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.97] transition-all duration-200`}
      style={
        community.featured_accent_color
          ? { background: community.featured_accent_color }
          : undefined
      }
    >
      {/* Background gradient */}
      {gradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}

      {/* Cover image overlay */}
      {community.cover_image_url && (
        <img
          src={community.cover_image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
      )}

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
      />

      <div className="relative p-5">
        {/* Featured badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
            <span className="text-white text-[10px] font-bold tracking-wider uppercase">Featured</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onJoin(community); }}
            disabled={isJoining}
            className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all active:scale-95 disabled:opacity-60 ${
              isJoined
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white text-blue-700 hover:bg-blue-50'
            }`}
          >
            {isJoining ? '…' : isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>

        {/* Logo + name */}
        <div className="flex items-center gap-3 mb-3">
          {community.logo_url ? (
            <img src={community.logo_url} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-white/30 flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-[15px] border border-white/30 flex-shrink-0">
              {initials}
            </div>
          )}
          <div>
            <h3 className="text-white font-bold text-[16px] leading-tight">{community.name}</h3>
            {community.featured_tagline && (
              <p className="text-white/70 text-[12px] mt-0.5 italic">"{community.featured_tagline}"</p>
            )}
          </div>
        </div>

        {/* Description */}
        {community.description_short && (
          <p className="text-white/80 text-[13px] leading-relaxed mb-4 line-clamp-2">
            {community.description_short}
          </p>
        )}

        {/* Stats bar */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-white/80">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[12px] font-semibold">{(community.follower_count || 0).toLocaleString()}</span>
            <span className="text-[11px] text-white/60">members</span>
          </div>
          {community.views_count > 0 && (
            <div className="flex items-center gap-1.5 text-white/80">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[12px] font-semibold">{(community.views_count || 0).toLocaleString()}</span>
              <span className="text-[11px] text-white/60">views</span>
            </div>
          )}
          {community.joins_this_week > 0 && (
            <div className="flex items-center gap-1.5 text-white/80 ml-auto">
              <TrendingUp className="w-3.5 h-3.5 text-green-300" />
              <span className="text-[12px] font-semibold text-green-300">+{community.joins_this_week} this week</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}