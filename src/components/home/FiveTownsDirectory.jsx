import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Baby,
  BriefcaseBusiness,
  Building2,
  HeartPulse,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
  X,
} from 'lucide-react';
import DirectoryListingCard from './DirectoryListingCard';
import DirectoryFeaturedRail from './DirectoryFeaturedRail';
import DirectoryIntentRail from './DirectoryIntentRail';
import {
  DIRECTORY_INTENTS,
  DIRECTORY_GROUPS,
  FIVE_TOWNS_LISTINGS,
  featuredDirectoryListings,
  filterDirectoryListings,
  filterListingsByIntent,
  getDirectoryGroup,
} from '@/lib/directory/fiveTownsDirectory';

const GROUP_ICONS = {
  'jewish-life': Star,
  food: Utensils,
  family: Baby,
  shopping: ShoppingBag,
  health: HeartPulse,
  services: BriefcaseBusiness,
  community: Building2,
  'things-to-do': Sparkles,
};

const GROUP_TONES = {
  'jewish-life': 'bg-[#EEF1FF] text-[#3D4BC8]',
  food: 'bg-[#FFF4DF] text-[#9A5B00]',
  family: 'bg-[#EAF8FF] text-[#16749C]',
  shopping: 'bg-[#FFF0F6] text-[#B02F69]',
  health: 'bg-[#EAF9F1] text-[#16734A]',
  services: 'bg-[#EEF3F8] text-[#38546E]',
  community: 'bg-[#F2EEFF] text-[#6742B8]',
  'things-to-do': 'bg-[#FFF3E8] text-[#A04F18]',
};

const GROUP_SURFACES = {
  'jewish-life': 'border-indigo-200 bg-indigo-50/90',
  food: 'border-amber-200 bg-amber-50/90',
  family: 'border-sky-200 bg-sky-50/90',
  shopping: 'border-pink-200 bg-pink-50/90',
  health: 'border-emerald-200 bg-emerald-50/90',
  services: 'border-slate-200 bg-slate-100/90',
  community: 'border-violet-200 bg-violet-50/90',
  'things-to-do': 'border-orange-200 bg-orange-50/90',
};

const GROUP_INTENT_PRESENTATION = {
  food: [
    ['dinner-tonight', 'Good for dinner'],
    ['coffee', 'Coffee and a seat'],
    ['shabbat-shopping', 'Shabbat shopping'],
  ],
  family: [['kids', 'Out with the kids']],
  shopping: [
    ['shabbat-shopping', 'Shabbat shopping'],
    ['coffee', 'Coffee and a seat'],
  ],
  'things-to-do': [['kids', 'Out with the kids']],
};

export default function FiveTownsDirectory({
  initialGroupId = '',
  initialListingId = '',
  onClose,
  onReportCorrection,
}) {
  const initialListing = FIVE_TOWNS_LISTINGS.find((listing) => listing.id === initialListingId) || null;
  const [groupId, setGroupId] = useState(initialGroupId || initialListing?.groupId || '');
  const [categoryId, setCategoryId] = useState('');
  const [town, setTown] = useState('');
  const [query, setQuery] = useState('');
  const [activeIntentId, setActiveIntentId] = useState('');
  const [selectedListing, setSelectedListing] = useState(initialListing);
  const activeGroup = getDirectoryGroup(groupId);

  const results = useMemo(() => {
    const intentListings = filterListingsByIntent(FIVE_TOWNS_LISTINGS, activeIntentId);
    return filterDirectoryListings(intentListings, {
      groupId,
      categoryId,
      town,
      query,
    });
  }, [activeIntentId, categoryId, groupId, query, town]);

  const rootFeaturedListings = useMemo(() => featuredDirectoryListings(FIVE_TOWNS_LISTINGS, { limit: 100 })
    .sort((left, right) => Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl)))
    .slice(0, 8), []);

  const groupFeaturedListings = useMemo(() => (groupId
    ? featuredDirectoryListings(FIVE_TOWNS_LISTINGS, { groupId, limit: 100 })
      .sort((left, right) => Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl)))
      .slice(0, 8)
    : []), [groupId]);

  const groupIntents = useMemo(() => (GROUP_INTENT_PRESENTATION[groupId] || [])
    .map(([intentId, label]) => {
      const intent = DIRECTORY_INTENTS.find((item) => item.id === intentId);
      return intent ? { ...intent, label } : null;
    })
    .filter(Boolean), [groupId]);

  const openGroup = (nextGroupId) => {
    setGroupId(nextGroupId);
    setCategoryId('');
    setQuery('');
    setActiveIntentId('');
    setSelectedListing(null);
  };

  const openIntent = (intentId) => {
    setActiveIntentId(intentId);
    setGroupId('');
    setCategoryId('');
    setTown('');
    setQuery('');
    setSelectedListing(null);
  };

  const goBack = () => {
    if (selectedListing) {
      setSelectedListing(null);
      return;
    }
    if (groupId) {
      setGroupId('');
      setCategoryId('');
      setTown('');
      setQuery('');
      setActiveIntentId('');
      return;
    }
    if (activeIntentId) {
      setActiveIntentId('');
      return;
    }
    onClose?.();
  };

  return (
    <section role="dialog" aria-modal="true" aria-label="Five Towns directory" className="fixed inset-0 z-[90] mx-auto flex w-full max-w-md flex-col overflow-hidden bg-[#F5F7FB] text-[#0F1C2E]">
      <header className="shrink-0 border-b border-slate-200/80 bg-white px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="flex min-h-11 items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2F67EC]">Five Towns directory</p>
            <h1 className="truncate text-[20px] font-black tracking-[-0.035em]">
              {selectedListing?.name || activeGroup?.label || 'Find anything local'}
            </h1>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close directory"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {!selectedListing && (
          <label className="mt-3 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-[#F8FAFD] px-4 shadow-inner shadow-slate-100">
            <Search className="h-4 w-4 shrink-0 text-[#2F67EC]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the Five Towns"
              className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none placeholder:text-slate-400"
            />
          </label>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(28px+env(safe-area-inset-bottom))] pt-4">
        {selectedListing ? (
          <div className="space-y-4">
            <DirectoryListingCard
              listing={selectedListing}
              onReportCorrection={onReportCorrection}
            />
            {selectedListing.description && (
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-[13px] font-medium leading-relaxed text-slate-600">
                {selectedListing.description}
              </div>
            )}
            <div className="rounded-[22px] border border-blue-100 bg-[#EEF4FF] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2456D8]">Checked information</p>
              <p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-600">
                {selectedListing.sourceLabel}. {selectedListing.lastChecked
                  ? `Last checked ${selectedListing.lastChecked}.`
                  : 'Open the source to confirm the latest details.'}
              </p>
            </div>
          </div>
        ) : !groupId && !query && !activeIntentId ? (
          <>
            <div className="mb-3 px-1">
              <p className="text-[13px] font-semibold leading-relaxed text-slate-500">
                Start with what you need, or browse every sourced place below.
              </p>
            </div>
            <DirectoryIntentRail
              intents={DIRECTORY_INTENTS}
              activeIntentId={activeIntentId}
              onSelect={openIntent}
            />
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {DIRECTORY_GROUPS.map((group) => {
                const Icon = GROUP_ICONS[group.id];
                const count = FIVE_TOWNS_LISTINGS.filter((item) => item.groupId === group.id).length;
                return (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => openGroup(group.id)}
                    className={`min-h-[148px] rounded-[24px] border p-4 text-left shadow-[0_8px_24px_rgba(15,28,46,0.045)] active:scale-[0.98] ${GROUP_SURFACES[group.id]}`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${GROUP_TONES[group.id]}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="mt-4 block text-[15px] font-black tracking-[-0.02em]">{group.label}</span>
                    <span className="mt-1 block text-[10px] font-semibold leading-snug text-slate-600">{group.description}</span>
                    <span className="mt-2 block text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">{count} sourced places</span>
                  </button>
                );
              })}
            </div>
            <DirectoryFeaturedRail
              listings={rootFeaturedListings}
              onOpen={setSelectedListing}
            />
          </>
        ) : (
          <>
            {activeGroup && (
              <div className="mb-4">
                <p className="px-1 text-[12px] font-semibold leading-relaxed text-slate-500">{activeGroup.description}</p>
                {groupIntents.length > 0 && (
                  <div className="mt-3">
                    <DirectoryIntentRail
                      intents={groupIntents}
                      activeIntentId={activeIntentId}
                      onSelect={setActiveIntentId}
                    />
                  </div>
                )}
                <DirectoryFeaturedRail
                  title={`${activeGroup.label} worth knowing`}
                  listings={groupFeaturedListings}
                  onOpen={setSelectedListing}
                />
                <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryId('');
                      setActiveIntentId('');
                    }}
                    className={`min-h-10 shrink-0 rounded-full border px-4 text-[11px] font-black ${categoryId ? 'border-slate-200 bg-white text-slate-600' : 'border-[#2456D8] bg-[#2456D8] text-white'}`}
                  >
                    All
                  </button>
                  {activeGroup.categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => {
                        setCategoryId(category.id);
                        setActiveIntentId('');
                      }}
                      className={`min-h-10 shrink-0 rounded-full border px-4 text-[11px] font-black ${categoryId === category.id ? 'border-[#2456D8] bg-[#2456D8] text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <p className="text-[12px] font-black text-slate-700">{results.length} sourced listings</p>
              <select
                aria-label="Filter by town"
                value={town}
                onChange={(event) => setTown(event.target.value)}
                className="min-h-10 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600"
              >
                <option value="">All towns</option>
                {['Cedarhurst', 'Lawrence', 'Woodmere', 'Hewlett', 'Inwood', 'North Woodmere'].map((place) => (
                  <option key={place} value={place}>{place}</option>
                ))}
              </select>
            </div>

            {results.length > 0 ? (
              <div className="space-y-2.5">
                {results.map((listing) => (
                  <DirectoryListingCard
                    key={listing.id}
                    listing={listing}
                    onOpen={setSelectedListing}
                    onReportCorrection={onReportCorrection}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="text-[15px] font-black">No verified listings match this search yet.</p>
                <button type="button" onClick={() => onReportCorrection?.(null)} className="mt-3 min-h-11 rounded-full bg-[#2456D8] px-5 text-[12px] font-black text-white">
                  Suggest a missing listing
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
