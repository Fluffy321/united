import React from 'react';
import { CheckCircle2, Star, MapPin, Globe, Loader2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CommunityLogo from './CommunityLogo';

const TYPE_COLORS = {
  Shul:     'bg-blue-50 text-blue-700',
  School:   'bg-emerald-50 text-emerald-700',
  Yeshiva:  'bg-violet-50 text-violet-700',
  Seminary: 'bg-pink-50 text-pink-700',
  Camp:     'bg-orange-50 text-orange-700',
  Other:    'bg-slate-100 text-slate-600',
};

export default function CommunityListCard({ community, joined, loading, onJoin, onView }) {
  return (
    <div
      onClick={() => onView(community.id)}
      className="bg-white rounded-[16px] p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <CommunityLogo community={community} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-[#0F1C2E] text-[14px] truncate">{community.name}</span>
          {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />}
          {community.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[community.type] || TYPE_COLORS.Other}`}>
            {community.type}
          </span>
          {(community.address || community.neighborhood) && (
            <span className="flex items-center gap-0.5 text-[11px] text-[#98A2B3]">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[110px]">{community.address ? community.address.split(',')[0] : community.neighborhood}</span>
            </span>
          )}
          {community.follower_count > 0 && (
            <span className="text-[11px] text-[#98A2B3]">{community.follower_count.toLocaleString()} members</span>
          )}
          {community.website && <Globe className="w-3 h-3 text-[#2563EB] flex-shrink-0" />}
        </div>
        {community.description_short && (
          <p className="text-[12px] text-[#667085] line-clamp-1 mt-0.5">{community.description_short}</p>
        )}
      </div>

      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onJoin(e, community); }}>
        <button
          disabled={loading}
          className={`text-[13px] font-semibold h-8 px-3.5 rounded-full transition-colors ${
            joined
              ? 'bg-[#F2F4F7] text-[#344054] hover:bg-[#E9EBF0]'
              : 'bg-[#0F1C2E] text-white hover:bg-[#1e2d42]'
          }`}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : joined ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}