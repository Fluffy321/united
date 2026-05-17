import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Heart, Loader2 } from 'lucide-react';
import { paymentsService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

// Tier amounts are also authoritative on the server (create-checkout-session/index.ts).
// Keep these in sync if you change them.
const TIERS = [
  {
    key: 'supporter',
    label: 'Supporter',
    emoji: '🤝',
    amount: 50,
    perks: ['Our deepest gratitude', 'Supporter badge on your profile', 'Keeps JUnited free for all'],
  },
  {
    key: 'champion',
    label: 'Community Champion',
    emoji: '⭐',
    amount: 95,
    popular: true,
    perks: ['Champion badge on your profile', 'Name in monthly community newsletter', 'Warm fuzzy feeling'],
  },
  {
    key: 'patron',
    label: 'Patron',
    emoji: '🏅',
    amount: 170,
    perks: ['Patron badge on your profile', 'Shout-out in community announcements', 'Direct feedback channel to the JUnited team'],
  },
];

export default function SupportJUnited() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [selectedTier, setSelectedTier] = useState('champion');
  const [loading, setLoading] = useState(false);

  const handleSupport = async () => {
    if (!currentUser) {
      navigate(createPageUrl('Login'));
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const res = await paymentsService.createCheckout({
        checkoutType: 'support_junited',
        tier: selectedTier,
      });
      const checkoutUrl = res.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error('Could not start checkout — please try again.');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Checkout failed. Please try again.');
      setLoading(false);
    }
    // Don't reset loading on success — user is navigating away to Stripe
  };

  const tier = TIERS.find(t => t.key === selectedTier);

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
          <h1 className="text-[22px] font-bold mb-2">Keep JUnited Free & Independent</h1>
          <p className="text-[14px] text-rose-100 leading-relaxed">
            JUnited will never run banner ads or sell your data. If this platform adds value to your Jewish community life, consider supporting it.
          </p>
        </div>

        {/* No features locked callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-800 font-medium mb-5">
          💛 <strong>No features are locked.</strong> All community tools are free to use. This is purely a way to say thank you and help us grow.
        </div>

        {/* Tier cards */}
        <div className="space-y-3 mb-6">
          {TIERS.map(t => (
            <button
              key={t.key}
              onClick={() => setSelectedTier(t.key)}
              className={`w-full text-left border-2 rounded-2xl p-4 transition-all relative ${
                selectedTier === t.key
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {t.popular && (
                <span className="absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-[14px]">{t.label}</p>
                  <p className="text-[20px] font-black text-slate-900">
                    ${t.amount}
                    <span className="text-xs font-normal text-slate-400 ml-1">one-time</span>
                  </p>
                </div>
                {selectedTier === t.key && (
                  <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <ul className="space-y-1">
                {t.perks.map(perk => (
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
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Opening Checkout…</>
          ) : (
            <><Heart className="w-4 h-4" /> Support JUnited · ${tier?.amount}</>
          )}
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-2">
          Secure checkout powered by Stripe · One-time contribution
        </p>
      </div>
    </div>
  );
}
