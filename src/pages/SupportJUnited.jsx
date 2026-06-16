import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, CreditCard, Heart, Loader2, RefreshCw } from 'lucide-react';
import { paymentsService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { captureError } from '@/lib/analytics';

// Tier amounts are authoritative on the server.
// $18/$36/$72 = chai / double chai / quadruple chai.
// Annual = 10× monthly (2 months free).
const TIERS = [
  {
    key:           'supporter',
    label:         'Supporter',
    onceAmount:    18,
    monthlyAmount: 18,
    annualAmount:  180,
    annualSavings: 36,
    description:   'Help keep JUnited free and community-first.',
  },
  {
    key:           'builder',
    label:         'Community Builder',
    onceAmount:    36,
    monthlyAmount: 36,
    annualAmount:  360,
    annualSavings: 72,
    popular:       true,
    description:   'Support new tools that help local Jewish communities connect.',
  },
  {
    key:           'champion',
    label:         'JUnited Champion',
    onceAmount:    72,
    monthlyAmount: 72,
    annualAmount:  720,
    annualSavings: 144,
    description:   'Help us build faster while keeping the platform independent.',
  },
];

const TIER_LABELS = {
  supporter: 'Supporter',
  builder:   'Community Builder',
  champion:  'JUnited Champion',
};

const MIN_CUSTOM_AMOUNT = 5;
const SUBSCRIPTION_CHECK_TIMEOUT_MS = 3500;

const BILLING_MODES = [
  { key: 'once',    label: 'One-time' },
  { key: 'monthly', label: 'Monthly'  },
  { key: 'annual',  label: 'Annual'   },
];

function getTierAmount(tier, billingMode) {
  if (billingMode === 'monthly') return tier.monthlyAmount;
  if (billingMode === 'annual')  return tier.annualAmount;
  return tier.onceAmount;
}

function formatPeriodEnd(isoString) {
  if (!isoString) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(isoString));
}

function withTimeout(promise, fallback, timeoutMs = SUBSCRIPTION_CHECK_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = window.setTimeout(() => resolve(fallback), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

export default function SupportJUnited() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [billingMode,   setBillingMode]   = useState('once');
  const [selectedTier,  setSelectedTier]  = useState('builder');
  const [customAmount,  setCustomAmount]  = useState('');
  const [loading,       setLoading]       = useState(false);
  const [activeSub,     setActiveSub]     = useState(null);
  const [subLoading,    setSubLoading]    = useState(false);
  const [showUpgrade,   setShowUpgrade]   = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const customInputRef = useRef(null);

  // Fetch active subscription for logged-in users
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    setSubLoading(true);
    withTimeout(paymentsService.getActiveSubscription(), null)
      .then((subscription) => {
        if (!cancelled) setActiveSub(subscription);
      })
      .catch(() => {
        if (!cancelled) setActiveSub(null);
      })
      .finally(() => {
        if (!cancelled) setSubLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const isCustom    = billingMode === 'once' && selectedTier === 'custom';
  const isRecurring = billingMode !== 'once';
  const preset      = TIERS.find(t => t.key === selectedTier);

  useEffect(() => {
    if (isCustom) customInputRef.current?.focus();
  }, [isCustom]);

  const parsedCustom  = parseFloat(customAmount);
  const customValid   = !isNaN(parsedCustom) && parsedCustom >= MIN_CUSTOM_AMOUNT;
  const displayAmount = isCustom
    ? (customValid ? parsedCustom : null)
    : preset ? getTierAmount(preset, billingMode) : null;

  // Derived display flags
  const showSubscriberCard = !subLoading && !!activeSub && !showUpgrade;
  const showTierPicker     = !subLoading && (!activeSub || showUpgrade);

  const ctaDisabled = loading || portalLoading || (!showUpgrade && isCustom && !customValid);

  function handleBillingModeChange(mode) {
    setBillingMode(mode);
    if (mode !== 'once' && selectedTier === 'custom') setSelectedTier('builder');
    setCustomAmount('');
  }

  function handleShowUpgrade() {
    // Pre-select billing mode to match current subscription interval
    if (activeSub) setBillingMode(activeSub.interval === 'annual' ? 'annual' : 'monthly');
    setShowUpgrade(true);
  }

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await paymentsService.createPortalSession();
      const portalUrl = res.data?.portalUrl;
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        toast.error('Could not open subscription portal — please try again.');
        setPortalLoading(false);
      }
    } catch {
      toast.error('Could not open subscription portal — please try again.');
      setPortalLoading(false);
    }
  };

  const handleSupport = async () => {
    if (!currentUser) { navigate(createPageUrl('Login')); return; }

    // Existing subscriber in upgrade mode → open portal for plan switch
    if (showUpgrade) {
      await handleOpenPortal();
      return;
    }

    if (ctaDisabled) return;
    if (isCustom && !customValid) {
      toast.error(`Please enter an amount of at least $${MIN_CUSTOM_AMOUNT}`);
      customInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      let checkoutUrl;
      if (billingMode === 'once') {
        const payload = isCustom
          ? { checkoutType: 'support_junited', amount: parsedCustom }
          : { checkoutType: 'support_junited', tier: selectedTier };
        const res = await paymentsService.createCheckout(payload);
        checkoutUrl = res.data?.checkoutUrl;
      } else {
        const res = await paymentsService.createSubscriptionCheckout({
          tier: selectedTier, interval: billingMode,
        });
        checkoutUrl = res.data?.checkoutUrl;
      }
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error('Could not start checkout — please try again.');
        setLoading(false);
      }
    } catch (e) {
      captureError(e, { context: 'SupportJUnited: start checkout' });
      toast.error('Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  const ctaLabel = (() => {
    if (showUpgrade) return 'Open portal to switch plan';
    const fmtAmt = displayAmount != null
      ? `$${Number.isInteger(displayAmount) ? displayAmount : displayAmount.toFixed(2)}`
      : null;
    if (billingMode === 'monthly') return fmtAmt ? `Subscribe monthly · ${fmtAmt}/mo` : 'Subscribe monthly';
    if (billingMode === 'annual')  return fmtAmt ? `Subscribe annually · ${fmtAmt}/yr` : 'Subscribe annually';
    return fmtAmt ? `Support JUnited · ${fmtAmt}` : 'Support JUnited';
  })();

  const footerText = showUpgrade
    ? 'Plan changes are managed securely through Stripe · Cancel anytime'
    : billingMode === 'once'
    ? 'Secure checkout by Stripe · One-time · No recurring charges'
    : 'Secure checkout by Stripe · Cancel anytime';

  const renewalDate   = formatPeriodEnd(activeSub?.current_period_end);
  const renewalLabel  = activeSub?.cancel_at_period_end
    ? `Cancels ${renewalDate}`
    : `Renews ${renewalDate}`;

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

        {/* ── Loading skeleton (while checking subscription status) ── */}
        {subLoading && (
          <div className="animate-pulse space-y-3">
            <div className="h-[148px] rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
          </div>
        )}

        {/* ── Active subscriber card ─────────────────────────────── */}
        {showSubscriberCard && (
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5">
            {/* Status header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Heart className="h-5 w-5 fill-emerald-500 text-emerald-500" />
              </div>
              <div>
                <p className="text-[14px] font-black text-emerald-800">You're supporting JUnited</p>
                <p className="text-[13px] font-semibold text-emerald-700">
                  {TIER_LABELS[activeSub.tier] ?? activeSub.tier}
                  {' · '}
                  {activeSub.interval === 'annual' ? 'Annual' : 'Monthly'}
                </p>
              </div>
            </div>

            {/* Past-due payment warning */}
            {activeSub.status === 'past_due' && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <p className="text-[12px] font-semibold text-amber-700">
                  Payment issue — please update your payment method
                </p>
              </div>
            )}

            {/* Renewal / cancellation date */}
            {renewalDate && (
              <p className="mb-4 text-[12.5px] text-emerald-600">{renewalLabel}</p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-[14px] font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
              >
                {portalLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening…</>
                  : <><CreditCard className="h-4 w-4" /> Manage or cancel</>}
              </button>
              <button
                onClick={handleShowUpgrade}
                className="py-1.5 text-center text-[13px] font-semibold text-slate-500 transition hover:text-slate-800"
              >
                Upgrade or switch tier →
              </button>
            </div>
          </div>
        )}

        {/* ── Tier picker (new subscribers, or upgrade mode) ─────── */}
        {showTierPicker && (
          <>
            {/* Upgrade mode banner */}
            {showUpgrade && activeSub && (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div>
                  <p className="text-[13px] font-bold text-blue-800">Switching from your current plan</p>
                  <p className="text-[11.5px] leading-relaxed text-blue-600">
                    Select a tier — you'll complete the switch in Stripe's secure portal.
                  </p>
                </div>
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="mt-0.5 shrink-0 text-[12px] font-bold text-blue-500 transition hover:text-blue-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Billing mode toggle */}
            <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
              {BILLING_MODES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleBillingModeChange(key)}
                  className={`relative flex-1 rounded-xl py-2 text-[13px] font-bold transition-all ${
                    billingMode === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                  {key === 'annual' && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white leading-none">
                      SAVE
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tier cards */}
            <div className="space-y-2.5">
              {TIERS.map(t => {
                const selected = selectedTier === t.key;
                const amount   = getTierAmount(t, billingMode);
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
                        <span className="text-[22px] font-black leading-none">${amount}</span>
                        {billingMode === 'monthly' && <p className="text-[10px] text-slate-400">/mo</p>}
                        {billingMode === 'annual'  && <p className="text-[10px] text-slate-400">/yr</p>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13.5px] font-bold leading-tight ${selected ? 'text-rose-700' : 'text-slate-900'}`}>
                          {t.label}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{t.description}</p>
                        {billingMode === 'annual' && (
                          <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                            Save ${t.annualSavings}/yr · 2 months free
                          </p>
                        )}
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

              {/* Custom amount tile — one-time only */}
              {billingMode === 'once' && (
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
                        <div className="mt-1.5 flex items-center gap-1" onClick={e => e.stopPropagation()}>
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
              )}
            </div>

            {/* Recurring callout */}
            {isRecurring && !showUpgrade && (
              <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <p className="text-[12.5px] leading-relaxed text-blue-700">
                  {billingMode === 'monthly'
                    ? 'Billed monthly. Cancel anytime from Settings → Account → Manage Subscription.'
                    : 'Billed once per year. Cancel anytime from Settings → Account → Manage Subscription.'}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="pt-1">
              <button
                onClick={handleSupport}
                disabled={ctaDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-3.5 text-[15px] font-bold text-white transition-all hover:bg-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading || (showUpgrade && portalLoading) ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Opening Checkout…</>
                ) : (
                  <><Heart className="h-4 w-4" /> {ctaLabel}</>
                )}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                {footerText}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
