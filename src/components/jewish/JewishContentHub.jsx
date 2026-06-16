import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpenText, ChevronRight, Clock, Landmark, ScrollText } from 'lucide-react';
import TehillimReader from './TehillimReader';

const HUB_ITEMS = [
  {
    title: 'Tehillim',
    description: 'Community Tehillim and names to daven for.',
    path: '/JewishHub/tehillim',
    Icon: ScrollText,
    tone: 'rose',
  },
  {
    title: 'Torah / Parsha',
    description: 'Short Torah thoughts and weekly parsha content.',
    path: '/JewishHub/torah-parsha',
    Icon: BookOpenText,
    tone: 'blue',
    soon: true,
  },
  {
    title: 'Zmanim (Five Towns)',
    description: 'Local daily zmanim for the Five Towns.',
    path: '/JewishHub/zmanim',
    Icon: Clock,
    tone: 'amber',
    soon: true,
  },
  {
    title: 'Siddur',
    description: 'Core tefillos and useful davening references.',
    path: '/JewishHub/siddur',
    Icon: Landmark,
    tone: 'emerald',
    soon: true,
  },
];

const VISIBLE_HUB_ITEMS = HUB_ITEMS.filter((item) => !item.soon);

const PLACEHOLDERS = {
  '/JewishHub/tehillim': 'Tehillim',
  '/JewishHub/torah-parsha': 'Torah / Parsha',
  '/JewishHub/zmanim': 'Zmanim (Five Towns)',
  '/JewishHub/siddur': 'Siddur',
};

const TONE_CLASSES = {
  rose: 'border-rose-100 bg-rose-50 text-rose-700',
  blue: 'border-blue-100 bg-blue-50 text-blue-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-700',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
};

export default function JewishContentHub() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.replace(/\/$/, '');
  const placeholderTitle = PLACEHOLDERS[normalizedPath];

  if (normalizedPath === '/JewishHub/tehillim') {
    return <TehillimReader />;
  }

  if (placeholderTitle) {
    return <JewishPlaceholder title={placeholderTitle} />;
  }

  return (
    <div className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <Link
        to="/Communities"
        className="motion-press mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Communities
      </Link>

      <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-800 px-4 py-4 text-white">
          <p className="text-[10px] font-black uppercase tracking-wide text-white/70">Jewish content</p>
          <h1 className="mt-1 text-[22px] font-black leading-tight">Jewish Hub</h1>
          <p className="mt-1.5 max-w-md text-[13px] font-semibold leading-snug text-white/80">
            Tehillim reader for learning, davening, and reflection.
          </p>
        </div>

        <div className="grid gap-3 p-3">
          {VISIBLE_HUB_ITEMS.map((item) => (
            <HubTile key={item.path} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function HubTile({ item }) {
  const { Icon } = item;

  return (
    <Link
      to={item.path}
      className="motion-press flex items-center gap-3 rounded-[20px] border border-slate-100 bg-slate-50 px-3 py-3 shadow-sm transition-colors active:bg-slate-100"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border ${TONE_CLASSES[item.tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-black leading-tight text-slate-950">{item.title}</h2>
          {item.soon && (
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-400">
              Soon
            </span>
          )}
        </div>
        <p className="mt-1 text-[12px] font-semibold leading-snug text-slate-500">{item.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </Link>
  );
}

function JewishPlaceholder({ title }) {
  return (
    <div className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <Link
        to="/JewishHub"
        className="motion-press mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Jewish Hub
      </Link>

      <section className="rounded-[24px] border border-slate-100 bg-white px-4 py-5 shadow-sm">
        <div className="mt-5 rounded-[20px] border border-blue-100 bg-blue-50 px-4 py-5">
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-500">Jewish content</p>
          <h1 className="mt-1 text-[22px] font-black leading-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-[14px] font-semibold text-slate-500">Coming soon.</p>
        </div>
      </section>
    </div>
  );
}
