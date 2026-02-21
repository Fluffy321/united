import React from 'react';
import { CheckCircle2, Star, MapPin, Loader2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CommunityLogo from './CommunityLogo';

const TYPE_COLORS = {
  Shul:     'bg-blue-100 text-blue-700',
  School:   'bg-green-100 text-green-700',
  Yeshiva:  'bg-purple-100 text-purple-700',
  Seminary: 'bg-pink-100 text-pink-700',
  Camp:     'bg-orange-100 text-orange-700',
  Other:    'bg-slate-100 text-slate-600',
};


export default function CommunityListCard({ community, joined, loading, onJoin, onView }) {
  return (
    <div
      onClick={() => onView(community.id)}
      className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Logo */}
      <CommunityLogo community={community} size="md" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="font-bold text-slate-900 text-sm truncate">{community.name}</span>
          {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
          {community.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <Badge className={`${TYPE_COLORS[community.type] || TYPE_COLORS.Other} border-0 text-[10px] font-semibold px-1.5 py-0`}>
            {community.type}
          </Badge>
          {community.neighborhood && (
            <span className="flex items-center gap-0.5 text-xs text-slate-400">
              <MapPin className="w-3 h-3" />{community.neighborhood}
            </span>
          )}
          {community.follower_count > 0 && (
            <span className="text-xs text-slate-400">· {community.follower_count.toLocaleString()} members</span>
          )}
        </div>
        {community.description_short && (
          <p className="text-xs text-slate-500 line-clamp-1">{community.description_short}</p>
        )}
        {community.is_seeded && !community.is_claimed && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Auto-generated listing · <span className="underline cursor-pointer">Claim to edit</span>
            </span>
          </div>
        )}
      </div>

      {/* Join button */}
      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onJoin(e, community); }}>
        <Button
          size="sm"
          variant={joined ? 'outline' : 'default'}
          disabled={loading}
          className={`text-xs h-8 px-3 ${joined ? 'border-slate-200 text-slate-600' : 'bg-[#0F5ED7] hover:bg-[#0D4EB8]'}`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : joined ? 'Joined' : 'Join'}
        </Button>
      </div>
    </div>
  );
}