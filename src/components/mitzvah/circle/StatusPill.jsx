import React from 'react';
import { STATUS_CONFIGS } from './shared';

export default function StatusPill({ status }) {
  const { cls, Icon, label } = STATUS_CONFIGS[status] || {
    cls: 'bg-slate-50 text-slate-600 border-slate-200',
    Icon: null,
    label: status,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${cls}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
