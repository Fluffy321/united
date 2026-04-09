import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const FEATURED_PRICE = 29;

const REQUIREMENTS = [
  {
    key: 'profile_complete',
    label: 'Complete profile',
    desc: 'Short description and logo are required',
  },
  {
    key: 'active_posts',
    label: 'Active posts',
    desc: 'At least 1 post in the last 7 days',
  },
  {
    key: 'engagement',
    label: 'Real engagement',
    desc: 'At least 3 total comments across recent posts',
  },
  {
    key: 'no_spam',
    label: 'Quality content',
    desc: 'No posts flagged as spam or low-quality',
  },
];

export default function FeaturedEligibilityChecker({ community, onUpgrade }) {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState({});
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!community?.id) return;
    runChecks();
  }, [community?.id]);

  const runChecks = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const recentPosts = await base44.entities.CommunityPost.filter({ community_id: community.id }, '-created_date', 50);
      const postsThisWeek = recentPosts.filter(p => !p.is_seeded && p.created_date >= sevenDaysAgo);

      const totalComments = recentPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);

      // Simple spam heuristic: posts with very short bodies (<10 chars) considered low-quality
      const spamPosts = recentPosts.filter(p => !p.is_seeded && p.body && p.body.trim().length < 10);

      setChecks({
        profile_complete: !!(community.description_short?.trim() && community.logo_url),
        active_posts: postsThisWeek.length >= 1,
        engagement: totalComments >= 3,
        no_spam: spamPosts.length === 0,
      });
    } catch (e) {
      console.error('Eligibility check failed:', e);
    }
    setLoading(false);
  };

  const allPassed = REQUIREMENTS.every(r => checks[r.key]);

  const handleUpgrade = async () => {
    if (!allPassed) {
      toast.error('Please meet all requirements first');
      return;
    }
    setCheckingOut(true);
    try {
      const res = await base44.functions.invoke('create-checkout', {
        amount: FEATURED_PRICE,
        type: 'featured_community',
        description: `Featured Community – ${community.name}`,
        relatedEntityId: community.id,
        relatedEntityType: 'community',
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error('Could not start checkout');
      }
    } catch (e) {
      toast.error('Checkout failed');
    }
    setCheckingOut(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const passedCount = REQUIREMENTS.filter(r => checks[r.key]).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-slate-50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-800">Eligibility Check</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            allPassed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {passedCount}/{REQUIREMENTS.length} passed
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(passedCount / REQUIREMENTS.length) * 100}%`,
              background: allPassed ? '#22c55e' : '#f59e0b',
            }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <div className="space-y-2">
        {REQUIREMENTS.map(req => {
          const passed = checks[req.key];
          return (
            <div
              key={req.key}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              {passed
                ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                : <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              }
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${passed ? 'text-green-800' : 'text-red-800'}`}>{req.label}</p>
                <p className={`text-xs mt-0.5 ${passed ? 'text-green-600' : 'text-red-500'}`}>{req.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade section */}
      {allPassed ? (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-[#0F5ED7] to-[#7B3FE4] rounded-2xl p-4 text-white text-center">
            <Sparkles className="w-7 h-7 mx-auto mb-2 text-amber-300" />
            <p className="font-bold text-base mb-1">You're eligible for Featured!</p>
            <p className="text-sm text-blue-100 mb-3">Get highlighted placement in the community directory</p>
            <div className="text-2xl font-black">${FEATURED_PRICE}<span className="text-base font-normal text-blue-200">/mo</span></div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-[#0F5ED7] to-[#7B3FE4] text-white font-bold h-11 rounded-xl"
            onClick={handleUpgrade}
            disabled={checkingOut}
          >
            {checkingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Upgrade to Featured – ${FEATURED_PRICE}/mo
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Complete all requirements above to unlock Featured placement. The upgrade button will appear once you qualify.
          </p>
        </div>
      )}
    </div>
  );
}