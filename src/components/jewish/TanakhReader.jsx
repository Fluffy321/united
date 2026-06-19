import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpenText, RefreshCw } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';
import SefariaAttribution from './SefariaAttribution';

const SEFARIA_TEXTS_URL = 'https://www.sefaria.org/api/v3/texts';
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

const TANAKH_SECTIONS = [
  {
    label: 'Torah',
    books: [
      book('Genesis', 50),
      book('Exodus', 40),
      book('Leviticus', 27),
      book('Numbers', 36),
      book('Deuteronomy', 34),
    ],
  },
  {
    label: 'Neviim',
    books: [
      book('Joshua', 24),
      book('Judges', 21),
      book('I Samuel', 31),
      book('II Samuel', 24),
      book('I Kings', 22),
      book('II Kings', 25),
      book('Isaiah', 66),
      book('Jeremiah', 52),
      book('Ezekiel', 48),
      book('Hosea', 14),
      book('Joel', 4),
      book('Amos', 9),
      book('Obadiah', 1),
      book('Jonah', 4),
      book('Micah', 7),
      book('Nahum', 3),
      book('Habakkuk', 3),
      book('Zephaniah', 3),
      book('Haggai', 2),
      book('Zechariah', 14),
      book('Malachi', 3),
    ],
  },
  {
    label: 'Ketuvim',
    books: [
      book('Psalms', 150),
      book('Proverbs', 31),
      book('Job', 42),
      book('Song of Songs', 8),
      book('Ruth', 4),
      book('Lamentations', 5),
      book('Ecclesiastes', 12),
      book('Esther', 10),
      book('Daniel', 12),
      book('Ezra', 10),
      book('Nehemiah', 13),
      book('I Chronicles', 29),
      book('II Chronicles', 36),
    ],
  },
];

const VIEW_MODES = [
  { id: 'both', label: 'Both' },
  { id: 'hebrew', label: 'Hebrew' },
  { id: 'english', label: 'English' },
];

function book(title, chapters) {
  return { title, chapters };
}

function allBooks() {
  return TANAKH_SECTIONS.flatMap((section) => section.books.map((item) => ({ ...item, section: section.label })));
}

function isAllowedLicense(license) {
  if (!license || typeof license !== 'string') return false;
  const normalized = license.trim().toLowerCase();
  if (!normalized || normalized.includes('nc') || normalized.includes('copyright')) return false;
  return normalized.includes('public domain') || normalized === 'cc0' || normalized.includes('cc-by') || normalized.includes('cc by');
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
    text: Array.isArray(match.text) ? match.text.map(stripMarkup) : [],
  };
}

async function fetchChapter(bookTitle, chapter) {
  const params = new URLSearchParams();
  params.append('version', `${HEBREW_VERSION.language}|${HEBREW_VERSION.title}`);
  params.append('version', `${ENGLISH_VERSION.language}|${ENGLISH_VERSION.title}`);
  params.set('return_format', 'text_only');

  const ref = `${bookTitle} ${chapter}`;
  const response = await fetch(`${SEFARIA_TEXTS_URL}/${encodeURIComponent(ref)}?${params}`);
  if (!response.ok) {
    throw new Error(`Sefaria returned ${response.status} for ${ref}.`);
  }

  const data = await response.json();
  const versions = Array.isArray(data?.versions) ? data.versions : [];
  return {
    ref: data?.ref || ref,
    hebrew: getRequestedVersion(versions, HEBREW_VERSION),
    english: getRequestedVersion(versions, ENGLISH_VERSION),
  };
}

function buildVerseRows(chapterData) {
  const hebrew = chapterData?.hebrew?.text || [];
  const english = chapterData?.english?.text || [];
  const total = Math.max(hebrew.length, english.length);

  return Array.from({ length: total }, (_, index) => ({
    number: index + 1,
    hebrew: hebrew[index] || '',
    english: english[index] || '',
  }));
}

export default function TanakhReader() {
  const books = useMemo(() => allBooks(), []);
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [viewMode, setViewMode] = useState('both');
  const currentBook = books.find((item) => item.title === selectedBook) || books[0];

  const chapterQuery = useQuery({
    queryKey: ['jewish-hub-tanakh', selectedBook, chapter],
    queryFn: () => fetchChapter(selectedBook, chapter),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const verseRows = useMemo(() => buildVerseRows(chapterQuery.data), [chapterQuery.data]);
  const goToChapter = (nextChapter) => {
    const next = Number(nextChapter);
    if (Number.isInteger(next) && next >= 1 && next <= currentBook.chapters) setChapter(next);
  };

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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-indigo-100 bg-white text-indigo-700 shadow-sm">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">Tanakh</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Full Tanakh Reader
                </h1>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                  Hebrew and public-domain JPS 1917 English from Sefaria.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <label>
                  <span className="sr-only">Choose book</span>
                  <select
                    value={selectedBook}
                    onChange={(event) => {
                      setSelectedBook(event.target.value);
                      setChapter(1);
                    }}
                    className="h-11 w-full rounded-[18px] border border-slate-200 bg-white px-3 text-[14px] font-black text-slate-950 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    {TANAKH_SECTIONS.map((section) => (
                      <optgroup key={section.label} label={section.label}>
                        {section.books.map((item) => (
                          <option key={item.title} value={item.title}>
                            {item.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToChapter(chapter - 1)}
                    disabled={chapter <= 1}
                    className="motion-press flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-40"
                    aria-label="Previous chapter"
                  >
                    -
                  </button>
                  <select
                    value={chapter}
                    onChange={(event) => goToChapter(event.target.value)}
                    className="h-11 min-w-28 rounded-[18px] border border-slate-200 bg-white px-3 text-center text-[14px] font-black text-slate-950 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    {Array.from({ length: currentBook.chapters }, (_, index) => index + 1).map((number) => (
                      <option key={number} value={number}>
                        Chapter {number}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => goToChapter(chapter + 1)}
                    disabled={chapter >= currentBook.chapters}
                    className="motion-press flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-40"
                    aria-label="Next chapter"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 rounded-[18px] border border-slate-200 bg-white p-1">
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
            </div>

            {chapterQuery.isLoading && <TanakhLoading />}

            {!chapterQuery.isLoading && chapterQuery.error && (
              <div className="rounded-[20px] border border-rose-100 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[14px] font-black text-rose-900">Could not load {selectedBook} {chapter}</h2>
                    <p className="mt-1 text-[12px] font-semibold leading-snug text-rose-700">{chapterQuery.error.message}</p>
                    <button
                      type="button"
                      onClick={() => chapterQuery.refetch()}
                      className="motion-press mt-3 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-[12px] font-black text-white"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!chapterQuery.isLoading && !chapterQuery.error && (
              <>
                <div className="space-y-3">
                  {verseRows.map((verse) => (
                    <article key={verse.number} className="rounded-[26px] border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5">
                      <div className="mb-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-black text-slate-500">
                        {verse.number}
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
                  hebrew={chapterQuery.data?.hebrew}
                  english={chapterQuery.data?.english}
                  sefariaRef={chapterQuery.data?.ref}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function TanakhLoading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-[20px] border border-slate-100 bg-white p-3 shadow-sm">
          <div className="skeleton h-7 w-8 rounded-full" />
          <div className="skeleton mt-3 h-5 w-full rounded" />
          <div className="skeleton mt-2 h-5 w-5/6 rounded" />
          <div className="skeleton mt-4 h-4 w-full rounded" />
          <div className="skeleton mt-2 h-4 w-4/5 rounded" />
        </div>
      ))}
    </div>
  );
}
