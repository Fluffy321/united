import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Headphones, PlayCircle, Radio, RefreshCw } from 'lucide-react';
import JewishHubBackButton from './JewishHubBackButton';
import { getWeeklyParshaReading } from '@/lib/hebrewDate';
import { CURATED_SHIURIM, parshaSearchLinks } from '@/content/jewish/shiurim';

function cleanParshaName(value) {
  return value?.replace(/^Parashat\s+/i, '') || 'this week’s parsha';
}

export default function ShiurimPage() {
  const readingQuery = useQuery({
    queryKey: ['jewish-hub-shiurim-parsha', new Date().toDateString()],
    queryFn: () => getWeeklyParshaReading(new Date(), 'America/New_York'),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const reading = readingQuery.data;
  const parshaName = cleanParshaName(reading?.title);
  const searchLinks = parshaSearchLinks(reading?.title);

  return (
    <main className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <JewishHubBackButton />
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,28,46,0.07)]">
          <div className="border-b border-slate-100 bg-[#FDFCF8] px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-cyan-100 bg-white text-cyan-700 shadow-sm">
                <Headphones className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">Shiurim</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Listen and Learn
                </h1>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                  A small, curated doorway to audio and video Torah from reputable Orthodox sources.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            {readingQuery.isLoading && (
              <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                <div className="skeleton h-6 w-40 rounded" />
                <div className="skeleton mt-3 h-4 w-full rounded" />
              </div>
            )}

            {readingQuery.error && (
              <div className="rounded-[20px] border border-rose-100 bg-rose-50 p-4">
                <h2 className="text-[14px] font-black text-rose-900">Could not load this week’s parsha</h2>
                <p className="mt-1 text-[12px] font-semibold leading-snug text-rose-700">
                  The curated shiurim are still available below.
                </p>
                <button
                  type="button"
                  onClick={() => readingQuery.refetch()}
                  className="motion-press mt-3 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-[12px] font-black text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}

            <article className="overflow-hidden rounded-[28px] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-white shadow-sm">
              <div className="px-4 py-5 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700">Featured</p>
                    <h2 className="mt-2 text-[26px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                      {CURATED_SHIURIM.featured.title}
                    </h2>
                  </div>
                  <PlayCircle className="h-9 w-9 shrink-0 text-cyan-700" />
                </div>
                <p className="mt-2 text-[12px] font-bold leading-5 text-cyan-800">
                  {CURATED_SHIURIM.featured.speaker} · {CURATED_SHIURIM.featured.source}
                </p>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-600">
                  {CURATED_SHIURIM.featured.description}
                </p>
                <p className="mt-3 rounded-[18px] border border-cyan-100 bg-white/80 px-3 py-3 text-[12px] font-bold leading-5 text-slate-600">
                  This week: {parshaName}. Open the original source for the current audio or video.
                </p>
                <a
                  href={CURATED_SHIURIM.featured.href}
                  target="_blank"
                  rel="noreferrer"
                  className="motion-press mt-4 inline-flex items-center gap-2 rounded-[18px] bg-slate-950 px-4 py-3 text-[13px] font-black text-white"
                >
                  Open on {CURATED_SHIURIM.featured.source}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </article>

            {searchLinks.length > 0 && (
              <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">For {parshaName}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {searchLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="motion-press flex items-center justify-between gap-3 rounded-[18px] border border-slate-100 bg-white px-3 py-3 text-[12px] font-black text-slate-800 shadow-sm"
                    >
                      <span className="min-w-0">{item.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {CURATED_SHIURIM.collection.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="motion-press rounded-[24px] border border-slate-100 bg-white px-4 py-4 shadow-sm transition-colors active:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-cyan-100 bg-cyan-50 text-cyan-700">
                      <Radio className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[16px] font-black leading-tight text-slate-950">{item.title}</h3>
                          <p className="mt-1 text-[12px] font-bold leading-5 text-cyan-800">{item.source} · {item.mediaType}</p>
                        </div>
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                      </div>
                      <p className="mt-2 text-[12px] font-semibold leading-5 text-slate-500">{item.description}</p>
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.terms}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {CURATED_SHIURIM.collection.length === 0 && (
              <p className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4 text-[12px] font-semibold leading-5 text-slate-500">
                No curated shiurim have been added yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
