import React, { useState } from 'react';
import { X, Heart, Ticket, Users, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paymentsService } from '@/services';
import { toast } from 'sonner';
import PaymentTrustBenefits from './PaymentTrustBenefits';
import { captureError } from '@/lib/analytics';

const DONATION_PRESETS = [10, 25, 50, 100];

const TYPE_CONFIG = {
  donation: {
    icon: Heart,
    color: 'text-red-500',
    bg: 'bg-red-50',
    title: 'Support Our Community',
    subtitle: 'Your donation helps fund essential community services.',
    buttonLabel: 'Donate',
    checkoutType: 'donation',
  },
  event_registration: {
    icon: Ticket,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Event Registration',
    subtitle: 'Complete your registration to secure your spot.',
    buttonLabel: 'Register & Pay',
    checkoutType: 'donation',
  },
  service_payment: {
    icon: Users,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Community Membership',
    subtitle: 'Join as a member and gain access to exclusive benefits.',
    buttonLabel: 'Join Now',
    checkoutType: 'donation',
  },
};

/**
 * PaymentModal — generic payment bottom sheet
 * Props:
 *   open: boolean
 *   onOpenChange: (open: boolean) => void
 *   type: 'donation' | 'event_registration' | 'service_payment'
 *   fixedAmount: number | null   (if set, user cannot change amount)
 *   defaultAmount: number
 *   description: string
 *   relatedEntityId: string | null
 *   relatedEntityType: string | null
 *   quantity: number
 */
export default function PaymentModal({
  open,
  onOpenChange,
  type = 'donation',
  fixedAmount = null,
  defaultAmount = 25,
  description: propDescription = '',
  relatedEntityId,
  relatedEntityType,
  quantity = 1,
}) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.donation;
  const Icon = cfg.icon;

  const [selectedAmount, setSelectedAmount] = useState(defaultAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const finalAmount = fixedAmount ?? (customAmount ? parseFloat(customAmount) : selectedAmount);
  const displayAmount = isNaN(finalAmount) ? 0 : finalAmount;

  const handlePay = async () => {
    if (displayAmount < 1) {
      toast.error('Please enter a valid amount (minimum $1)');
      return;
    }
    if (isLoading) return;

    const desc = propDescription || `${cfg.title} — $${displayAmount.toFixed(2)}`;

    setIsLoading(true);
    try {
      const response = await paymentsService.createCheckout({
        checkoutType: cfg.checkoutType,
        amount: displayAmount,
        purpose: desc,
        relatedEntityId: relatedEntityId ?? null,
        relatedEntityType: relatedEntityType ?? null,
        quantity,
      });

      const checkoutUrl = response.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        // Don't reset loading — user is navigating away
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      captureError(error, { context: 'PaymentModal: start checkout' });
      toast.error('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-40"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <h2 className="text-[18px] font-bold text-slate-900 mb-1">{cfg.title}</h2>
        <p className="text-[13px] text-slate-500 mb-4">{cfg.subtitle}</p>

        {propDescription && (
          <div className="bg-slate-50 rounded-xl p-3 mb-4 text-[13px] text-slate-700 font-medium">
            {propDescription}
          </div>
        )}

        {/* Amount selection */}
        {!fixedAmount ? (
          <div className="space-y-3 mb-5">
            <p className="text-[13px] font-semibold text-slate-700">Select Amount</p>
            {type === 'donation' && (
              <div className="grid grid-cols-4 gap-2">
                {DONATION_PRESETS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                    className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <span className="text-slate-500 font-semibold">$</span>
              <input
                type="number"
                placeholder={type === 'donation' ? 'Custom amount' : 'Enter amount'}
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                min="1"
                step="0.01"
                className="flex-1 bg-transparent text-[14px] text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="mb-5" />
        )}

        {/* Total */}
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <span>Total</span>
            {quantity > 1 && <span className="text-slate-400">({quantity}×)</span>}
          </div>
          <span className="text-[16px] font-bold text-slate-900">${displayAmount.toFixed(2)}</span>
        </div>

        <PaymentTrustBenefits
          showAdminRecord={type === 'event_registration' || type === 'service_payment'}
          className="mb-4"
        />

        <Button
          onClick={handlePay}
          disabled={isLoading || displayAmount < 1}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Opening Checkout…</>
          ) : (
            `${cfg.buttonLabel} · $${displayAmount.toFixed(2)}`
          )}
        </Button>

        <button
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="w-full mt-3 py-2.5 text-[13px] text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-40"
        >
          Cancel
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-3">
          Secure checkout powered by Stripe
        </p>
      </div>
    </div>
  );
}
