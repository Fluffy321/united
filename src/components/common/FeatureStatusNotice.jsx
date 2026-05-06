import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function StatusBadge({ children = 'Demo Only', tone = 'amber', className = '' }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${tones[tone] || tones.amber} ${className}`}>
      {children}
    </span>
  );
}

export default function FeatureStatusNotice({
  title = 'Coming Soon',
  children,
  tone = 'amber',
  className = '',
}) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-[13px] leading-5 ${tones[tone] || tones.amber} ${className}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-black">{title}</p>
          {children && <div className="mt-0.5 font-medium">{children}</div>}
        </div>
      </div>
    </div>
  );
}
