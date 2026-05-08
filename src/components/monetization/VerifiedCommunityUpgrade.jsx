import React, { useState } from 'react';
import { Shield, Bell, BarChart2, Pin, Users, Sparkles, Check } from 'lucide-react';
import { dataService, paymentsService } from '@/services';
import { toast } from 'sonner';
import FeatureStatusNotice, { StatusBadge } from '@/components/common/FeatureStatusNotice';

const TIERS = [
  {
    key: 'small',
    label: 'Small',
    sublabel: 'Under 100 members',
    monthly: 19,
    annual: 179,
    color: 'from-blue-500 to-blue-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
  },
  {
    key: 'medium',
    label: 'Medium',
    sublabel: '100–500 members',
    monthly: 39,
    annual: 359,
    color: 'from-indigo-500 to-purple-600',
    border: 'border-indigo-200',
    bg: 'bg-indigo-50',
    popular: true,
  },
  {
    key: 'large',
    label: 'Large',
    sublabel: '500+ members',
    monthly: 69,
    annual: 629,
    color: 'from-purple-600 to-pink-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
  },
];

const FEATURES = [
  { icon: Shield, text: 'Verified badge on your community page' },
  { icon: Bell, text: 'Push announcements to all members' },
  { icon: BarChart2, text: 'Admin analytics dashboard' },
  { icon: Pin, text: 'Unlimited pinned posts' },
  { icon: Users, text: 'More sub-groups + admin roles' },
  { icon: Sparkles, text: 'Custom accent color & cover' },
];

export default function VerifiedCommunityUpgrade({ community, currentUser }) {
  const [billing, setBilling] = useState('monthly');
  const [selectedTier, setSelectedTier] = useState('medium');
  const [loading, setLoading] = useState(false);

  const isVerified = community?.verified_plan && community.verified_plan !== 'none';

  const handleUpgrade = async () => {
    toast.info('Verified upgrades are coming soon. No money was processed.');
    return;

    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    setLoading(true);
    try {
      const res = await paymentsService.createCheckout( {
        checkoutType: 'verified_community',
        billing,
        tier: selectedTier,
        communityId: community.id,
        communityName: community.name,
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error('Could not start checkout. Please try again.');
      }
    } catch (e) {
      toast.error('Checkout failed: ' + e.message);
    }
    setLoading(false);
  };

  if (isVerified) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <p className="font-bold text-slate-900 text-[16px]">Verified Community ✓</p>
        <p className="text-sm text-slate-500 mt-1 capitalize">{community.verified_plan} plan · {community.verified_plan_billing || 'monthly'}</p>
        {community.verified_plan_expires_at && (
          <p className="text-xs text-slate-400 mt-1">
            Renews {new Date(community.verified_plan_expires_at).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F5ED7] to-[#7B3FE4] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" />
          <span className="font-bold text-[16px]">Get Verified</span>
          <StatusBadge>Coming Soon</StatusBadge>
        </div>
        <p className="text-sm text-blue-100">
          Unlock the full toolkit for official shuls, schools, and organizations.
        </p>
      </div>

      {/* Billing toggle */}
      <FeatureStatusNotice title="Checkout is not live yet">
        These plans are a preview. No subscription starts and no card is charged.
      </FeatureStatusNotice>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-1 bg-slate-100 rounded-full p-1">
        {['monthly', 'annual'].map(b => (
          <button
            key={b}
            onClick={() => setBilling(b)}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-full transition-all capitalize ${
              billing === b ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {b === 'annual' ? 'Annual (save 20%)' : 'Monthly'}
          </button>
        ))}
      </div>

      {/* Tier cards */}
      <div className="space-y-2">
        {TIERS.map(tier => (
          <button
            key={tier.key}
            onClick={() => setSelectedTier(tier.key)}
            className={`w-full text-left border-2 rounded-xl p-3.5 transition-all relative ${
              selectedTier === tier.key ? `${tier.border} ${tier.bg}` : 'border-slate-200 bg-white'
            }`}
          >
            {tier.popular && (
              <span className="absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                Most Popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-[14px]">{tier.label}</p>
                <p className="text-xs text-slate-500">{tier.sublabel}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900 text-[18px]">
                  ${billing === 'monthly' ? tier.monthly : Math.round(tier.annual / 12)}
                  <span className="text-xs font-normal text-slate-400">/mo</span>
                </p>
                {billing === 'annual' && (
                  <p className="text-[10px] text-slate-400">${tier.annual}/yr</p>
                )}
              </div>
            </div>
            {selectedTier === tier.key && (
              <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Feature list */}
      <div className="space-y-2">
        {FEATURES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-[13px] text-slate-700">
            <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleUpgrade}
        disabled
        className="w-full py-3 rounded-xl bg-slate-300 text-white font-bold text-[14px] flex items-center justify-center gap-2 cursor-not-allowed transition-all"
      >
        <Shield className="w-4 h-4" />
        Verified Checkout Coming Soon
      </button>
      <p className="text-center text-[11px] text-slate-400">
        Demo only · no subscription starts · no card is charged
      </p>
    </div>
  );
}
