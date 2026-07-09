import React from 'react';
import { HandHeart } from 'lucide-react';

export default function EmptyState({ title, text, actionLabel, onAction }) {
  return (
    <div className="app-card flex flex-col items-center gap-3 p-8 text-center">
      <HandHeart className="h-10 w-10 text-slate-300" />
      <div>
        <p className="font-black text-slate-950">{title}</p>
        {text && <p className="mt-1 text-[13px] text-slate-500">{text}</p>}
      </div>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="motion-press rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-black text-white">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
