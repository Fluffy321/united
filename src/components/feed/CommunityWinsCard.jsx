import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

export default function CommunityWinsCard({ weeklyStats, recentMitzvah }) {
  if (!weeklyStats) return null;

  const formatHelperName = (helper) => {
    const firstName = helper.display_name?.split(' ')[0] || helper.full_name?.split(' ')[0] || 'User';
    const lastName = helper.full_name?.split(' ')[1] || '';
    const lastInitial = lastName ? lastName[0] + '.' : '';
    return `${firstName} ${lastInitial}`;
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-bold text-slate-900">Community Wins This Week</h2>
      </div>

      <p className="text-base text-slate-700 mb-4 font-medium">
        This week our community helped <span className="font-bold text-green-700">{weeklyStats.mitzvahs_completed}</span> {weeklyStats.mitzvahs_completed === 1 ? 'person' : 'people'}.
      </p>

      {recentMitzvah && (
        <div className="bg-white/60 rounded-lg p-3 mb-4 border border-green-100">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Recent mitzvah completed:</p>
              <p className="text-sm text-slate-800 font-medium">{recentMitzvah}</p>
            </div>
          </div>
        </div>
      )}

      {weeklyStats.top_helpers?.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-slate-700 mb-2">Top Helpers</div>
          <div className="space-y-2">
            {weeklyStats.top_helpers.slice(0, 5).map((helper, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2">
                <UserAvatar user={helper} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{formatHelperName(helper)}</p>
                </div>
                <div className="text-sm font-bold text-green-700">{helper.count} {helper.count === 1 ? 'mitzvah' : 'mitzvahs'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}