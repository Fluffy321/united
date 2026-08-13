import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

function CommunitySkeletons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, index) => (
        <div key={index} data-community-skeleton className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="skeleton h-11 w-11 rounded-2xl" />
          <div className="skeleton mt-3 h-3 w-24 rounded" />
          <div className="skeleton mt-2 h-2.5 w-16 rounded" />
          <div className="skeleton mt-4 h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function CommunitiesLoadingRecovery({ timedOut, isError, onRetry, onGoHome }) {
  if (!timedOut && !isError) return <CommunitySkeletons />;

  return (
    <section className="rounded-3xl border border-amber-200 bg-white px-5 py-6 text-center shadow-md" role={isError ? 'alert' : 'status'}>
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
        {isError ? <AlertCircle aria-hidden="true" className="h-5 w-5" /> : <RefreshCw aria-hidden="true" className="h-5 w-5" />}
      </span>
      <h2 className="mt-4 text-[17px] font-black tracking-[-0.025em] text-slate-950">Communities are taking longer than expected</h2>
      <p className="mx-auto mt-2 max-w-[280px] text-[12px] font-semibold leading-relaxed text-slate-500">
        Try loading them again, or return Home and keep using the rest of JUnited.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onGoHome} className="motion-press min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600">
          Go home
        </button>
        <button type="button" onClick={onRetry} className="motion-press min-h-11 rounded-xl bg-blue-600 px-3 text-[12px] font-black text-white shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
          Try again
        </button>
      </div>
    </section>
  );
}
