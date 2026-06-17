import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, WifiOff } from 'lucide-react';

const SEFARIA_TEXTS_URL = 'https://www.sefaria.org/api/v3/texts';
const TOTAL_PERAKIM = 150;
const CACHE_PREFIX = 'junited:tehillim:v1';

const HEBREW_VERSION = {
  language: 'hebrew',
  responseLanguage: 'he',
  title: 'Miqra according to the Masorah',
  license: 'CC-BY-SA',
};

const RENDER_SHEM_AS_HASHEM = false;

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

if (typeof console !== 'undefined') {
  console.info(
    '[JUnited Tehillim] Sefaria versions:',
    `${HEBREW_VERSION.title} (${HEBREW_VERSION.license});`,
    `${ENGLISH_VERSION.title} (${ENGLISH_VERSION.license})`
  );
}

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

function cacheKey(perek) {
  return `${CACHE_PREFIX}:${perek}:${encodeURIComponent(HEBREW_VERSION.title)}:${encodeURIComponent(ENGLISH_VERSION.title)}`;
}

function readCachedPerek(perek) {
  try {
    const raw = window.localStorage?.getItem(cacheKey(perek));
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
    // Cache is a speed hint only.
  }

  return null;
}

function writeCachedPerek(perek, payload) {
  try {
    window.localStorage?.setItem(cacheKey(perek), JSON.stringify(payload));
  } catch {
    // Storage can be unavailable in private modes; the reader should still work.
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
    text: Array.isArray(match.text) ? match.text.map(stripMarkup) : [],
  };
}

async function fetchPerekFromSefaria(perek) {
  const params = new URLSearchParams();
  params.append('version', `${HEBREW_VERSION.language}|${HEBREW_VERSION.title}`);
  params.append('version', `${ENGLISH_VERSION.language}|${ENGLISH_VERSION.title}`);
  params.set('return_format', 'text_only');

  const response = await fetch(`${SEFARIA_TEXTS_URL}/${encodeURIComponent(`Psalms ${perek}`)}?${params}`);
  if (!response.ok) {
    throw new Error(`Sefaria returned ${response.status} for Psalm ${perek}.`);
  }

  const data = await response.json();
  const versions = Array.isArray(data?.versions) ? data.versions : [];
  const hebrew = getRequestedVersion(versions, HEBREW_VERSION);
  const english = getRequestedVersion(versions, ENGLISH_VERSION);

  return {
    perek,
    ref: data?.ref || `Psalms ${perek}`,
    fetchedAt: new Date().toISOString(),
    hebrew,
    english,
  };
}

function buildVerseRows(perekData) {
  const hebrew = perekData?.hebrew?.text || [];
  const english = perekData?.english?.text || [];
  const total = Math.max(hebrew.length, english.length);

  return Array.from({ length: total }, (_, index) => ({
    number: index + 1,
    hebrew: transformHebrewForDisplay(hebrew[index] || ''),
    english: english[index] || '',
  }));
}

function transformHebrewForDisplay(text) {
  if (!RENDER_SHEM_AS_HASHEM || !text) return text;
  return text.replace(/י[\u0591-\u05C7]*ה[\u0591-\u05C7]*ו[\u0591-\u05C7]*ה/g, 'ה׳');
}

function attributionText(version) {
  if (!version?.license) return null;
  const license = version.license.toLowerCase();

  if (license.includes('cc-by')) {
    return `${version.title} (${version.license})`;
  }

  return `${version.title} (${version.license})`;
}

export default function TehillimReader() {
  const [perek, setPerek] = useState(23);
  const [viewMode, setViewMode] = useState('both');
  const [perekData, setPerekData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usedCache, setUsedCache] = useState(false);

  const verseRows = useMemo(() => buildVerseRows(perekData), [perekData]);
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

  const loadPerek = useCallback(async (nextPerek, { force = false } = {}) => {
    setIsLoading(true);
    setError(null);
    setUsedCache(false);

    if (!force) {
      const cached = readCachedPerek(nextPerek);
      if (cached) {
        setPerekData(cached);
        setUsedCache(true);
        setIsLoading(false);
        return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setPerekData(null);
      setError('You appear to be offline. Connect to the internet or retry when service returns.');
      setIsLoading(false);
      return;
    }

    try {
      const fresh = await fetchPerekFromSefaria(nextPerek);
      writeCachedPerek(nextPerek, fresh);
      setPerekData(fresh);
    } catch (loadError) {
      setPerekData(null);
      setError(loadError.message || 'Unable to load Tehillim right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPerek(perek);
  }, [loadPerek, perek]);

  const goToPerek = (value) => {
    const next = Number(value);
    if (Number.isInteger(next) && next >= 1 && next <= TOTAL_PERAKIM) {
      setPerek(next);
    }
  };

  return (
    <div className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <Link
        to="/JewishHub"
        className="motion-press mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-700 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Jewish Hub
      </Link>

      <section className="rounded-[24px] border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-rose-500">Tehillim</p>
            <h1 className="mt-1 text-[24px] font-black leading-tight text-slate-950">Psalms Reader</h1>
            <p className="mt-2 text-[13px] font-semibold leading-snug text-slate-500">
              Choose a perek and take a quiet minute to say Tehillim. Hebrew and public-domain English load one perek at a time from Sefaria.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-3">
          <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPerek(perek - 1)}
                disabled={perek <= 1}
                className="motion-press flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-40"
                aria-label="Previous perek"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <label className="min-w-0 flex-1">
                <span className="sr-only">Choose perek</span>
                <select
                  value={perek}
                  onChange={(event) => goToPerek(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-center text-[14px] font-black text-slate-950 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {Array.from({ length: TOTAL_PERAKIM }, (_, index) => index + 1).map((number) => (
                    <option key={number} value={number}>
                      Psalm {number}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => goToPerek(perek + 1)}
                disabled={perek >= TOTAL_PERAKIM}
                className="motion-press flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-40"
                aria-label="Next perek"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 rounded-2xl border border-slate-200 bg-white p-1">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  className={`h-9 rounded-xl text-[12px] font-black transition-colors ${
                    viewMode === mode.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 active:bg-slate-100'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {usedCache && (
            <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-700">
              Showing a saved copy. Refresh to check Sefaria for the latest version.
            </p>
          )}

          {isLoading && <TehillimLoading />}

          {!isLoading && error && (
            <div className="rounded-[20px] border border-rose-100 bg-rose-50 p-4">
              <div className="flex items-start gap-3">
                {isOffline ? (
                  <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-[14px] font-black text-rose-900">Could not load Psalm {perek}</h2>
                  <p className="mt-1 text-[12px] font-semibold leading-snug text-rose-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => loadPerek(perek, { force: true })}
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
                  <article key={verse.number} className="rounded-[20px] border border-slate-100 bg-white p-3 shadow-sm">
                    <div className="mb-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-black text-slate-500">
                      {verse.number}
                    </div>

                    {(viewMode === 'both' || viewMode === 'hebrew') && verse.hebrew && (
                      <p
                        dir="rtl"
                        lang="he"
                        className="text-right font-serif text-[21px] font-semibold leading-9 text-slate-950"
                      >
                        {verse.hebrew}
                      </p>
                    )}

                    {(viewMode === 'both' || viewMode === 'english') && verse.english && (
                      <p className={`${viewMode === 'both' && verse.hebrew ? 'mt-3 border-t border-slate-100 pt-3' : ''} text-[15px] font-semibold leading-7 text-slate-700`}>
                        {verse.english}
                      </p>
                    )}
                  </article>
                ))}
              </div>

              <Credits hebrew={perekData?.hebrew} english={perekData?.english} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function TehillimLoading() {
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

function Credits({ hebrew, english }) {
  const credits = [attributionText(hebrew), attributionText(english)].filter(Boolean);

  return (
    <p className="px-1 pb-2 text-[11px] font-semibold leading-snug text-slate-400">
      {credits.join(' · ')} · Source: Sefaria.
    </p>
  );
}
