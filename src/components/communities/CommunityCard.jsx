import React from 'react';
import { MapPin, Phone, Globe, CheckCircle2, Star, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const TYPE_COLORS = {
  Shul:     'bg-blue-100 text-blue-700',
  School:   'bg-green-100 text-green-700',
  Yeshiva:  'bg-purple-100 text-purple-700',
  Seminary: 'bg-pink-100 text-pink-700',
  Camp:     'bg-orange-100 text-orange-700',
  Other:    'bg-slate-100 text-slate-600',
};

export default function CommunityCard({ community, onView, onClaim }) {
  return (
    <div
      className="bg-white border-b border-slate-100 last:border-b-0 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
      onClick={() => onView(community)}
    >
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-[#E6F0FF] flex items-center justify-center overflow-hidden border border-slate-100">
          {community.logo_url ? (
            <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#0F5ED7] font-bold text-lg">{community.name?.charAt(0)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="font-bold text-slate-900 text-sm truncate">{community.name}</span>
            {community.is_claimed && (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            )}
            {community.is_featured && (
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className={`${TYPE_COLORS[community.type] || TYPE_COLORS.Other} border-0 text-[10px] font-semibold px-1.5 py-0`}>
              {community.type}
            </Badge>
            <span className="text-xs text-slate-400">{community.neighborhood}</span>
          </div>

          {community.address && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{community.address}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {community.phone && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Phone className="w-3 h-3" />{community.phone}
              </span>
            )}
            {community.website && (
              <span className="flex items-center gap-1 text-xs text-[#0F5ED7]">
                <Globe className="w-3 h-3" />Website
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {!community.is_claimed ? (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 border-slate-200 text-slate-600 hover:border-[#0F5ED7] hover:text-[#0F5ED7]"
              onClick={e => { e.stopPropagation(); onClaim(community); }}
            >
              Claim
            </Button>
          ) : (
            <Badge className="bg-blue-50 text-blue-700 border-0 text-[10px]">Claimed</Badge>
          )}
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      </div>
    </div>
  );
}