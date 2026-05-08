import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Check } from 'lucide-react';
import { dataService, paymentsService } from '@/services';
import { toast } from 'sonner';
import FeatureStatusNotice, { StatusBadge } from '@/components/common/FeatureStatusNotice';

const TIERS = [
  {
    key: 'supporter',
    label: 'Supporter',
    emoji: '🤝',
    monthly: 5,
    annual: 50,
    perks: ['Our deepest gratitude', 'Supporter badge on your profile', 'Keep JUnited free for all'],
  },
  {
    key: 'champion',
    label: 'Community Champion',
    emoji: '⭐',
    monthly: 10,
    annual: 95,
    popular: true,
    perks: ['Champion badge on your profile', 'Name in monthly community newsletter', 'Warm fuzzy feeling'],
  },
  {
    key: 'patron',
    label: 'Patron',
    emoji: '🏅',
    monthly: 18,
    annual: 170,
    perks: ['Patron badge on your profile', 'Shout-out in community announcements', 'Direct feedback channel to the JUnited team'],
  },
];

export default function SupportJUnited() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [billing, setBilling] = useState('monthly');
  const [selectedTier, setSelectedTier] = useState('champion');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dataService.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const handleSupport = async () => {
    toast.info('Support payments are coming soon. No money was processed.');
    return;

    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    setLoading(true);
    try {
      const res = await paymentsService.createCheckout( {
        checkoutType: 'support_junited',
        billing,
        tier: selectedTier,
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error('Could not start checkout');
      }
    } catch (e) {
      toast.error('Checkout failed: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="font-bold text-slate-900">Support JUnited</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 mb-6 text-white text-center">
          <Heart className="w-10 h-10 mx-auto mb-3 fill-white" />
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
            <h1 className="text-[22px] font-bold">Keep JUnited Free & Independent</h1>
            <StatusBadge>Coming Soon</StatusBadge>
          </div>
          <p className="text-[14px] text-rose-100 leading-relaxed">
            JUnited will never run banner ads or sell your data. If this platform adds value to your Jewish community life, consider supporting it.
          </p>
        </div>

        {/* No features locked callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-800 font-medium mb-5">
          💛 <strong>No features are locked.</strong> All community tools are free to use. This is purely a way to say thank you and help us grow.
        </div>

        <FeatureStatusNotice className="mb-5" title="Support payments are not live yet">
          These tiers are a preview only. No subscription starts and no money is processed.
        </FeatureStatusNotice>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-1 bg-slate-100 rounded-full p-1 mb-4">
          {['monthly', 'annual'].map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-full transition-all capitalize ${
                billing === b ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {b === 'annual' ? 'Annual (save ~17%)' : 'Monthly'}
            </button>
          ))}
        </div>

        {/* Tier cards */}
        <div className="space-y-3 mb-6">
          {TIERS.map(tier => (
            <button
              key={tier.key}
              onClick={() => setSelectedTier(tier.key)}
              className={`w-full text-left border-2 rounded-2xl p-4 transition-all relative ${
                selectedTier === tier.key
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {tier.popular && (
                <span className="absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{tier.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-[14px]">{tier.label}</p>
                  <p className="text-[18px] font-black text-slate-900">
                    ${billing === 'monthly' ? tier.monthly : Math.round(tier.annual / 12)}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                    {billing === 'annual' && (
                      <span className="text-[11px] text-slate-400 ml-1">(${tier.annual}/yr)</span>
                    )}
                  </p>
                </div>
                {selectedTier === tier.key && (
                  <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <ul className="space-y-1">
                {tier.perks.map(perk => (
                  <li key={perk} className="flex items-center gap-2 text-[12px] text-slate-600">
                    <Check className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <button
          onClick={handleSupport}
          disabled
          className="w-full py-3.5 rounded-xl bg-slate-300 text-white font-bold text-[15px] flex items-center justify-center gap-2 cursor-not-allowed transition-all"
        >
          <Heart className="w-4 h-4" />
          Support Payments Coming Soon
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-2">Demo only · no card is charged · no subscription starts</p>
      </div>
    </div>
  );
}
