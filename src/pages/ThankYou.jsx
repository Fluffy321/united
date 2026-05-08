import React, { useEffect, useState } from 'react';
import { CheckCircle2, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { dataService } from '@/services';

export default function ThankYou() {
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        const user = await dataService.auth.me();
        const transactions = await dataService.entities.Transaction.filter(
          { user_id: user.id, status: 'completed' },
          '-created_date',
          1
        );
        if (transactions.length > 0) {
          setTransaction(transactions[0]);
        }
      } catch (error) {
        console.error('Failed to load transaction:', error);
      }
      setIsLoading(false);
    };

    loadTransaction();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Thank You!</h1>
        <p className="text-slate-600 mb-6">
          Your payment has been received successfully. Thank you for supporting our community.
        </p>

        {transaction && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Amount</span>
                <span className="font-semibold text-slate-900">${parseFloat(transaction.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Type</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {transaction.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Order ID</span>
                <span className="font-mono text-xs text-slate-500">{transaction.order_id}</span>
              </div>
            </div>
          </div>
        )}

        <Link to={createPageUrl('Feed')}>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}