import React from 'react';
import { Trophy, Users, Sparkles } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

export default function CommunityWinsCard({ weeklyStats }) {
  if (!weeklyStats) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-bold text-slate-900">Community Wins This Week</h2>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">{weeklyStats.mitzvahs_completed}</div>
          <div className="text-xs text-slate-600">Mitzvahs Done</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">{weeklyStats.new_users}</div>
          <div className="text-xs text-slate-600">New Members</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">{weeklyStats.total_posts}</div>
          <div className="text-xs text-slate-600">Posts Shared</div>
        </div>
      </div>

      {weeklyStats.top_helpers?.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-slate-700 mb-2">Top Helpers</div>
          <div className="flex gap-2">
            {weeklyStats.top_helpers.slice(0, 5).map((helper, i) => (
              <div key={i} className="flex flex-col items-center">
                <UserAvatar user={helper} size="sm" />
                <div className="text-xs text-slate-600 mt-1">{helper.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}