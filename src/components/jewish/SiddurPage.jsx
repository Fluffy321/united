import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookMarked, RefreshCw } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';
import useJewishHubPreferences from '@/hooks/useJewishHubPreferences';

const SEFARIA_TEXTS_URL = 'https://www.sefaria.org/api/v3/texts';

const DEFAULT_HEBREW_VERSION = {
  language: 'hebrew',
  responseLanguage: 'he',
  title: 'The Metsudah siddur, 1981',
  license: 'CC-BY',
};

const DAAT_HEBREW_VERSION = {
  language: 'hebrew',
  responseLanguage: 'he',
  title: 'Daat Siddur Ashkenaz',
  license: 'Public Domain',
};

const ENGLISH_VERSION = {
  language: 'english',
  responseLanguage: 'en',
  title: 'Sefaria Community Translation',
  license: 'CC0',
};

const ASHKENAZ_SECTIONS = [
  {
    id: 'morning',
    label: 'Birchos Hashachar',
    items: [
      prayer('modeh-ani', 'Modeh Ani', 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Modeh Ani', { english: false }),
      prayer('asher-yatzar', 'Asher Yatzar', 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Asher Yatzar'),
      prayer('elokai-neshama', 'Elokai Neshama', 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Elokai Neshama', { english: false }),
      prayer('torah-blessings', 'Torah Blessings', 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Torah Blessings'),
      prayer('morning-blessings', 'Morning Blessings', 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Morning Blessings'),
    ],
  },
  {
    id: 'pesukei',
    label: "Pesukei D'zimra",
    items: [
      prayer('barukh-sheamar', "Barukh She'amar", "Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Barukh She'amar"),
      prayer('hodu', 'Hodu', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Hodu'),
      prayer('mizmor-letoda', 'Mizmor Letoda', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Mizmor Letoda'),
      prayer('ashrei', 'Ashrei', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Ashrei'),
      prayer('psalm-146', 'Psalm 146', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Psalm 146'),
      prayer('psalm-147', 'Psalm 147', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Psalm 147'),
      prayer('psalm-148', 'Psalm 148', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Psalm 148'),
      prayer('psalm-149', 'Psalm 149', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Psalm 149'),
      prayer('psalm-150', 'Psalm 150', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Psalm 150'),
      prayer('vayevarech-david', 'Vayevarech David', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Vayevarech David'),
      prayer('az-yashir', 'Az Yashir', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Az Yashir'),
      prayer('yishtabach', 'Yishtabach', 'Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Yishtabach'),
    ],
  },
  {
    id: 'shema',
    label: 'Shema and Brachos',
    items: [
      prayer('barchu', 'Barchu', 'Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Barchu'),
      prayer('yotzer-or', 'First Blessing before Shema', 'Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, First Blessing before Shema'),
      prayer('ahavat-yisrael', 'Second Blessing before Shema', 'Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Second Blessing before Shema'),
      prayer('shema', 'Shema', 'Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Shema'),
      prayer('geulah', 'Blessing after Shema', 'Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Blessing after Shema'),
    ],
  },
  {
    id: 'amidah',
    label: 'Weekday Shemoneh Esrei',
    items: [
      prayer('amidah-patriarchs', 'Patriarchs', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Patriarchs'),
      prayer('amidah-might', 'Divine Might', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Divine Might'),
      prayer('amidah-holiness', 'Holiness of God', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Holiness of God'),
      prayer('amidah-knowledge', 'Knowledge', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Knowledge'),
      prayer('amidah-repentance', 'Repentance', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Repentance'),
      prayer('amidah-forgiveness', 'Forgiveness', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Forgiveness'),
      prayer('amidah-redemption', 'Redemption', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Redemption'),
      prayer('amidah-healing', 'Healing', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Healing'),
      prayer('amidah-prosperity', 'Prosperity', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Prosperity'),
      prayer('amidah-exiles', 'Gathering the Exiles', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Gathering the Exiles'),
      prayer('amidah-justice', 'Justice', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Justice'),
      prayer('amidah-enemies', 'Against Enemies', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Against Enemies'),
      prayer('amidah-righteous', 'The Righteous', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, The Righteous'),
      prayer('amidah-jerusalem', 'Rebuilding Jerusalem', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Rebuilding Jerusalem'),
      prayer('amidah-david', 'Kingdom of David', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Kingdom of David'),
      prayer('amidah-prayer', 'Response to Prayer', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Response to Prayer'),
      prayer('amidah-service', 'Temple Service', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Temple Service'),
      prayer('amidah-thanksgiving', 'Thanksgiving', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Thanksgiving'),
      prayer('amidah-kohanim', 'Birkat Kohanim', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Birkat Kohanim'),
      prayer('amidah-peace', 'Peace', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Peace'),
      prayer('amidah-concluding', 'Concluding Passage', 'Siddur Ashkenaz, Weekday, Shacharit, Amidah, Concluding Passage'),
    ],
  },
  {
    id: 'closing',
    label: 'Closing and Meals',
    items: [
      prayer('aleinu', 'Aleinu', 'Siddur Ashkenaz, Shabbat, Maariv, Aleinu', { english: false }),
      prayer('birkat-hamazon', 'Birkas Hamazon', 'Siddur Ashkenaz, Berachot, Birkat HaMazon'),
    ],
  },
  {
    id: 'brachos',
    label: 'Common Brachos',
    items: [
      prayer('brachos-rishonos', 'Brachos Rishonos', 'Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Barachot Rishonot', { hebrewVersion: DAAT_HEBREW_VERSION }),
      prayer('al-hamichyah', 'Al Hamichyah', 'Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Brachot Achronot, Al Hamichyah', { hebrewVersion: DAAT_HEBREW_VERSION, english: false }),
      prayer('borei-nefashot', 'Borei Nefashot', 'Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Brachot Achronot, Borei Nefashot', { hebrewVersion: DAAT_HEBREW_VERSION, english: false }),
      prayer('tefillat-haderech', 'Tefillas Haderech', 'Siddur Ashkenaz, Berachot, Tefillat HaDerech', { hebrewVersion: DAAT_HEBREW_VERSION }),
    ],
  },
];

const SEFARD_SECTIONS = [
  {
    id: 'daily',
    label: 'Daily',
    items: [
      prayer('modeh-ani', 'Modeh Ani', 'Siddur Sefard, Upon Arising, Modeh Ani', { english: false }),
      prayer('morning-blessings', 'Morning Blessings', 'Siddur Sefard, Weekday Shacharit, Morning Blessings', { english: false }),
      prayer('shema', 'The Shema', 'Siddur Sefard, Weekday Shacharit, The Shema', { english: false }),
      prayer('amidah', 'Amidah', 'Siddur Sefard, Weekday Shacharit, Amidah', { english: false }),
      prayer('ashrei', 'Ashrei', 'Siddur Sefard, Weekday Shacharit, Ashrei', { english: false }),
      prayer('aleinu', 'Aleinu', 'Siddur Sefard, Weekday Shacharit, Aleinu', { english: false }),
    ],
  },
];

const EDOT_MIZRACH_SECTIONS = [
  {
    id: 'daily',
    label: 'Daily',
    items: [
      prayer('modeh-ani', 'Modeh Ani', 'Siddur Edot HaMizrach, Preparatory Prayers, Modeh Ani', { english: false }),
      prayer('morning-blessings', 'Morning Blessings', 'Siddur Edot HaMizrach, Preparatory Prayers, Morning Blessings', { english: false }),
      prayer('shema', 'The Shema', 'Siddur Edot HaMizrach, Weekday Shacharit, The Shema', { english: false }),
      prayer('ashrei', 'Ashrei', 'Siddur Edot HaMizrach, Weekday Shacharit, Ashrei', { english: false }),
    ],
  },
];

const NUSACH_CONFIG = {
  ashkenaz: { label: 'Ashkenaz', sections: ASHKENAZ_SECTIONS },
  sefard: { label: 'Sefard', sections: SEFARD_SECTIONS },
  'edot-mizrach': { label: 'Edot Mizrach', sections: EDOT_MIZRACH_SECTIONS },
};

function prayer(id, title, ref, options = {}) {
  return {
    id,
    title,
    ref,
    english: options.english !== false,
    hebrewVersion: options.hebrewVersion || DEFAULT_HEBREW_VERSION,
  };
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

async function fetchPrayer(item) {
  const params = new URLSearchParams();
  params.append('version', `${item.hebrewVersion.language}|${item.hebrewVersion.title}`);
  if (item.english) {
    params.append('version', `${ENGLISH_VERSION.language}|${ENGLISH_VERSION.title}`);
  }
  params.set('return_format', 'text_only');

  const response = await fetch(`${SEFARIA_TEXTS_URL}/${encodeURIComponent(item.ref)}?${params}`);
  if (!response.ok) {
    throw new Error(`Sefaria returned ${response.status} for ${item.title}.`);
  }

  const data = await response.json();
  const versions = Array.isArray(data?.versions) ? data.versions : [];
  return {
    ref: data?.ref || item.ref,
    hebrew: getRequestedVersion(versions, item.hebrewVersion),
    english: item.english ? getRequestedVersion(versions, ENGLISH_VERSION, false) : null,
  };
}

export default function SiddurPage() {
  const { preferences } = useJewishHubPreferences();
  const config = NUSACH_CONFIG[preferences.nusach] || NUSACH_CONFIG.ashkenaz;
  const siddurSections = config.sections;
  const allItems = useMemo(() => siddurSections.flatMap((section) => section.items), [siddurSections]);
  const [activeSectionId, setActiveSectionId] = useState(siddurSections[0].id);
  const [activeId, setActiveId] = useState(siddurSections[0].items[0].id);
  const activeItem = allItems.find((item) => item.id === activeId) || allItems[0];
  const activeSection = siddurSections.find((section) => section.id === activeSectionId) || siddurSections[0];

  React.useEffect(() => {
    setActiveSectionId(siddurSections[0].id);
    setActiveId(siddurSections[0].items[0].id);
  }, [preferences.nusach, siddurSections]);

  const prayerQuery = useQuery({
    queryKey: ['jewish-hub-siddur-prayer', activeItem.id, activeItem.ref, activeItem.hebrewVersion.title],
    queryFn: () => fetchPrayer(activeItem),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const chooseSection = (section) => {
    setActiveSectionId(section.id);
    setActiveId(section.items[0].id);
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-emerald-100 bg-white text-emerald-700 shadow-sm">
                <BookMarked className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Siddur</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Weekday Siddur
                </h1>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                  Nusach {config.label}. Every tefillah line shown here is loaded from Sefaria at runtime.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {siddurSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => chooseSection(section)}
                  className={`motion-press shrink-0 rounded-[16px] border px-3 py-2 text-[12px] font-black transition-colors ${
                    activeSectionId === section.id
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-slate-100 bg-white text-slate-500'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            <div className="grid gap-2">
              {activeSection.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={`motion-press rounded-[18px] border px-3 py-3 text-left transition-colors ${
                    activeId === item.id
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-slate-100 bg-white text-slate-800'
                  }`}
                >
                  <span className="block text-[13px] font-black leading-tight">{item.title}</span>
                  <span className="mt-1 block truncate text-[10px] font-bold text-slate-400">{item.ref}</span>
                </button>
              ))}
            </div>

            <PrayerPanel item={activeItem} query={prayerQuery} />
          </div>
        </section>
      </div>
    </main>
  );
}

function PrayerPanel({ item, query }) {
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
            <h2 className="text-[14px] font-black text-rose-900">Could not load {item.title}</h2>
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
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Siddur</p>
      <h2 className="mt-2 text-[22px] font-black leading-tight text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
        {item.title}
      </h2>
      <p className="mt-2 text-[11px] font-bold leading-5 text-slate-400">{query?.data?.ref || item.ref}</p>

      <div className="mt-4 space-y-4">
        {rows.map((line, index) => (
          <div key={`${item.id}-${index}`} className="rounded-[22px] border border-slate-100 bg-[#FDFCF8] px-4 py-4">
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
          Open-licensed English is not available for this item in the selected Sefaria version, so only Hebrew is shown.
        </p>
      )}

      <p className="mt-4 px-1 text-[11px] font-semibold leading-snug text-slate-400">
        {query?.data?.hebrew?.title} ({query?.data?.hebrew?.license})
        {query?.data?.english ? ` · ${query.data.english.title} (${query.data.english.license})` : ''} · Source: Sefaria.
      </p>
    </article>
  );
}
