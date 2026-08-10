import React from 'react';
import { ArrowRight } from 'lucide-react';

const TONES = {
  blue: 'border-blue-200 bg-blue-50 text-blue-950',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  amber: 'border-amber-200 bg-amber-50 text-amber-950',
  orange: 'border-orange-200 bg-orange-50 text-orange-950',
  lime: 'border-lime-200 bg-lime-50 text-lime-950',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-950',
  sky: 'border-sky-200 bg-sky-50 text-sky-950',
  violet: 'border-violet-200 bg-violet-50 text-violet-950',
  teal: 'border-teal-200 bg-teal-50 text-teal-950',
  slate: 'border-slate-300 bg-slate-100 text-slate-950',
  rose: 'border-rose-200 bg-rose-50 text-rose-950',
  fuchsia: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-950',
};

function textOf(item) {
  return String(item?.title || item?.body || item?.content || '').trim();
}

export default function LiveCategoryDeck({ leads = [], onOpenCategory, onSeeAll }) {
  return (
    <section aria-labelledby="live-category-heading" className="overflow-hidden">
      <header className="mb-2.5 flex min-h-11 items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#315B8A]">Explore</p>
          <h2 id="live-category-heading" className="text-[20px] font-black tracking-[-0.03em] text-[#0F1C2E]">Across your community</h2>
        </div>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="motion-press min-h-11 rounded-full px-3 text-[11px] font-black text-blue-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            See all
          </button>
        )}
      </header>

      <div className="scrollbar-none grid auto-cols-[68%] grid-flow-col grid-rows-2 gap-2 overflow-x-auto overscroll-x-contain pb-2 pr-[24%] snap-x snap-mandatory sm:auto-cols-[48%]">
        {leads.map((lead) => {
          const { category, item } = lead;
          if (!category) return null;
          const itemText = textOf(item);
          const card = category.card || {};
          const tone = TONES[card.tone] || TONES.slate;
          const ariaLabel = `Open ${category.label}${itemText ? `: ${itemText}` : ''}`;

          return (
            <button
              key={category.id}
              type="button"
              data-live-category={category.id}
              aria-label={ariaLabel}
              onClick={() => onOpenCategory?.(category.id)}
              className={`motion-press group min-h-[108px] snap-start rounded-[19px] border p-3.5 text-left outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${tone}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] opacity-65">{card.shortLabel || category.label}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 opacity-45 transition-transform group-hover:translate-x-0.5" />
              </span>
              <strong className="mt-3 block line-clamp-2 text-[14px] font-black leading-[1.2] tracking-[-0.015em]">
                {itemText || card.emptyLabel || category.description}
              </strong>
              {itemText && lead.stateLabel && (
                <span className="mt-2 block text-[10.5px] font-bold opacity-60">{lead.stateLabel}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
