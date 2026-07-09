import React from 'react';

export default function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: 'border-blue-100 bg-blue-50/80 text-blue-700',
    amber: 'border-amber-100 bg-amber-50/80 text-amber-700',
    emerald: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
  };
  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wide opacity-75">{label}</p>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-1 text-2xl font-black leading-none">{value}</p>
    </div>
  );
}
