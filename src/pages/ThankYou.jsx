import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Home, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

function formatDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function purposeLabel(purpose) {
  if (!purpose) return 'Contribution';
  if (purpose.startsWith('support_junited_')) {
    const tier = purpose.replace('support_junited_', '');
    return `JUnited ${tier.charAt(0).toUpperCase() + tier.slice(1)} Supporter`;
  }
  if (purpose === 'donation') return 'Donation';
  return purpose.replace(/_/g, ' ');
}

export default function ThankYou() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setIsLoading(false); return; }

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('amount, currency, purpose, tier, status, stripe_session_id, created_at')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (!error && data) setTransaction(data);
      } catch (err) {
        console.error('Failed to load transaction:', err);
      }
      setIsLoading(false);
    };

    load();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isConfirmed = transaction?.status === 'completed';
  const isPending   = !transaction || transaction.status === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isConfirmed ? 'bg-green-100' : 'bg-blue-50'
          }`}>
            {isConfirmed ? (
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            ) : (
              <Clock className="w-12 h-12 text-blue-500" />
            )}
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {isConfirmed ? 'Thank You!' : 'Thank You for Your Support!'}
        </h1>
        <p className="text-slate-600 mb-6">
          {isConfirmed
            ? 'Your contribution has been confirmed. We truly appreciate your support of the JUnited community.'
            : 'Your payment is being processed. This usually takes just a moment — no further action is needed.'}
        </p>

        {/* Transaction details (only when we have data) */}
        {transaction && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500 text-[13px]">Amount</span>
                <span className="font-semibold text-slate-900">{formatDollars(transaction.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[13px]">Purpose</span>
                <span className="font-semibold text-slate-900 capitalize text-right max-w-[60%]">
                  {purposeLabel(transaction.purpose)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[13px]">Status</span>
                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                  isConfirmed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {isConfirmed ? 'Confirmed' : 'Processing'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Note about pending state */}
        {isPending && (
          <p className="text-[12px] text-slate-400 mb-4">
            Payment confirmation is processed securely in the background. You'll receive email confirmation from Stripe once complete.
          </p>
        )}

        <Link to={createPageUrl('Feed')}>
          <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
