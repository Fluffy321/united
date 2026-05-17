import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Heart, Loader2 } from 'lucide-react';
import { paymentsService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

// Tier amounts are authoritative on the server (create-checkout-session/index.ts).
// $18/$36/$72 = chai / double chai / quadruple chai.
const TIERS = [
  {
    key: 'supporter',
    label: 'Supporter',
    amount: 18,
    description: 'Help keep JUnited free and community-first.',
  },
  {
    key: 'builder',
    label: 'Community Builder',
    amount: 36,
    popular: true,
    description: 'Support new tools that help local Jewish communities connect.',
  },
  {
    key: 'champion',
    label: 'JUnited Champion',
    amount: 72,
    description: 'Help us build faster while keeping the platform independent.',
  },
];

const MIN_CUSTOM_AMOUNT = 5;

export default function SupportJUnited() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [selectedTier, setSelectedTier] = useState('builder');
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const customInputRef = useRef(null);

  const isCustom = selectedTier === 'custom';
  const preset = TIERS.find(t => t.key === selectedTier);

  useEffect(() => {
    if (isCustom) customInputRef.current?.focus();
  }, [isCustom]);

  const parsedCustom = parseFloat(customAmount);
  const customValid = !isNaN(parsedCustom) && parsedCustom >= MIN_CUSTOM_AMOUNT;
  const displayAmount = isCustom ? (customValid ? parsedCustom : null) : preset?.amount;

  const ctaDisabled = loading || (isCustom && !customValid);

  const handleSupport = async () => {
    if (!currentUser) { navigate(createPageUrl('Login')); return; }
    if (ctaDisabled) return;

    if (isCustom && !customValid) {
      toast.error(`Please enter an amount of at least $${MIN_CUSTOM_AMOUNT}`);
      customInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const payload = isCustom
        ? { checkoutType: 'support_junited', amount: parsedCustom }
        : { checkoutType: 'support_junited', tier: selectedTier };

      const res = await paymentsService.createCheckout(payload);
      const checkoutUrl = res.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error('Could not start checkout — please try again.');
        setLoading(false);
      }
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  const ctaLabel = displayAmount != null
    ? `Support JUnited · $${Number.isInteger(displayAmount) ? displayAmount : displayAmount.toFixed(2)}`
    : 'Support JUnited';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-2xl items-center gap-3 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </button>
          <span className="font-bold text-slate-900">Support JUnited</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-center text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Heart className="h-6 w-6 fill-white text-white" />
            </div>
            <h1 className="mb-2 text-[20px] font-bold leading-snug">
              Keep JUnited Free & Independent
            </h1>
            <p className="text-[13px] leading-relaxed text-rose-100">
              No ads. No data sales. No locked features. If JUnited adds value to your Jewish
              community life, consider supporting it.
            </p>
          </div>
        </div>

        {/* No-lock callout */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800">
          💛 <strong>All features stay free.</strong> This is purely a way to say thank you and help us keep building.
        </div>

        {/* Tier cards */}
        <div className="space-y-2.5">
          {TIERS.map(t => {
            const selected = selectedTier === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setSelectedTier(t.key)}
                className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  selected
                    ? 'border-rose-400 bg-rose-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {t.popular && (
                  <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={`w-14 shrink-0 text-center ${selected ? 'text-rose-600' : 'text-slate-700'}`}>
                    <span className="text-[22px] font-black leading-none">${t.amount}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13.5px] font-bold leading-tight ${selected ? 'text-rose-700' : 'text-slate-900'}`}>
                      {t.label}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{t.description}</p>
                  </div>
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                    selected ? 'bg-rose-500' : 'bg-slate-200'
                  }`}>
                    <Check className={`h-3 w-3 text-white transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                </div>
              </button>
            );
          })}

          {/* Custom amount tile */}
          <button
            onClick={() => setSelectedTier('custom')}
            className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${
              isCustom
                ? 'border-rose-400 bg-rose-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-14 shrink-0 text-center font-black text-[22px] leading-none ${isCustom ? 'text-rose-500' : 'text-slate-300'}`}>
                $—
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[13.5px] font-bold leading-tight ${isCustom ? 'text-rose-700' : 'text-slate-900'}`}>
                  Custom Amount
                </p>
                {isCustom ? (
                  <div
                    className="mt-1.5 flex items-center gap-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <span className="text-[14px] font-bold text-slate-500">$</span>
                    <input
                      ref={customInputRef}
                      type="number"
                      min={MIN_CUSTOM_AMOUNT}
                      step="1"
                      placeholder={`${MIN_CUSTOM_AMOUNT}+`}
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      className="w-28 bg-transparent text-[14px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <span className="ml-1 text-[11px] text-slate-400">min ${MIN_CUSTOM_AMOUNT}</span>
                  </div>
                ) : (
                  <p className="mt-0.5 text-[12px] text-slate-500">Choose your own amount.</p>
                )}
              </div>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                isCustom ? 'bg-rose-500' : 'bg-slate-200'
              }`}>
                <Check className={`h-3 w-3 text-white transition-opacity ${isCustom ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
          </button>
        </div>

        {/* CTA */}
        <div className="pt-1">
          <button
            onClick={handleSupport}
            disabled={ctaDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-3.5 text-[15px] font-bold text-white transition-all hover:bg-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Opening Checkout…</>
            ) : (
              <><Heart className="h-4 w-4" /> {ctaLabel}</>
            )}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Secure checkout by Stripe · One-time · No recurring charges
          </p>
        </div>
      </div>
    </div>
  );
}
