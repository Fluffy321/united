import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, BookMarked, BookOpenText, ChevronRight, LibraryBig, ScrollText, Sparkles } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';
import DailyLearningPage from './DailyLearningPage';
import DivreiTorahPage from './DivreiTorahPage';
import ParshaReader from './ParshaReader';
import SiddurPage from './SiddurPage';
import TanakhReader from './TanakhReader';
import TehillimReader from './TehillimReader';
import { COMMUNITIES_ENABLED } from '@/config/features';

const HUB_ENTRIES = [
  {
    title: 'Tehillim',
    eyebrow: 'Text',
    description: 'A quiet Sefaria-backed reader with Hebrew and public-domain English.',
    path: '/JewishHub/tehillim',
    Icon: ScrollText,
    tone: 'rose',
  },
  {
    title: 'Tanakh',
    eyebrow: 'Full reader',
    description: 'Browse Torah, Neviim, and Ketuvim with Hebrew and JPS 1917 English.',
    path: '/JewishHub/tanakh',
    Icon: BookOpenText,
    tone: 'indigo',
  },
  {
    title: 'Parsha',
    eyebrow: 'Weekly reading',
    description: 'This week’s Torah reading in Hebrew and public-domain JPS 1917 English.',
    path: '/JewishHub/parsha',
    Icon: BookOpenText,
    tone: 'amber',
  },
  {
    title: 'Daily Learning',
    eyebrow: 'Daily learning',
    description: 'Daf Yomi, Mishnah Yomi, and Daily Rambam references with Sefaria links.',
    path: '/JewishHub/daily-learning',
    Icon: Sparkles,
    tone: 'blue',
  },
  {
    title: 'Siddur',
    eyebrow: 'Daily tefillah',
    description: 'A scoped starter set of core weekday tefillos.',
    path: '/JewishHub/siddur',
    Icon: BookMarked,
    tone: 'emerald',
  },
  {
    title: 'Divrei Torah',
    eyebrow: 'Sources',
    description: 'Weekly source links for the parsha and classic commentaries.',
    path: '/JewishHub/divrei-torah',
    Icon: LibraryBig,
    tone: 'violet',
  },
];

const TONE_CLASSES = {
  rose: 'border-rose-100 bg-rose-50 text-rose-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-700',
  blue: 'border-blue-100 bg-blue-50 text-blue-700',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  violet: 'border-violet-100 bg-violet-50 text-violet-700',
  indigo: 'border-indigo-100 bg-indigo-50 text-indigo-700',
};

export default function JewishContentHub() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.replace(/\/$/, '');

  if (normalizedPath === '/JewishHub/tehillim') {
    return <TehillimReader />;
  }

  if (normalizedPath === '/JewishHub/parsha') {
    return <ParshaReader />;
  }

  if (normalizedPath === '/JewishHub/tanakh') {
    return <TanakhReader />;
  }

  if (normalizedPath === '/JewishHub/daily-learning' || normalizedPath === '/JewishHub/daf-yomi') {
    return <DailyLearningPage />;
  }

  if (normalizedPath === '/JewishHub/siddur') {
    return <SiddurPage />;
  }

  if (normalizedPath === '/JewishHub/divrei-torah') {
    return <DivreiTorahPage />;
  }

  return (
    <main className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <Link
        to={COMMUNITIES_ENABLED ? '/Communities' : '/Feed'}
        className="motion-press mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        {COMMUNITIES_ENABLED ? 'Communities' : 'Feed'}
      </Link>

      <div className="space-y-4">
        <DailyJewishHome />

        <section className="rounded-[30px] border border-slate-200/70 bg-white p-3 shadow-[0_18px_50px_rgba(15,28,46,0.06)]">
          <div className="px-2 pb-3 pt-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Library</p>
            <h2 className="mt-1 text-[22px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
              Choose one thing
            </h2>
          </div>

          <div className="grid gap-2">
            {HUB_ENTRIES.map((entry) => (
              <HubEntry key={entry.path} entry={entry} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function HubEntry({ entry }) {
  const { Icon } = entry;

  return (
    <Link
      to={entry.path}
      className="motion-press flex items-center gap-3 rounded-[22px] border border-slate-100 bg-[#FDFCF8] px-3 py-3 transition-colors active:bg-slate-50"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border ${TONE_CLASSES[entry.tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{entry.eyebrow}</p>
        <h3 className="mt-0.5 text-[15px] font-black leading-tight text-slate-950">{entry.title}</h3>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{entry.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </Link>
  );
}
