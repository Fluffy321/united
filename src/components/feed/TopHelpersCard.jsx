import React from 'react';
import { Award } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';

const BADGES = {
  first_mitzvah: { emoji: '🌟', label: 'First Mitzvah', color: 'bg-blue-100 text-blue-700' },
  weekly_helper: { emoji: '⚡', label: 'Weekly Helper', color: 'bg-purple-100 text-purple-700' },
  community_helper: { emoji: '🏆', label: 'Community Helper', color: 'bg-green-100 text-green-700' }
};

export default function TopHelpersCard({ helpers }) {
  if (!helpers || helpers.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-indigo-600" />
        <h2 className="text-base font-bold text-slate-900">Top Helpers This Week</h2>
      </div>
      
      <div className="space-y-3">
        {helpers.slice(0, 5).map((helper, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-slate-400">{i + 1}</div>
              <UserAvatar user={helper} size="sm" />
              <div>
                <div className="font-semibold text-slate-900">{helper.display_name || helper.full_name}</div>
                <div className="text-xs text-slate-500">{helper.count} mitzvahs</div>
              </div>
            </div>
            {helper.badges?.map((badge, j) => (
              <Badge key={j} className={`text-xs ${BADGES[badge]?.color || ''}`}>
                {BADGES[badge]?.emoji} {BADGES[badge]?.label}
              </Badge>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}