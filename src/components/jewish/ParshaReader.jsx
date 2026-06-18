import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpenText, RefreshCw } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';
import SefariaAttribution from './SefariaAttribution';
import { getWeeklyParshaReading } from '@/lib/hebrewDate';

const SEFARIA_TEXTS_URL = 'https://www.sefaria.org/api/v3/texts';
const CACHE_PREFIX = 'junited:parsha:v1';

const HEBREW_VERSION = {
  language: 'hebrew',
  responseLanguage: 'he',
  title: 'Miqra according to the Masorah',
  license: 'CC-BY-SA',
};

const ENGLISH_VERSION = {
  language: 'english',
  responseLanguage: 'en',
  title: 'The Holy Scriptures: A New Translation (JPS 1917)',
  license: 'Public Domain',
};

const VIEW_MODES = [
  { id: 'both', label: 'Both' },
  { id: 'hebrew', label: 'Hebrew' },
  { id: 'english', label: 'English' },
];

function isAllowedLicense(license) {
  if (!license || typeof license !== 'string') return false;

  const normalized = license.trim().toLowerCase();
  if (!normalized || normalized.includes('nc') || normalized.includes('copyright')) return false;

  return (
    normalized.includes('public domain') ||
    normalized === 'cc0' ||
    normalized.includes('cc-by-sa') ||
    normalized.includes('cc by-sa') ||
    normalized.includes('cc-by') ||
    normalized.includes('cc by')
  );
}

function stripMarkup(value) {
  if (typeof value !== 'string') return '';

  const withLineBreaks = value.replace(/<br\s*\/?>/gi, '\n');
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return withLineBreaks.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  const parsed = new window.DOMParser().parseFromString(withLineBreaks, 'text/html');
  return parsed.body.textContent.replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

function cacheKey(ref) {
  return `${CACHE_PREFIX}:${encodeURIComponent(ref)}:${encodeURIComponent(HEBREW_VERSION.title)}:${encodeURIComponent(ENGLISH_VERSION.title)}`;
}

function readCachedParsha(ref) {
  try {
    const raw = window.localStorage?.getItem(cacheKey(ref));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (
      cached?.hebrew?.title === HEBREW_VERSION.title &&
      cached?.english?.title === ENGLISH_VERSION.title &&
      isAllowedLicense(cached.hebrew.license) &&
      isAllowedLicense(cached.english.license)
    ) {
      return cached;
    }
  } catch {
    // Cache is only a speed hint.
  }

  return null;
}

function writeCachedParsha(ref, payload) {
  try {
    window.localStorage?.setItem(cacheKey(ref), JSON.stringify(payload));
  } catch {
    // Storage can be unavailable; the reader should still work.
  }
}

function getRequestedVersion(versions, expected) {
  const match = versions.find(
    (version) =>
      version.versionTitle === expected.title &&
      (version.language === expected.responseLanguage || version.language === expected.language)
  );

  if (!match) {
    throw new Error(`Sefaria did not return ${expected.title}.`);
  }

  if (!isAllowedLicense(match.license)) {
    throw new Error(`Blocked ${expected.title}: license "${match.license || 'missing'}" is not allowed.`);
  }

  return {
    title: match.versionTitle,
    license: match.license,
    text: flattenText(match.text).map(stripMarkup),
  };
}

function flattenText(text) {
  if (!Array.isArray(text)) return [];
  return text.flatMap((item) => (Array.isArray(item) ? flattenText(item) : [item]));
}

function parseTorahRange(ref) {
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)-(?:(\d+):)?(\d+)$/);
  if (!match) return null;
  const [, book, startChapterRaw, startVerseRaw, endChapterRaw, endVerseRaw] = match;
  return {
    book,
    startChapter: Number(startChapterRaw),
    startVerse: Number(startVerseRaw),
    endChapter: Number(endChapterRaw || startChapterRaw),
    endVerse: Number(endVerseRaw),
  };
}

function buildVerseRefs(ref, total) {
  const parsed = parseTorahRange(ref);
  if (!parsed) return Array.from({ length: total }, (_, index) => `${ref}:${index + 1}`);

  const refs = [];
  for (let chapter = parsed.startChapter; chapter <= parsed.endChapter; chapter += 1) {
    const firstVerse = chapter === parsed.startChapter ? parsed.startVerse : 1;
    const lastVerse = chapter === parsed.endChapter ? parsed.endVerse : 200;
    for (let verse = firstVerse; verse <= lastVerse && refs.length < total; verse += 1) {
      refs.push(`${parsed.book} ${chapter}:${verse}`);
    }
  }
  return refs;
}

async function fetchParshaText(reading) {
  if (!reading?.torah) throw new Error('This week’s Torah reading is not available.');

  const cached = readCachedParsha(reading.torah);
  if (cached) return { ...cached, usedCache: true };

  const params = new URLSearchParams();
  params.append('version', `${HEBREW_VERSION.language}|${HEBREW_VERSION.title}`);
  params.append('version', `${ENGLISH_VERSION.language}|${ENGLISH_VERSION.title}`);
  params.set('return_format', 'text_only');

  const response = await fetch(`${SEFARIA_TEXTS_URL}/${encodeURIComponent(reading.torah)}?${params}`);
  if (!response.ok) {
    throw new Error(`Sefaria returned ${response.status} for ${reading.torah}.`);
  }

  const data = await response.json();
  const versions = Array.isArray(data?.versions) ? data.versions : [];
  const hebrew = getRequestedVersion(versions, HEBREW_VERSION);
  const english = getRequestedVersion(versions, ENGLISH_VERSION);
  const payload = {
    ref: data?.ref || reading.torah,
    fetchedAt: new Date().toISOString(),
    hebrew,
    english,
  };

  writeCachedParsha(reading.torah, payload);
  return { ...payload, usedCache: false };
}

function buildVerseRows(reading, parshaData) {
  const hebrew = parshaData?.hebrew?.text || [];
  const english = parshaData?.english?.text || [];
  const total = Math.max(hebrew.length, english.length);
  const refs = buildVerseRefs(reading?.torah || parshaData?.ref || '', total);

  return Array.from({ length: total }, (_, index) => ({
    ref: refs[index] || `${reading?.torah || 'Torah'} ${index + 1}`,
    hebrew: hebrew[index] || '',
    english: english[index] || '',
  }));
}

function cleanParshaName(value) {
  return value?.replace(/^Parashat\s+/i, '') || 'This week’s parsha';
}

export default function ParshaReader() {
  const [viewMode, setViewMode] = useState('both');

  const readingQuery = useQuery({
    queryKey: ['jewish-hub-parsha-reader', new Date().toDateString()],
    queryFn: () => getWeeklyParshaReading(new Date(), 'America/New_York'),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const textQuery = useQuery({
    queryKey: ['jewish-hub-parsha-text', readingQuery.data?.torah],
    queryFn: () => fetchParshaText(readingQuery.data),
    enabled: Boolean(readingQuery.data?.torah),
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });

  const verseRows = useMemo(() => buildVerseRows(readingQuery.data, textQuery.data), [readingQuery.data, textQuery.data]);
  const isLoading = readingQuery.isLoading || textQuery.isLoading;
  const error = readingQuery.error?.message || textQuery.error?.message;

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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-amber-100 bg-white text-amber-700 shadow-sm">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Parsha</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  {cleanParshaName(readingQuery.data?.title)}
                </h1>
                {readingQuery.data?.hebrew && (
                  <p
                    dir="rtl"
                    lang="he"
                    className="mt-2 text-right text-[24px] font-semibold leading-9 text-slate-950"
                    style={{ fontFamily: 'var(--font-hebrew)', fontKerning: 'normal' }}
                  >
                    {readingQuery.data.hebrew}
                  </p>
                )}
                {readingQuery.data?.torah && (
                  <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                    {readingQuery.data.torah} · Hebrew and public-domain JPS 1917 English from Sefaria.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            <div className="grid grid-cols-3 rounded-[18px] border border-slate-200 bg-white p-1">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  className={`h-9 rounded-xl text-[12px] font-black transition-colors ${
                    viewMode === mode.id
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-500 active:bg-slate-100'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {textQuery.data?.usedCache && (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-700">
                Showing a saved copy. Refresh to check Sefaria again.
              </p>
            )}

            {isLoading && <ParshaLoading />}

            {!isLoading && error && (
              <div className="rounded-[20px] border border-rose-100 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[14px] font-black text-rose-900">Could not load the parsha</h2>
                    <p className="mt-1 text-[12px] font-semibold leading-snug text-rose-700">{error}</p>
                    <button
                      type="button"
                      onClick={() => {
                        readingQuery.refetch();
                        textQuery.refetch();
                      }}
                      className="motion-press mt-3 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-[12px] font-black text-white"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <>
                <div className="space-y-3">
                  {verseRows.map((verse) => (
                    <article key={verse.ref} className="rounded-[26px] border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5">
                      <div className="mb-3 inline-flex min-h-7 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
                        {verse.ref}
                      </div>

                      {(viewMode === 'both' || viewMode === 'hebrew') && verse.hebrew && (
                        <p
                          dir="rtl"
                          lang="he"
                          className="text-right text-[23px] font-medium leading-[2.35] text-slate-950 sm:text-[25px]"
                          style={{
                            fontFamily: 'var(--font-hebrew)',
                            fontKerning: 'normal',
                            textRendering: 'optimizeLegibility',
                          }}
                        >
                          {verse.hebrew}
                        </p>
                      )}

                      {(viewMode === 'both' || viewMode === 'english') && verse.english && (
                        <p className={`${viewMode === 'both' && verse.hebrew ? 'mt-4 border-t border-slate-100 pt-4' : ''} text-[15px] font-semibold leading-8 text-slate-700`}>
                          {verse.english}
                        </p>
                      )}
                    </article>
                  ))}
                </div>

                <SefariaAttribution
                  hebrew={textQuery.data?.hebrew}
                  english={textQuery.data?.english}
                  ref={textQuery.data?.ref}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ParshaLoading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-[20px] border border-slate-100 bg-white p-3 shadow-sm">
          <div className="skeleton h-7 w-24 rounded-full" />
          <div className="skeleton mt-3 h-5 w-full rounded" />
          <div className="skeleton mt-2 h-5 w-5/6 rounded" />
          <div className="skeleton mt-4 h-4 w-full rounded" />
          <div className="skeleton mt-2 h-4 w-4/5 rounded" />
        </div>
      ))}
    </div>
  );
}
