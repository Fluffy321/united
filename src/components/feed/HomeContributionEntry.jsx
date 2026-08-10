import React, { useState } from 'react';
import {
  ArrowRight,
  CalendarPlus,
  CircleHelp,
  HandHeart,
  HeartHandshake,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { FEED_INTENTIONS } from '@/lib/feed/feedIntentions';

const INTENTION_ICONS = {
  CircleHelp,
  Send,
  HandHeart,
  HeartHandshake,
  CalendarPlus,
};

const INTENTION_STYLES = {
  ask: 'bg-blue-50 text-blue-700',
  share: 'bg-indigo-50 text-indigo-700',
  need: 'bg-rose-50 text-rose-700',
  offer: 'bg-emerald-50 text-emerald-700',
  plan: 'bg-amber-50 text-amber-800',
};

export function ContributionOptions({ intentions = FEED_INTENTIONS, onSelect }) {
  return (
    <div className="space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {intentions.map((intention) => {
        const Icon = INTENTION_ICONS[intention.icon] || Plus;
        return (
          <button
            key={intention.id}
            type="button"
            data-feed-intention={intention.id}
            aria-label={intention.ariaLabel}
            onClick={() => onSelect?.(intention)}
            className="motion-press flex min-h-[58px] w-full items-center gap-3 rounded-[17px] border border-slate-200 bg-white px-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${INTENTION_STYLES[intention.id] || 'bg-slate-100 text-slate-700'}`}>
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-black text-[#0F1C2E]">{intention.label}</span>
              <span className="block text-[11px] font-semibold text-slate-500">{intention.ariaLabel}</span>
            </span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        );
      })}
    </div>
  );
}

export default function HomeContributionEntry({ onSelect }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (intention) => {
    setOpen(false);
    onSelect?.(intention);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="motion-press flex min-h-[76px] w-full items-center gap-3 rounded-[21px] bg-[#07132E] px-3.5 py-3 text-left text-white shadow-[0_14px_30px_rgba(7,19,46,0.18)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#3563EB] shadow-[0_7px_18px_rgba(53,99,235,0.32)]">
          <Plus aria-hidden="true" className="h-6 w-6" strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-black tracking-[-0.01em]">Share with your community</span>
          <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-slate-300">Ask, offer help, post an update, or make a plan</span>
        </span>
        <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-white/80" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
          <button
            type="button"
            aria-label="Close posting options"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="contribution-options-title"
            aria-describedby="contribution-options-description"
            className="relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-slate-200 bg-white px-4 pb-2 pt-5 shadow-[0_-18px_60px_rgba(15,23,42,0.24)]"
          >
            <header className="mb-4 flex items-start gap-3 text-left">
              <div className="min-w-0 flex-1">
                <h2 id="contribution-options-title" className="text-[22px] font-black tracking-[-0.03em] text-[#0F1C2E]">What do you want to do?</h2>
                <p id="contribution-options-description" className="mt-1 text-[12px] font-semibold text-slate-500">Choose one. We’ll open the right posting screen.</p>
              </div>
              <button
                type="button"
                aria-label="Close posting options"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-slate-100 text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>
            <ContributionOptions onSelect={handleSelect} />
          </section>
        </div>
      )}
    </>
  );
}
