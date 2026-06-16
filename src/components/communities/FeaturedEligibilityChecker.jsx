import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';
import { captureError } from '@/lib/analytics';

const MIN_FOLLOWERS = 50;
const MIN_WEEKLY_ACTIVITY = 3; // posts + comments combined

export default function FeaturedEligibilityChecker({ community, onEligibilityChecked }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const checkEligibility = async () => {
    if (!community) return;
    setLoading(true);

    try {
      const response = await dataService.functions.invoke('checkCommunityEligibility', { community_id: community.id });
      setResult(response.data);
      onEligibilityChecked?.(response.data);

      if (response.data.is_eligible) {
        toast.success('Community meets featured eligibility!');
      }
    } catch (e) {
      toast.error('Failed to check eligibility');
      captureError(e, { context: 'FeaturedEligibilityChecker: check community eligibility' });
    }

    setLoading(false);
  };

  useEffect(() => {
    if (community) checkEligibility();
  }, [community?.id]);

  if (!result) return null;

  const checks = [
    {
      id: 'profile',
      label: 'Complete profile',
      details: 'Name, description, and image',
      passed: result.reasons.profile_complete,
    },
    {
      id: 'followers',
      label: `Minimum ${MIN_FOLLOWERS} members`,
      details: `Currently ${community.follower_count || 0} members`,
      passed: result.reasons.follower_count_min,
    },
    {
      id: 'activity',
      label: `Weekly activity (${MIN_WEEKLY_ACTIVITY}+ posts/comments)`,
      details: `${(result.reasons.weekly_posts || 0)} posts, ${(result.reasons.weekly_comments || 0)} comments this week`,
      passed: result.reasons.weekly_activity_sufficient,
    },
    {
      id: 'quality',
      label: 'No spam or low-quality content',
      details: 'Moderation review passed',
      passed: !result.reasons.spam_flagged,
    },
  ];

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-4 border ${result.is_eligible ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-start gap-3">
          {result.is_eligible ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className={`font-bold text-sm ${result.is_eligible ? 'text-green-900' : 'text-blue-900'}`}>
              {result.is_eligible ? '✨ Eligible for Featured Status' : '📋 Review eligibility'}
            </h3>
            <p className={`text-xs mt-1 ${result.is_eligible ? 'text-green-700' : 'text-blue-700'}`}>
              {result.is_eligible
                ? 'Your community qualifies! Pay to become featured and get top placement.'
                : 'Complete the requirements below to unlock featured status.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {checks.map(check => (
          <div key={check.id} className={`flex items-start gap-3 p-3 rounded-xl border ${check.passed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${check.passed ? 'bg-green-600' : 'bg-slate-300'}`}>
              {check.passed && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${check.passed ? 'text-green-900' : 'text-slate-700'}`}>{check.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{check.details}</p>
            </div>
          </div>
        ))}
      </div>

      {result.is_eligible && (
        <div className="pt-2">
          <button
            onClick={() => {
              toast.info('Featured checkout coming soon');
              // Integrate with payment provider
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Become Featured ($29/month)
          </button>
          <p className="text-xs text-slate-500 text-center mt-2">1 hero slot (top) • Boosted visibility • Featured badge</p>
        </div>
      )}
    </div>
  );
}