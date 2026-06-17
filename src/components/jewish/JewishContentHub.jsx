import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpenText, ChevronRight, ScrollText } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';
import ParshaReader from './ParshaReader';
import TehillimReader from './TehillimReader';
import { COMMUNITIES_ENABLED } from '@/config/features';

export default function JewishContentHub() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.replace(/\/$/, '');

  if (normalizedPath === '/JewishHub/tehillim') {
    return <TehillimReader />;
  }

  if (normalizedPath === '/JewishHub/parsha') {
    return <ParshaReader />;
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

        <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,28,46,0.06)]">
          <div className="px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Weekly reading</p>
            <div className="mt-3 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-amber-100 bg-amber-50 text-amber-700">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[22px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Parsha
                </h2>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-slate-500">
                  This week’s Torah reading, pulled from Sefaria with Hebrew and public-domain JPS 1917 English.
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/JewishHub/parsha"
            className="motion-press flex items-center justify-between gap-3 border-t border-slate-100 bg-[#FDFCF8] px-5 py-4 text-[13px] font-black text-slate-900 transition-colors active:bg-slate-50"
          >
            Open parsha reader
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,28,46,0.06)]">
          <div className="px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">Text</p>
            <div className="mt-3 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-rose-100 bg-rose-50 text-rose-700">
                <ScrollText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[22px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Tehillim
                </h2>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-slate-500">
                  A quiet Sefaria-backed reader with Hebrew and public-domain English. Start with one perek and let the page breathe.
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/JewishHub/tehillim"
            className="motion-press flex items-center justify-between gap-3 border-t border-slate-100 bg-[#FDFCF8] px-5 py-4 text-[13px] font-black text-slate-900 transition-colors active:bg-slate-50"
          >
            Open Tehillim reader
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </section>
      </div>
    </main>
  );
}
