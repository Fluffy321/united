import React from 'react';
import { ArrowUpRight, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { getBriefCategory } from '@/lib/feed/briefCategories';

const TONES = {
  helping: {
    dominant: 'border-emerald-700 bg-[linear-gradient(145deg,#2F8B68,#176047)] text-white shadow-[0_16px_34px_rgba(24,96,71,0.22)]',
    dot: 'bg-emerald-500',
  },
  local: {
    dominant: 'border-blue-700 bg-[linear-gradient(145deg,#356EEB,#174BAE)] text-white shadow-[0_16px_34px_rgba(23,75,174,0.22)]',
    dot: 'bg-blue-500',
  },
  events: {
    dominant: 'border-orange-700 bg-[linear-gradient(145deg,#F07A35,#B74416)] text-white shadow-[0_16px_34px_rgba(183,68,22,0.20)]',
    dot: 'bg-orange-500',
  },
  jewish_times: {
    dominant: 'border-amber-700 bg-[linear-gradient(145deg,#DFA725,#9B6411)] text-white shadow-[0_16px_34px_rgba(155,100,17,0.20)]',
    dot: 'bg-amber-500',
  },
  default: {
    dominant: 'border-[#214D86] bg-[linear-gradient(145deg,#315B8A,#173B67)] text-white shadow-[0_16px_34px_rgba(23,59,103,0.22)]',
    dot: 'bg-[#315B8A]',
  },
};

const levelLabels = {
  quiet: 'Quiet',
  balanced: 'Balanced',
  active: 'Active',
  all_in: 'All in',
};

function titleOf(item) {
  return String(item?.title || item?.body || item?.content || 'Community update').trim();
}

function labelOf(item) {
  return getBriefCategory(item.category_id)?.label || 'Community';
}

function PriorityCard({ item, onOpen }) {
  const dominant = Boolean(item.is_dominant);
  const tone = TONES[item.category_id] || TONES.default;
  const reasons = Array.isArray(item.priority_reasons) ? item.priority_reasons : [];
  const title = titleOf(item);
  const categoryLabel = labelOf(item);
  const reasonText = reasons.map(({ label }) => label).filter(Boolean).join(', ');
  const ariaLabel = `Open ${categoryLabel} priority: ${title}${reasonText ? `. ${reasonText}` : ''}`;

  return (
    <button
      type="button"
      data-priority-variant={dominant ? 'dominant' : 'compact'}
      onClick={() => onOpen?.(item)}
      aria-label={ariaLabel}
      className={`motion-press group w-full overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
        dominant
          ? `min-h-[158px] rounded-[22px] border px-5 py-5 ${tone.dominant}`
          : 'min-h-[82px] rounded-[18px] border border-slate-200 bg-white px-4 py-3.5 shadow-[0_7px_20px_rgba(15,28,46,0.06)]'
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] ${dominant ? 'text-white/80' : 'text-slate-500'}`}>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dominant ? 'bg-white' : tone.dot}`} />
          {categoryLabel}
        </span>
        <ArrowUpRight aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${dominant ? 'text-white/80' : 'text-slate-400'}`} />
      </span>

      <span className={`block font-black tracking-[-0.025em] ${dominant ? 'mt-5 max-w-[310px] text-[23px] leading-[1.08]' : 'mt-2 line-clamp-2 pr-4 text-[15px] leading-[1.25] text-[#0F1C2E]'}`}>
        {title}
      </span>

      {reasons.length > 0 && (
        <span className={`mt-3 flex flex-wrap gap-1.5 ${dominant ? '' : 'mt-2'}`}>
          {reasons.map((reason) => (
            <span
              key={reason.id}
              data-priority-reason={reason.id}
              className={`rounded-full px-2.5 py-1 text-[10px] font-black ${dominant ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {reason.label}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

function CalmPriorityState() {
  return (
    <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
      <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-emerald-700" />
      <p className="mt-3 text-[15px] font-black tracking-[-0.015em] text-[#0F1C2E]">Nothing needs immediate attention</p>
      <p className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-500">Browse the live categories below whenever you want to catch up.</p>
    </div>
  );
}

function PriorityExplanation() {
  return (
    <details className="group rounded-[15px] border border-slate-200 bg-slate-50">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-[11px] font-black text-[#315B8A] outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
        <Info aria-hidden="true" className="h-4 w-4" />
        Why these are first
      </summary>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 p-3 text-[10.5px] font-bold leading-snug text-slate-600">
        <span><strong className="block text-[#0F1C2E]">Urgency</strong>Deadlines and safety</span>
        <span><strong className="block text-[#0F1C2E]">Personal</strong>Yours and replies</span>
        <span><strong className="block text-[#0F1C2E]">Action</strong>Where help matters</span>
        <span><strong className="block text-[#0F1C2E]">Trust</strong>Verified and current</span>
      </div>
    </details>
  );
}

export default function HomePriorityStack({
  items = [],
  networkLabel = 'Your community',
  engagementLevel = 'balanced',
  onOpenItem,
  onOpenEngagement,
}) {
  return (
    <section aria-labelledby="home-priority-heading" className="overflow-hidden rounded-[26px] border border-[#DDE3EA] bg-[#F9FBFD] shadow-[0_16px_42px_rgba(15,28,46,0.08)]">
      <header className="px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#315B8A]">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            {networkLabel} pulse
          </p>
          <button
            type="button"
            onClick={onOpenEngagement}
            aria-label={`Change engagement level. Currently ${levelLabels[engagementLevel] || 'Balanced'}`}
            className="motion-press min-h-11 rounded-full bg-[#EAF0F8] px-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#234E7A] outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {levelLabels[engagementLevel] || 'Balanced'}
          </button>
        </div>
        <h1 id="home-priority-heading" className="mt-1 max-w-[310px] text-[27px] font-black leading-[1.02] tracking-[-0.04em] text-[#0F1C2E]">
          What needs your attention
        </h1>
        <p className="mt-1.5 text-[11.5px] font-semibold text-slate-500">Only the clearest priorities rise here.</p>
      </header>

      <div className="space-y-2 px-3 pb-3">
        {items.map((item) => <PriorityCard key={item.id} item={item} onOpen={onOpenItem} />)}
        {items.length === 0 && <CalmPriorityState />}
        <PriorityExplanation />
      </div>
    </section>
  );
}
