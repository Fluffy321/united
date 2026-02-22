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
    <div className="bg-white" style={{ borderBottom: '1px solid #EAECF0' }}>
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-[#F2F4F7] flex items-center justify-center flex-shrink-0 hover:bg-[#E9EBF0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F1C2E]" />
        </button>

        <CommunityLogo community={community} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#0F1C2E] text-[15px] truncate">{community.name}</span>
            {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />}
            {community.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[community.type] || TYPE_COLORS.Other}`}>
              {community.type}
            </span>
            {community.neighborhood && (
              <span className="text-[11px] text-[#98A2B3]">{community.neighborhood}</span>
            )}
            <span className="flex items-center gap-0.5 text-[11px] text-[#98A2B3]">
              <Users className="w-2.5 h-2.5" />{(community.follower_count || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {isAdmin ? (
            <button onClick={onAdminTools} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F4F7] hover:bg-[#E9EBF0] transition-colors text-sm">
              ⚙️
            </button>
          ) : !community.is_claimed ? (
            <button onClick={onClaim} className="h-8 px-3 text-[13px] font-semibold rounded-full bg-[#F2F4F7] text-[#344054] hover:bg-[#E9EBF0] transition-colors">
              Claim
            </button>
          ) : null}
          <button
            onClick={onFollow}
            className={`h-8 px-3.5 text-[13px] font-semibold rounded-full transition-colors ${
              isFollowing
                ? 'bg-[#F2F4F7] text-[#344054] hover:bg-[#E9EBF0]'
                : 'bg-[#0F1C2E] text-white hover:bg-[#1e2d42]'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
    </div>
  );
}