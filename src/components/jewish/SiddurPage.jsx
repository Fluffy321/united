import React, { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookMarked, RefreshCw } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';

const SEFARIA_TEXTS_URL = 'https://www.sefaria.org/api/v3/texts';
const HEBREW_VERSION = {
  language: 'hebrew',
  responseLanguage: 'he',
  title: 'The Metsudah siddur, 1981',
  license: 'CC-BY',
};
const ENGLISH_VERSION = {
  language: 'english',
  responseLanguage: 'en',
  title: 'Sefaria Community Translation',
  license: 'CC0',
};

const PRAYERS = [
  {
    id: 'modeh-ani',
    title: 'Modeh Ani',
    hebrewTitle: 'מודה אני',
    group: 'Morning',
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Modeh Ani',
    english: false,
  },
  {
    id: 'asher-yatzar',
    title: 'Asher Yatzar',
    hebrewTitle: 'אשר יצר',
    group: 'Morning',
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Asher Yatzar',
    english: true,
  },
  {
    id: 'elokai-neshama',
    title: 'Elokai Neshama',
    hebrewTitle: 'אלהי נשמה',
    group: 'Morning',
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Elokai Neshama',
    english: false,
  },
  {
    id: 'ashrei',
    title: 'Ashrei',
    hebrewTitle: 'אשרי',
    group: 'Daily',
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Ashrei',
    english: true,
  },
  {
    id: 'shema',
    title: 'Shema',
    hebrewTitle: 'שמע',
    group: 'Daily',
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Shema',
    english: true,
  },
  {
    id: 'amidah',
    title: 'Shemoneh Esrei Structure',
    hebrewTitle: 'עמידה',
    group: 'Amidah',
    structureOnly: true,
  },
];

const AMIDAH_STRUCTURE = [
  'Opening praise',
  'Middle weekday requests',
  'Thanksgiving',
  'Peace',
];

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

function flattenText(text) {
  if (!Array.isArray(text)) return [];
  return text.flatMap((item) => (Array.isArray(item) ? flattenText(item) : [item]));
}

function getRequestedVersion(versions, expected, required = true) {
  const match = versions.find(
    (version) =>
      version.versionTitle === expected.title &&
      (version.language === expected.responseLanguage || version.language === expected.language)
  );

  if (!match) {
    if (!required) return null;
    throw new Error(`Sefaria did not return ${expected.title}.`);
  }

  if (!isAllowedLicense(match.license)) {
    throw new Error(`Blocked ${expected.title}: license "${match.license || 'missing'}" is not allowed.`);
  }

  return {
    title: match.versionTitle,
    license: match.license,
    text: flattenText(match.text).map(stripMarkup).filter(Boolean),
  };
}

async function fetchPrayer(prayer) {
  if (prayer.structureOnly) return { structureOnly: true };

  const params = new URLSearchParams();
  params.append('version', `${HEBREW_VERSION.language}|${HEBREW_VERSION.title}`);
  if (prayer.english) {
    params.append('version', `${ENGLISH_VERSION.language}|${ENGLISH_VERSION.title}`);
  }
  params.set('return_format', 'text_only');

  const response = await fetch(`${SEFARIA_TEXTS_URL}/${encodeURIComponent(prayer.ref)}?${params}`);
  if (!response.ok) {
    throw new Error(`Sefaria returned ${response.status} for ${prayer.title}.`);
  }

  const data = await response.json();
  const versions = Array.isArray(data?.versions) ? data.versions : [];
  return {
    ref: data?.ref || prayer.ref,
    hebrew: getRequestedVersion(versions, HEBREW_VERSION),
    english: prayer.english ? getRequestedVersion(versions, ENGLISH_VERSION, false) : null,
  };
}

export default function SiddurPage() {
  const [activeId, setActiveId] = useState(PRAYERS[0].id);
  const prayerQueries = useQueries({
    queries: PRAYERS.map((prayer) => ({
      queryKey: ['jewish-hub-siddur-prayer', prayer.id],
      queryFn: () => fetchPrayer(prayer),
      staleTime: 24 * 60 * 60 * 1000,
      retry: 1,
    })),
  });

  const activeIndex = PRAYERS.findIndex((prayer) => prayer.id === activeId);
  const activePrayer = PRAYERS[activeIndex] || PRAYERS[0];
  const activeQuery = prayerQueries[activeIndex];
  const groupedPrayers = useMemo(() => {
    return PRAYERS.reduce((groups, prayer) => {
      groups[prayer.group] = [...(groups[prayer.group] || []), prayer];
      return groups;
    }, {});
  }, []);

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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-emerald-100 bg-white text-emerald-700 shadow-sm">
                <BookMarked className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Siddur</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Daily Tefillos
                </h1>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                  A scoped starter set. Hebrew loads from Sefaria; English appears only when the requested CC0 translation is available.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            {Object.entries(groupedPrayers).map(([group, prayers]) => (
              <div key={group}>
                <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group}</p>
                <div className="grid gap-2">
                  {prayers.map((prayer) => (
                    <button
                      key={prayer.id}
                      type="button"
                      onClick={() => setActiveId(prayer.id)}
                      className={`motion-press flex items-center justify-between rounded-[18px] border px-3 py-3 text-left transition-colors ${
                        activeId === prayer.id
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                          : 'border-slate-100 bg-white text-slate-800'
                      }`}
                    >
                      <span className="text-[13px] font-black">{prayer.title}</span>
                      <span
                        dir="rtl"
                        lang="he"
                        className="text-[17px] font-semibold"
                        style={{ fontFamily: 'var(--font-hebrew)', fontKerning: 'normal' }}
                      >
                        {prayer.hebrewTitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <PrayerPanel prayer={activePrayer} query={activeQuery} />
          </div>
        </section>
      </div>
    </main>
  );
}

function PrayerPanel({ prayer, query }) {
  if (prayer.structureOnly) {
    return (
      <article className="rounded-[26px] border border-slate-100 bg-white px-4 py-5 shadow-sm sm:px-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Structure</p>
        <h2 className="mt-2 text-[22px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
          {prayer.title}
        </h2>
        <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
          This is a practical orientation only, not a full Amidah text and not halachic instruction.
        </p>
        <div className="mt-4 grid gap-2">
          {AMIDAH_STRUCTURE.map((item, index) => (
            <div key={item} className="rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-3">
              <p className="text-[12px] font-black text-slate-900">{index + 1}. {item}</p>
            </div>
          ))}
        </div>
      </article>
    );
  }

  if (query?.isLoading) {
    return (
      <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="skeleton h-6 w-32 rounded" />
        <div className="skeleton mt-3 h-5 w-full rounded" />
        <div className="skeleton mt-2 h-5 w-5/6 rounded" />
      </div>
    );
  }

  if (query?.error) {
    return (
      <div className="rounded-[20px] border border-rose-100 bg-rose-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-black text-rose-900">Could not load {prayer.title}</h2>
            <p className="mt-1 text-[12px] font-semibold leading-snug text-rose-700">{query.error.message}</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="motion-press mt-3 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-[12px] font-black text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rows = query?.data?.hebrew?.text || [];
  const englishRows = query?.data?.english?.text || [];

  return (
    <article className="rounded-[26px] border border-slate-100 bg-white px-4 py-5 shadow-sm sm:px-5">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{prayer.group}</p>
      <h2 className="mt-2 text-[22px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
        {prayer.title}
      </h2>
      <div className="mt-4 space-y-4">
        {rows.map((line, index) => (
          <div key={`${prayer.id}-${index}`} className="rounded-[22px] border border-slate-100 bg-[#FDFCF8] px-4 py-4">
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
              {line}
            </p>
            {englishRows[index] && (
              <p className="mt-4 border-t border-slate-200/70 pt-4 text-[15px] font-semibold leading-8 text-slate-700">
                {englishRows[index]}
              </p>
            )}
          </div>
        ))}
      </div>
      {!query?.data?.english && (
        <p className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-3 text-[12px] font-semibold leading-5 text-slate-500">
          Public-domain English is not available for this item in the selected Sefaria version, so only Hebrew is shown.
        </p>
      )}
      <p className="mt-4 px-1 text-[11px] font-semibold leading-snug text-slate-400">
        {query?.data?.hebrew?.title} ({query?.data?.hebrew?.license})
        {query?.data?.english ? ` · ${query.data.english.title} (${query.data.english.license})` : ''} · Source: Sefaria.
      </p>
    </article>
  );
}
