import { AlertCircle, RefreshCw } from 'lucide-react';

export default function QueryError({ message = 'Could not load this content.', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
      <p className="text-[13px] font-bold text-amber-900">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-[12px] font-bold text-amber-800 transition hover:bg-amber-50 active:scale-[0.97]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
