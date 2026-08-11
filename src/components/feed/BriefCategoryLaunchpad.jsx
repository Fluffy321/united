import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Dumbbell,
  HeartHandshake,
  MapPinned,
  School,
  Settings2,
  ShoppingBag,
  Sunset,
  UsersRound,
  Utensils,
  Wine,
} from 'lucide-react';
import { BRIEF_CATEGORIES } from '@/lib/feed/briefCategories';

const ICONS = {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Dumbbell,
  HeartHandshake,
  MapPinned,
  School,
  ShoppingBag,
  Sunset,
  UsersRound,
  Utensils,
  Wine,
};

const ACCENTS = {
  blue: 'border-l-blue-500 bg-blue-50/70 text-blue-800',
  rose: 'border-l-rose-500 bg-rose-50/70 text-rose-800',
  amber: 'border-l-amber-500 bg-amber-50/70 text-amber-900',
  orange: 'border-l-orange-500 bg-orange-50/70 text-orange-900',
  emerald: 'border-l-emerald-500 bg-emerald-50/70 text-emerald-900',
  indigo: 'border-l-indigo-500 bg-indigo-50/70 text-indigo-900',
  sky: 'border-l-sky-500 bg-sky-50/70 text-sky-900',
  violet: 'border-l-violet-500 bg-violet-50/70 text-violet-900',
  teal: 'border-l-teal-500 bg-teal-50/70 text-teal-900',
  slate: 'border-l-slate-500 bg-slate-50 text-slate-900',
  lime: 'border-l-lime-500 bg-lime-50/70 text-lime-900',
  fuchsia: 'border-l-fuchsia-500 bg-fuchsia-50/70 text-fuchsia-900',
};

export default function BriefCategoryLaunchpad({ onSelectCategory, onClose }) {
  return (
    <section aria-labelledby="brief-launchpad-heading" className="rounded-[22px] border border-[#DDE3EA] bg-white px-3 pb-4 pt-3 shadow-[0_8px_24px_rgba(15,28,46,0.07)]">
      <header className="flex items-start gap-2 px-1 pb-3">
        <button
          type="button"
          aria-label="Close Daily Brief"
          onClick={onClose}
          className="motion-press flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="min-w-0 pt-1">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#315B8A]">Your Daily Brief</p>
          <h1 id="brief-launchpad-heading" className="mt-0.5 text-[20px] font-black tracking-[-0.025em] text-[#0F1C2E]">
            Choose what you need
          </h1>
          <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">
            Every part of your community, one tap away.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2" aria-label="Daily Brief categories">
        {BRIEF_CATEGORIES.map((category) => {
          const Icon = ICONS[category.icon] || MapPinned;
          return (
            <button
              key={category.id}
              type="button"
              data-category-tile
              data-category-id={category.id}
              onClick={() => onSelectCategory?.(category.id)}
              className={`motion-press min-h-[92px] rounded-[16px] border border-slate-200 border-l-[3px] p-3 text-left outline-none transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${ACCENTS[category.accent] || ACCENTS.slate}`}
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
              <span className="mt-2 block text-[12px] font-black leading-tight">{category.label}</span>
              <span className="mt-1 block line-clamp-2 text-[10.5px] font-semibold leading-[1.35] opacity-65">
                {category.description}
              </span>
            </button>
          );
        })}
      </div>

      <a
        href="/Settings?section=notifications"
        className="motion-press mt-3 flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-[12px] font-black text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <Settings2 aria-hidden="true" className="h-4 w-4" />
        Tune your Brief
      </a>
    </section>
  );
}
