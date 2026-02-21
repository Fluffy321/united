import React from 'react';
import { CheckCircle2, Globe, Phone, MapPin, Star, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CommunityLogo from './CommunityLogo';

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
    <div className="bg-white border-b border-slate-100">
      {/* Compact top bar: back | logo + name/meta | actions */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </button>

        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-[#E6F0FF] flex items-center justify-center overflow-hidden flex-shrink-0">
          {community.logo_url ? (
            <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#0F5ED7] font-bold text-base">{community.name?.charAt(0)}</span>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-slate-900 text-sm truncate">{community.name}</span>
            {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
            {community.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
            {community.is_seeded && !community.is_claimed && (
              <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1 py-0.5 rounded-full font-medium flex-shrink-0">
                Auto
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className={`${TYPE_COLORS[community.type] || TYPE_COLORS.Other} border-0 text-[10px] px-1.5 py-0`}>
              {community.type}
            </Badge>
            {community.neighborhood && (
              <span className="text-[11px] text-slate-400 truncate">{community.neighborhood}</span>
            )}
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <Users className="w-2.5 h-2.5" />{community.follower_count || 0}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          {isAdmin ? (
            <Button size="sm" variant="outline" onClick={onAdminTools} className="text-xs h-8 px-2.5">
              ⚙️
            </Button>
          ) : !community.is_claimed ? (
            <Button size="sm" variant="outline" onClick={onClaim} className="text-xs h-8 px-2.5 border-slate-200 text-slate-600">
              Claim
            </Button>
          ) : null}
          <Button
            size="sm"
            onClick={onFollow}
            className={`text-xs h-8 px-3 ${isFollowing ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#0F5ED7] text-white hover:bg-[#0D4EB8]'}`}
          >
            {isFollowing ? 'Following' : '+ Follow'}
          </Button>
        </div>
      </div>

      {/* Contact links — only if present */}
      {(community.address || community.phone || community.website) && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {community.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(community.address)}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-100"
            >
              <MapPin className="w-3 h-3" />{community.address}
            </a>
          )}
          {community.phone && (
            <a href={`tel:${community.phone}`}
              className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-100"
            >
              <Phone className="w-3 h-3" />{community.phone}
            </a>
          )}
          {community.website && (
            <a href={community.website} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-[#0F5ED7] bg-[#E6F0FF] rounded-lg px-2.5 py-1 hover:bg-[#D0E4FF]"
            >
              <Globe className="w-3 h-3" />Website
            </a>
          )}
        </div>
      )}
    </div>
  );
}