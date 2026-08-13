import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

export default function ProfileProgressSection({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="profile-progress-content"
        className="flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-black text-slate-950">Your progress</span>
          <span className="block text-[11px] font-semibold text-slate-500">Mitzvah journey, interests, badges, and saved posts</span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id="profile-progress-content" className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-3 pb-3 pt-3">
          {children}
        </div>
      )}
    </section>
  );
}
