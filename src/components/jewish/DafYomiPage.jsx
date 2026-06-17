import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpenText, ExternalLink, RefreshCw } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';
import { getDafYomi } from '@/lib/hebrewDate';

function formatCivilDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function DafYomiPage() {
  const today = new Date();
  const dafQuery = useQuery({
    queryKey: ['jewish-hub-daf-yomi', today.toDateString()],
    queryFn: () => getDafYomi(today, 'America/New_York'),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  return (
    <main className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <Link
        to="/JewishHub"
        className="motion-press mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Jewish Hub
      </Link>

      <div className="space-y-4">
        <DailyJewishHome compact />

        <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,28,46,0.07)]">
          <div className="border-b border-slate-100 bg-[#FDFCF8] px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-blue-100 bg-white text-blue-700 shadow-sm">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Daf Yomi</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Today’s Daf
                </h1>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                  {formatCivilDate(today)} · Calendar data from Hebcal.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            {dafQuery.isLoading && (
              <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                <div className="skeleton h-6 w-32 rounded" />
                <div className="skeleton mt-3 h-4 w-48 rounded" />
              </div>
            )}

            {!dafQuery.isLoading && dafQuery.error && (
              <div className="rounded-[20px] border border-rose-100 bg-rose-50 p-4">
                <h2 className="text-[14px] font-black text-rose-900">Could not load today’s daf</h2>
                <p className="mt-1 text-[12px] font-semibold leading-snug text-rose-700">
                  {dafQuery.error.message || 'The Daf Yomi calendar is unavailable right now.'}
                </p>
                <button
                  type="button"
                  onClick={() => dafQuery.refetch()}
                  className="motion-press mt-3 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-[12px] font-black text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}

            {!dafQuery.isLoading && !dafQuery.error && dafQuery.data && (
              <article className="rounded-[26px] border border-slate-100 bg-white px-4 py-5 shadow-sm sm:px-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Today</p>
                <h2 className="mt-2 text-[30px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  {dafQuery.data.title}
                </h2>
                {dafQuery.data.hebrew && (
                  <p
                    dir="rtl"
                    lang="he"
                    className="mt-3 text-right text-[26px] font-semibold leading-9 text-slate-950"
                    style={{ fontFamily: 'var(--font-hebrew)', fontKerning: 'normal' }}
                  >
                    {dafQuery.data.hebrew}
                  </p>
                )}
                <p className="mt-4 text-[13px] font-semibold leading-6 text-slate-500">
                  We link out for the daf text. The app does not embed Sefaria’s English Talmud translation because it is not public-domain.
                </p>
                {dafQuery.data.link && (
                  <a
                    href={dafQuery.data.link}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-press mt-4 inline-flex items-center gap-2 rounded-[18px] bg-slate-950 px-4 py-3 text-[13px] font-black text-white"
                  >
                    Open on Sefaria
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
