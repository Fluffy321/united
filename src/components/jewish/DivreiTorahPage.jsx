import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, LibraryBig, ScrollText } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';
import { getWeeklyParshaReading } from '@/lib/hebrewDate';

function cleanParshaName(value) {
  return value?.replace(/^Parashat\s+/i, '') || 'This week’s parsha';
}

function firstVerseRef(torahRef) {
  const match = torahRef?.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!match) return null;
  return `${match[1]} ${match[2]}:${match[3]}`;
}

function sefariaUrl(ref) {
  return `https://www.sefaria.org/${encodeURIComponent(ref).replace(/%20/g, '_').replace(/%3A/g, '.')}`;
}

function commentaryLinks(reading) {
  const firstVerse = firstVerseRef(reading?.torah);
  if (!firstVerse) return [];
  return [
    {
      title: 'Rashi',
      subtitle: 'Classic peshat commentary, starting at the first pasuk.',
      ref: `Rashi on ${firstVerse}`,
    },
    {
      title: 'Ramban',
      subtitle: 'A deeper medieval commentary with textual and conceptual analysis.',
      ref: `Ramban on ${firstVerse}`,
    },
    {
      title: 'Sforno',
      subtitle: 'Concise commentary with careful attention to meaning.',
      ref: `Sforno on ${firstVerse}`,
    },
  ];
}

export default function DivreiTorahPage() {
  const readingQuery = useQuery({
    queryKey: ['jewish-hub-divrei-torah', new Date().toDateString()],
    queryFn: () => getWeeklyParshaReading(new Date(), 'America/New_York'),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const reading = readingQuery.data;
  const links = commentaryLinks(reading);

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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-violet-100 bg-white text-violet-700 shadow-sm">
                <LibraryBig className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Divrei Torah</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Weekly Sources
                </h1>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                  A quiet doorway into the parsha: primary text and classic commentaries on Sefaria.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            {readingQuery.isLoading && (
              <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                <div className="skeleton h-6 w-32 rounded" />
                <div className="skeleton mt-3 h-4 w-48 rounded" />
              </div>
            )}

            {!readingQuery.isLoading && reading && (
              <>
                <article className="rounded-[26px] border border-slate-100 bg-white px-4 py-5 shadow-sm sm:px-5">
                  <div className="flex items-start gap-3">
                    <ScrollText className="mt-1 h-4 w-4 shrink-0 text-violet-700" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">This week</p>
                      <h2 className="mt-2 text-[24px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                        {cleanParshaName(reading.title)}
                      </h2>
                      {reading.hebrew && (
                        <p
                          dir="rtl"
                          lang="he"
                          className="mt-2 text-right text-[24px] font-semibold leading-9 text-slate-950"
                          style={{ fontFamily: 'var(--font-hebrew)', fontKerning: 'normal' }}
                        >
                          {reading.hebrew}
                        </p>
                      )}
                      {reading.torah && (
                        <a
                          href={sefariaUrl(reading.torah)}
                          target="_blank"
                          rel="noreferrer"
                          className="motion-press mt-4 inline-flex items-center gap-2 rounded-[18px] bg-slate-950 px-4 py-3 text-[13px] font-black text-white"
                        >
                          Open {reading.torah}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>

                <div className="grid gap-3">
                  {links.map((item) => (
                    <a
                      key={item.ref}
                      href={sefariaUrl(item.ref)}
                      target="_blank"
                      rel="noreferrer"
                      className="motion-press rounded-[24px] border border-slate-100 bg-white px-4 py-4 shadow-sm transition-colors active:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[16px] font-black leading-tight text-slate-950">{item.title}</h3>
                          <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{item.subtitle}</p>
                          <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-violet-600">{item.ref}</p>
                        </div>
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            {!readingQuery.isLoading && !reading && (
              <p className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4 text-[12px] font-semibold leading-5 text-slate-500">
                This week’s source links are unavailable right now.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
