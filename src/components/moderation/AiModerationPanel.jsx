import React from 'react';
import { CheckCircle2, Clock3, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react';
import AiReviewCard from './AiReviewCard';

function HealthStat({ children, tone = 'slate' }) {
  const colors = {
    slate: 'border-slate-200 bg-white text-slate-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${colors[tone]}`}>{children}</span>;
}

export default function AiModerationPanel({ title, items = [], health = {}, error = null, onRetry, onDecision, busyJobId = null }) {
  return (
    <section aria-label={title} className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Queue health</p>
            <p className="text-sm font-bold text-navy">AI suggests. You decide.</p>
          </div>
          <ShieldAlert className="h-5 w-5 text-blue-700" aria-hidden="true" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          <HealthStat>{Number(health.pending) || 0} waiting</HealthStat>
          <HealthStat><Clock3 className="mr-1 inline h-3 w-3" />Oldest {Number(health.oldestMinutes) || 0}m</HealthStat>
          <HealthStat tone={health.retrying ? 'amber' : 'slate'}><RefreshCw className="mr-1 inline h-3 w-3" />{Number(health.retrying) || 0} retrying</HealthStat>
          <HealthStat tone={health.failed ? 'red' : 'slate'}>{Number(health.failed) || 0} failed</HealthStat>
        </div>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-red-200 bg-white px-5 py-10 text-center">
          <WifiOff className="mx-auto mb-3 h-9 w-9 text-red-600" aria-hidden="true" />
          <p className="font-black text-navy">Couldn’t load this queue</p>
          <p className="mt-1 text-sm text-slate-500">Your other admin tools are still available.</p>
          <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white">
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" aria-hidden="true" />
          <p className="font-black text-navy">Nothing here right now</p>
          <p className="mt-1 text-sm text-slate-500">New cases will show up here automatically.</p>
        </div>
      ) : (
        items.map((item) => (
          <AiReviewCard
            key={item.id}
            review={item}
            busy={busyJobId === item.id}
            onDecision={onDecision}
          />
        ))
      )}
    </section>
  );
}
