import React from 'react';
import { EyeOff, Minus, MoreHorizontal, Plus } from 'lucide-react';

const ACTIONS = [
  { id: 'more', label: 'More like this', Icon: Plus },
  { id: 'less', label: 'Less like this', Icon: Minus },
  { id: 'hide', label: 'Hide this subject', Icon: EyeOff },
];

export default function HomePreferenceReason({ reason = '', onPreference }) {
  return (
    <div className="relative">
      {reason && (
        <p className="mt-1.5 px-1 text-[9px] font-bold leading-tight text-slate-500">
          {reason}
        </p>
      )}
      <details className="group absolute right-1 top-[-47px] z-20">
        <summary aria-label="Tune this recommendation" className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-[0_4px_14px_rgba(15,28,46,0.18)] [&::-webkit-details-marker]:hidden">
          <MoreHorizontal className="h-5 w-5" />
        </summary>
        <div className="absolute right-0 top-12 w-[190px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_38px_rgba(15,28,46,0.2)]">
          {ACTIONS.map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => onPreference?.(id)} className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[12px] font-black text-slate-700 hover:bg-slate-50">
              <Icon className="h-4 w-4 text-[#2861E8]" />
              {label}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
