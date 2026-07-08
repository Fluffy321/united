import React from 'react';
import { Users, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';



export default function MyCommunitiesTab({ communities, isLoading, onViewCommunity, onBrowse }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="app-empty-state">
        <div className="app-empty-state-icon"><Users className="h-6 w-6" /></div>
        <p className="app-empty-state-title">No communities yet</p>
        <p className="app-empty-state-body">Join communities to see them here.</p>
        <Button onClick={onBrowse} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
          Browse Communities
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      {communities.map(community => (
        <div
          key={community.id}
          onClick={() => onViewCommunity(community.id)}
          className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-[#EEF4FF] flex items-center justify-center overflow-hidden border border-slate-100">
            {community.logo_url
              ? <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-[#0F5ED7] font-bold text-lg">{community.name?.charAt(0)}</span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-bold text-slate-900 text-sm truncate">{community.name}</span>
              {community.is_claimed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
            </div>
            {community.neighborhood && (
              <div className="flex items-center gap-0.5 text-xs text-slate-400 mb-1">
                <MapPin className="w-3 h-3" />{community.neighborhood}
              </div>
            )}
            {community.follower_count > 0 && (
              <span className="text-xs text-slate-400">{community.follower_count} followers</span>
            )}
          </div>

          <div className="flex-shrink-0">
            <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-1 rounded-full">Member</span>
          </div>
        </div>
      ))}
    </div>
  );
}