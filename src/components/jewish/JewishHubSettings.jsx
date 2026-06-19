import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, MapPin, Search, Settings2 } from 'lucide-react';
import DailyJewishHome from './DailyJewishHome';
import JewishHubBackButton from './JewishHubBackButton';
import useJewishHubPreferences from '@/hooks/useJewishHubPreferences';
import { forwardGeocode, PRESET_LOCATIONS } from '@/lib/shabbatLocation';
import { LEARNING_CYCLE_IDS } from '@/services/jewishHubPreferences';

const SECTION_LABELS = {
  tehillim: 'Tehillim',
  tanakh: 'Tanakh',
  parsha: 'Parsha',
  shiurim: 'Shiurim',
  'daily-learning': 'Daily Learning',
  siddur: 'Siddur',
  'divrei-torah': 'Divrei Torah',
};

const LEARNING_LABELS = {
  'daf-yomi': 'Daf Yomi',
  'mishnah-yomi': 'Mishnah Yomi',
  'daily-rambam': 'Daily Rambam',
};

const NUSACH_OPTIONS = [
  { id: 'ashkenaz', label: 'Ashkenaz' },
  { id: 'sefard', label: 'Sefard' },
  { id: 'edot-mizrach', label: 'Edot Mizrach' },
];

export default function JewishHubSettings() {
  const { preferences, setPreferences } = useJewishHubPreferences();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const setLocation = (location) => {
    setPreferences((current) => ({ ...current, location: { ...location, type: 'manual' } }));
  };

  const searchLocation = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    const found = await forwardGeocode(query.trim());
    setResults(found.slice(0, 5).map((item) => ({
      ...item,
      tzid: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    })));
    setSearching(false);
  };

  const toggleLearning = (id) => {
    setPreferences((current) => {
      const exists = current.learningCycles.includes(id);
      const nextCycles = exists
        ? current.learningCycles.filter((item) => item !== id)
        : [...current.learningCycles, id];
      return { ...current, learningCycles: nextCycles };
    });
  };

  const toggleSection = (id) => {
    setPreferences((current) => {
      const hidden = current.hiddenSections.includes(id);
      return {
        ...current,
        hiddenSections: hidden
          ? current.hiddenSections.filter((item) => item !== id)
          : [...current.hiddenSections, id],
      };
    });
  };

  const moveSection = (id, direction) => {
    setPreferences((current) => {
      const order = [...current.sectionOrder];
      const index = order.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return current;
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...current, sectionOrder: order };
    });
  };

  return (
    <main className="mobile-page min-h-screen px-3 pb-28 pt-4">
      <JewishHubBackButton />
      <div className="space-y-4">
        <DailyJewishHome compact />

        <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,28,46,0.07)]">
          <div className="border-b border-slate-100 bg-[#FDFCF8] px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-slate-200 bg-white text-slate-700 shadow-sm">
                <Settings2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Personal Jewish Hub</p>
                <h1 className="mt-2 text-[28px] font-black leading-none text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  Make it yours
                </h1>
                <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-500">
                  Saved for your signed-in account on this device.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-3 sm:p-4">
            <SettingsBlock title="Location" note="A named place is required before candle lighting and zmanim appear.">
              {preferences.location?.label && (
                <div className="mb-3 rounded-[18px] border border-blue-100 bg-blue-50 px-3 py-3 text-[12px] font-bold text-blue-900">
                  Current: {preferences.location.label}
                </div>
              )}
              <div className="grid gap-2">
                {PRESET_LOCATIONS.slice(0, 6).map((location) => (
                  <button
                    key={location.label}
                    type="button"
                    onClick={() => setLocation(location)}
                    className="motion-press flex items-center justify-between rounded-[18px] border border-slate-100 bg-white px-3 py-3 text-left text-[13px] font-black text-slate-800"
                  >
                    <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" />{location.label}</span>
                    {preferences.location?.label === location.label && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                ))}
              </div>
              <form onSubmit={searchLocation} className="mt-3 flex gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search another city"
                  className="h-11 min-w-0 flex-1 rounded-[18px] border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
                <button type="submit" className="motion-press flex h-11 w-11 items-center justify-center rounded-[18px] bg-slate-950 text-white" aria-label="Search location">
                  <Search className="h-4 w-4" />
                </button>
              </form>
              {searching && <p className="mt-2 text-[11px] font-bold text-slate-400">Searching</p>}
              {results.length > 0 && (
                <div className="mt-2 grid gap-2">
                  {results.map((location) => (
                    <button
                      key={`${location.label}-${location.lat}-${location.lng}`}
                      type="button"
                      onClick={() => setLocation(location)}
                      className="motion-press rounded-[18px] border border-slate-100 bg-white px-3 py-3 text-left text-[12px] font-bold text-slate-700"
                    >
                      {location.label}
                    </button>
                  ))}
                </div>
              )}
            </SettingsBlock>

            <SettingsBlock title="Nusach" note="Siddur text only appears where exact Sefaria refs are mapped for the selected nusach.">
              <div className="grid grid-cols-3 rounded-[18px] border border-slate-200 bg-white p-1">
                {NUSACH_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPreferences((current) => ({ ...current, nusach: option.id }))}
                    className={`h-10 rounded-xl text-[11px] font-black transition-colors ${
                      preferences.nusach === option.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 active:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </SettingsBlock>

            <SettingsBlock title="Daily Learning" note="Choose which cycles appear on your Learning page.">
              <div className="grid gap-2">
                {LEARNING_CYCLE_IDS.map((id) => (
                  <ToggleRow key={id} checked={preferences.learningCycles.includes(id)} label={LEARNING_LABELS[id]} onClick={() => toggleLearning(id)} />
                ))}
              </div>
            </SettingsBlock>

            <SettingsBlock title="Home Sections" note="Show, hide, and reorder the Jewish Hub index.">
              <div className="grid gap-2">
                {preferences.sectionOrder.map((id, index) => (
                  <div key={id} className="flex items-center gap-2 rounded-[18px] border border-slate-100 bg-white px-3 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSection(id)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-colors ${preferences.hiddenSections.includes(id) ? 'bg-slate-200' : 'bg-slate-950'}`}
                      aria-label={`Toggle ${SECTION_LABELS[id]}`}
                    >
                      <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${preferences.hiddenSections.includes(id) ? '' : 'translate-x-4'}`} />
                    </button>
                    <span className="min-w-0 flex-1 text-[13px] font-black text-slate-900">{SECTION_LABELS[id]}</span>
                    <button type="button" disabled={index === 0} onClick={() => moveSection(id, -1)} className="motion-press rounded-full p-2 text-slate-500 disabled:opacity-30" aria-label={`Move ${SECTION_LABELS[id]} up`}>
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={index === preferences.sectionOrder.length - 1} onClick={() => moveSection(id, 1)} className="motion-press rounded-full p-2 text-slate-500 disabled:opacity-30" aria-label={`Move ${SECTION_LABELS[id]} down`}>
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </SettingsBlock>
          </div>
        </section>
      </div>
    </main>
  );
}

function SettingsBlock({ title, note, children }) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-4">
      <h2 className="text-[16px] font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{note}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ToggleRow({ checked, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="motion-press flex items-center gap-3 rounded-[18px] border border-slate-100 bg-white px-3 py-3 text-left">
      <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${checked ? 'bg-slate-950' : 'bg-slate-200'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
      <span className="text-[13px] font-black text-slate-900">{label}</span>
    </button>
  );
}
