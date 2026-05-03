import React, { useState } from 'react';
import { CreditCard, Heart, Loader2, X, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [18, 36, 54, 100, 180, 360];

export default function CommunityPaymentButton({ community }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('dues');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedAmount = customAmount ? parseFloat(customAmount) : parseFloat(amount);

  const handleCheckout = async () => {
    if (!selectedAmount || selectedAmount <= 0) {
      toast.error('Please select or enter an amount');
      return;
    }
    setLoading(true);
    try {
      const description = type === 'dues'
        ? `${community.name} — Membership Dues`
        : `Donation to ${community.name}`;

      const res = await base44.functions.invoke('create-checkout', {
        amount: selectedAmount.toFixed(2),
        type,
        description,
        relatedEntityId: community.id,
        relatedEntityType: 'Community',
      });

      const checkoutUrl = res.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('No checkout URL returned');

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error(err);
      toast.error('Could not start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
      >
        <CreditCard className="w-3.5 h-3.5" />
        Pay / Donate
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Support {community.name}</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Secure payment integration coming next</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex bg-slate-100 rounded-2xl p-1">
              {[
                { id: 'dues', label: '🏛️ Membership Dues', icon: CreditCard },
                { id: 'donation', label: '❤️ Donation', icon: Heart },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setType(opt.id); setAmount(''); setCustomAmount(''); }}
                  className={`flex-1 py-2 text-[12px] font-semibold rounded-xl transition-all ${
                    type === opt.id ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Preset amounts */}
            <div>
              <p className="text-[12px] font-semibold text-slate-500 mb-2">Select amount</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => { setAmount(String(a)); setCustomAmount(''); }}
                    className={`py-2.5 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${
                      amount === String(a) && !customAmount
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="1"
                placeholder="Custom amount"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount(''); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-[14px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Summary */}
            {selectedAmount > 0 && (
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-700">
                <span className="font-semibold">${selectedAmount.toFixed(2)}</span>
                {' '}— {type === 'dues' ? 'Membership Dues' : 'Donation'} to {community.name}
              </div>
            )}

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={loading || !selectedAmount || selectedAmount <= 0}
              className="w-full py-3 rounded-2xl font-bold text-white text-[15px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              {loading ? 'Redirecting…' : 'Proceed to Checkout'}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              Secure payment integration coming next
            </p>
          </div>
        </div>
      )}
    </>
  );
}
