import React, { useState } from 'react';
import { X, Heart, Ticket, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import FeatureStatusNotice, { StatusBadge } from '@/components/common/FeatureStatusNotice';

const DONATION_PRESETS = [10, 25, 50, 100];

const TYPE_CONFIG = {
  donation: {
    icon: Heart,
    color: 'text-red-500',
    bg: 'bg-red-50',
    title: 'Support Our Community',
    subtitle: 'Your donation helps fund essential community services.',
    buttonLabel: 'Donate',
  },
  event_registration: {
    icon: Ticket,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Event Registration',
    subtitle: 'Complete your registration to secure your spot.',
    buttonLabel: 'Register & Pay',
  },
  service_payment: {
    icon: Users,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Community Membership',
    subtitle: 'Join as a member and gain access to exclusive benefits.',
    buttonLabel: 'Join Now',
  },
};

/**
 * PaymentModal — unified payment flow
 * Props:
 *   open: boolean
 *   onOpenChange: (open) => void
 *   type: 'donation' | 'event_registration' | 'service_payment'
 *   fixedAmount: number (optional — if set, user can't change amount)
 *   defaultAmount: number (optional)
 *   description: string (optional — pre-filled description)
 *   relatedEntityId: string (optional)
 *   relatedEntityType: string (optional)
 *   quantity: number (optional, default 1)
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
    toast.info('Checkout is coming soon. No money was processed.');
    return;

    if (!displayAmount || displayAmount < 1) {
      toast.error('Please enter a valid amount (minimum $1)');
      return;
    }

    const desc = propDescription || `${cfg.title} — $${displayAmount.toFixed(2)}`;

    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('create-checkout', {
        amount: displayAmount,
        type,
        description: desc,
        relatedEntityId: relatedEntityId || null,
        relatedEntityType: relatedEntityType || null,
        quantity,
      });

      if (response.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Payment error:', error);
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
          <button onClick={() => onOpenChange(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-[18px] font-bold text-slate-900">{cfg.title}</h2>
          <StatusBadge>Coming Soon</StatusBadge>
        </div>
        <p className="text-[13px] text-slate-500 mb-4">{cfg.subtitle}</p>

        <FeatureStatusNotice className="mb-4" title="Checkout is not live yet">
          No money will be processed from this screen. This is a placeholder until the real payment system is connected.
        </FeatureStatusNotice>

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
            {quantity > 1 && <span className="text-slate-400">({quantity}x)</span>}
          </div>
          <span className="text-[16px] font-bold text-slate-900">${displayAmount.toFixed(2)}</span>
        </div>

        <Button
          onClick={handlePay}
          disabled
          className="w-full bg-slate-300 text-white font-bold py-3 rounded-xl text-[14px] cursor-not-allowed"
        >
          Checkout Coming Soon
        </Button>

        <button
          onClick={() => onOpenChange(false)}
          className="w-full mt-3 py-2.5 text-[13px] text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
        >
          Cancel
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-3">
          Demo only · no card is charged
        </p>
      </div>
    </div>
  );
}
