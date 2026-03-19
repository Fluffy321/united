import React from 'react';
import { ArrowLeft, CheckCircle2, Star, Users, Calendar, HandHeart } from 'lucide-react';
import CommunityLogo from './CommunityLogo';
import InviteLinkButton from './InviteLinkButton';

export default function CommunityHero({ community, isFollowing, isAdmin, onBack, onFollow, onClaim, eventCount, mitzvahCount, actualMemberCount }) {
  const memberCount = actualMemberCount || community.follower_count || 0;

  return (
    <div style={{ background: 'linear-gradient(160deg, #EEF4FF 0%, #F5F7FB 100%)', borderBottom: '1px solid #E0EDFF' }}>
      {/* Back bar */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F1C2E]" />
        </button>
        <span className="text-[13px] text-slate-400 font-medium">Shuls</span>
      </div>

      {/* Hero content */}
      <div className="px-4 pt-2 pb-5">
        <div className="flex items-start gap-4">
          <CommunityLogo community={community} size="lg" />
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-extrabold text-[#0F1C2E] text-[18px] leading-tight">{community.name}</h1>
              {community.is_claimed && <CheckCircle2 className="w-4 h-4 text-[#2563EB] flex-shrink-0" />}
              {community.is_featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />}
            </div>
            {community.neighborhood && (
              <p className="text-[13px] text-slate-500 mt-0.5">{community.neighborhood}</p>
            )}

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-2.5 flex-wrap">
              <div className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
                <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                <span><strong className="text-slate-800">{memberCount.toLocaleString()}</strong> members</span>
              </div>
              <div className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                <span><strong className="text-slate-800">{eventCount}</strong> events</span>
              </div>
              <div className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
                <HandHeart className="w-3.5 h-3.5 text-[#2563EB]" />
                <span><strong className="text-slate-800">{mitzvahCount}</strong> mitzvah</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
         <div className="flex gap-2 mt-4">
           <button
             onClick={onFollow}
             className={`flex-1 h-10 text-[14px] font-bold rounded-xl transition-colors ${
               isFollowing
                 ? 'bg-white border border-[#E0EDFF] text-slate-600 hover:bg-[#EEF4FF]'
                 : 'bg-[#2563EB] text-white hover:bg-[#1d4ed8]'
             }`}
           >
             {isFollowing ? '✓ Joined' : '+ Join Community'}
           </button>
           <InviteLinkButton type="community" id={community.id} name={community.name} />
           {!community.is_claimed && !isAdmin && (
             <button
               onClick={onClaim}
               className="h-10 px-4 text-[13px] font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
             >
               Claim
             </button>
           )}
         </div>
      </div>
    </div>
  );
}