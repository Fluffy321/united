import React from 'react';
import { CheckCircle2, Globe, Phone, MapPin, Star, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TYPE_COLORS = {
  Shul:     'bg-blue-100 text-blue-700',
  School:   'bg-green-100 text-green-700',
  Yeshiva:  'bg-purple-100 text-purple-700',
  Seminary: 'bg-pink-100 text-pink-700',
  Camp:     'bg-orange-100 text-orange-700',
  Other:    'bg-slate-100 text-slate-600',
};

export default function CommunityDetailHeader({ community, isFollowing, isAdmin, onFollow, onClaim, onAdminTools, onBack }) {
  return (
    <div>
      {/* Cover */}
      <div className="relative">
        <div
          className="h-36 bg-gradient-to-br from-[#E6F0FF] to-[#C7D9FF]"
          style={community.cover_image_url ? {
            backgroundImage: `url(${community.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </button>
      </div>

      {/* Logo + Name */}
      <div className="px-4 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-end justify-between -mt-8 mb-3">
          <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md bg-[#E6F0FF] flex items-center justify-center overflow-hidden">
            {community.logo_url ? (
              <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#0F5ED7] font-bold text-2xl">{community.name?.charAt(0)}</span>
            )}
          </div>

          <div className="flex gap-2">
            {isAdmin ? (
              <Button size="sm" variant="outline" onClick={onAdminTools} className="text-xs h-8">
                ⚙️ Admin
              </Button>
            ) : !community.is_claimed ? (
              <Button size="sm" variant="outline" onClick={onClaim} className="text-xs h-8 border-slate-300">
                Claim Page
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={onFollow}
              className={`text-xs h-8 ${isFollowing ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#0F5ED7] text-white hover:bg-[#0D4EB8]'}`}
            >
              {isFollowing ? 'Following' : '+ Follow'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="font-bold text-slate-900 text-xl">{community.name}</h1>
          {community.is_claimed && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
          {community.is_featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Badge className={`${TYPE_COLORS[community.type] || TYPE_COLORS.Other} border-0 text-xs`}>
            {community.type}
          </Badge>
          <span className="text-sm text-slate-500">{community.neighborhood}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Users className="w-3 h-3" />{community.follower_count || 0} followers
          </span>
        </div>

        {community.rabbi_or_principal && (
          <p className="text-sm text-slate-600 mb-2">👤 {community.rabbi_or_principal}</p>
        )}

        {community.description_short && (
          <p className="text-sm text-slate-600 mb-3">{community.description_short}</p>
        )}

        {/* Contact row */}
        <div className="flex flex-wrap gap-2">
          {community.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(community.address)}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />{community.address}
            </a>
          )}
          {community.phone && (
            <a href={`tel:${community.phone}`}
              className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />{community.phone}
            </a>
          )}
          {community.website && (
            <a href={community.website} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#0F5ED7] bg-[#E6F0FF] rounded-lg px-3 py-1.5 hover:bg-[#D0E4FF] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}