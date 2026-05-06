import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { format, parseISO } from 'date-fns';

export default function TransactionHistory({ userId }) {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['user-transactions', userId],
    queryFn: () => dataService.entities.Transaction.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId,
    staleTime: 300000
  });

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-slate-100 text-slate-700'
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-600" />;
    return <RefreshCw className="w-4 h-4 text-yellow-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="bg-white rounded-lg border border-slate-100 p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1">
            <div>{getStatusIcon(tx.status)}</div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">{tx.description}</p>
              <p className="text-xs text-slate-500 mt-1">
                {format(parseISO(tx.created_date), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">${(tx.amount / 100).toFixed(2)}</p>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusBadge(tx.status)}`}>
              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}