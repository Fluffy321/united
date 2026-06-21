import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, GraduationCap, RefreshCw } from 'lucide-react';
import JewishHubBackButton from './JewishHubBackButton';
import useJewishHubPreferences from '@/hooks/useJewishHubPreferences';
import { getDailyLearning } from '@/lib/hebrewDate';

function formatCivilDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function DailyLearningPage() {
  const today = new Date();
  const { preferences } = useJewishHubPreferences();
  const learningQuery = useQuery({
    queryKey: ['jewish-hub-daily-learning', today.toDateString()],
    queryFn: () => getDailyLearning(today, 'America/New_York'),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const items = learningQuery.data?.filter((item) => item.title && preferences.learningCycles.includes(item.id)) || [];

  return (
    <main className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <JewishHubBackButton />
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,28,46,0.07)]">
          <div className="border-b border-slate-100 bg-[#FDFCF8] px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-blue-100 bg-white text-blue-700 shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Daily Learning</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Today’s Learning
                </h1>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                  {formatCivilDate(today)} · References from Hebcal, linked out to Sefaria.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            {learningQuery.isLoading && (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="skeleton h-6 w-32 rounded" />
                    <div className="skeleton mt-3 h-4 w-48 rounded" />
                  </div>
                ))}
              </div>
            )}

            {!learningQuery.isLoading && learningQuery.error && (
              <div className="rounded-[20px] border border-rose-100 bg-rose-50 p-4">
                <h2 className="text-[14px] font-black text-rose-900">Could not load daily learning</h2>
                <p className="mt-1 text-[12px] font-semibold leading-snug text-rose-700">
                  {learningQuery.error.message || 'The daily learning calendar is unavailable right now.'}
                </p>
                <button
                  type="button"
                  onClick={() => learningQuery.refetch()}
                  className="motion-press mt-3 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-[12px] font-black text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}

            {!learningQuery.isLoading && !learningQuery.error && items.length === 0 && (
              <p className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4 text-[12px] font-semibold leading-5 text-slate-500">
                No daily learning cycles are selected. Open Jewish Hub settings to choose the cycles you want to follow.
              </p>
            )}

            {!learningQuery.isLoading && !learningQuery.error && items.map((item) => (
              <article key={item.id} className="rounded-[26px] border border-slate-100 bg-white px-4 py-5 shadow-sm sm:px-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">{item.label}</p>
                <h2 className="mt-2 text-[26px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  {item.title}
                </h2>
                {item.hebrew && (
                  <p
                    dir="rtl"
                    lang="he"
                    className="mt-3 text-right text-[24px] font-semibold leading-9 text-slate-950"
                    style={{ fontFamily: 'var(--font-hebrew)', fontKerning: 'normal' }}
                  >
                    {item.hebrew}
                  </p>
                )}
                <p className="mt-4 text-[13px] font-semibold leading-6 text-slate-500">
                  Text opens on Sefaria. The app does not embed copyrighted or noncommercial English translations.
                </p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="motion-press mt-4 inline-flex items-center gap-2 rounded-[18px] bg-slate-950 px-4 py-3 text-[13px] font-black text-white"
                  >
                    Open on Sefaria
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
