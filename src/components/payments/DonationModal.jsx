import React, { useState } from 'react';
import { X, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function DonationModal({ open, onOpenChange }) {
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [isLoading, setIsLoading] = useState(false);

  const handleDonate = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!amount || amount < 1) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('create-checkout', {
        amount: amount,
        type: 'donation',
        description: `Donation to United Community - $${amount.toFixed(2)}`
      });

      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      toast.error('Failed to initiate payment');
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-slate-900">Support Our Community</h2>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Your donation helps us continue providing essential community services.
        </p>

        <div className="space-y-4 mb-6">
          <label className="text-sm font-semibold text-slate-900">Select Amount</label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map(amount => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                className={`py-3 rounded-lg font-semibold transition-all ${
                  selectedAmount === amount && !customAmount
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>

          <div className="relative">
            <label className="text-sm font-semibold text-slate-900 block mb-2">Custom Amount</label>
            <div className="flex items-center">
              <span className="text-lg font-semibold text-slate-600">$</span>
              <Input
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(0);
                }}
                min="1"
                step="0.01"
                className="ml-2"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700">
            <strong>Total:</strong> ${(customAmount ? parseFloat(customAmount) : selectedAmount).toFixed(2)}
          </p>
        </div>

        <Button
          onClick={handleDonate}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Continue to Payment'
          )}
        </Button>

        <button
          onClick={() => onOpenChange(false)}
          className="w-full mt-3 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}