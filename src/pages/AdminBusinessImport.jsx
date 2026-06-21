import React, { useState } from 'react';
import { Loader2, Search, Check, MapPin, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';

const TOWNS = [
  { key: 'five towns', label: 'Five Towns (general)' },
  { key: 'cedarhurst',  label: 'Cedarhurst' },
  { key: 'lawrence',    label: 'Lawrence' },
  { key: 'woodmere',    label: 'Woodmere' },
  { key: 'hewlett',     label: 'Hewlett' },
  { key: 'inwood',      label: 'Inwood' },
];

// Mirrors BUSINESS_CATEGORIES in src/pages/Map.jsx, minus 'all' and 'eruv'
// (eruv isn't a searchable business category).
const CATEGORIES = [
  { key: 'attractions',      label: 'Attractions' },
  { key: 'childcare',        label: 'Babysitting / Childcare' },
  { key: 'beauty_services',  label: 'Beauty Services' },
  { key: 'car_services',     label: 'Car Services' },
  { key: 'chessed',          label: 'Chessed' },
  { key: 'food_dining',      label: 'Food & Dining' },
  { key: 'health',           label: 'Health' },
  { key: 'home_improvement', label: 'Home Improvement Services' },
  { key: 'hostess_gifts',    label: 'Hostess Gifts' },
  { key: 'local_businesses', label: 'Local Businesses' },
  { key: 'mikvahs',          label: 'Mikvahs' },
  { key: 'vacation_rentals', label: 'Vacation Rentals' },
];

async function invokeImportFn(payload) {
  const { data, error } = await supabase.functions.invoke('admin-import-businesses', { body: payload });
  if (error) throw new Error(error.message || 'Request failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function AdminBusinessImport() {
  const [town, setTown] = useState(TOWNS[0].key);
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [lastImport, setLastImport] = useState(null);

  const handleSearch = async () => {
    setSearching(true);
    setResults(null);
    setSelected(new Set());
    setLastImport(null);
    try {
      const data = await invokeImportFn({ action: 'search', category, town, query: query.trim() || undefined });
      setResults(data.results || []);
      const preselect = new Set(
        (data.results || []).filter((r) => !r.alreadyListed).map((r) => r.placeId)
      );
      setSelected(preselect);
    } catch (e) {
      toast.error(e.message || 'Search failed');
    }
    setSearching(false);
  };

  const toggleSelected = (placeId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const handleImport = async () => {
    if (!results || selected.size === 0) return;
    setImporting(true);
    try {
      const places = results
        .filter((r) => selected.has(r.placeId))
        .map((r) => ({ placeId: r.placeId, name: r.name, address: r.address, lat: r.lat, lng: r.lng }));
      const data = await invokeImportFn({ action: 'import', category, places });
      setLastImport(data);
      toast.success(`Imported ${data.imported?.length || 0} business${data.imported?.length === 1 ? '' : 'es'}`);
      if (data.skipped?.length) {
        toast.info(`Skipped ${data.skipped.length} (already listed or failed)`);
      }
      // Drop imported/skipped items from the result list so the admin sees what's left.
      setResults((prev) => prev.filter((r) => !selected.has(r.placeId)));
      setSelected(new Set());
    } catch (e) {
      toast.error(e.message || 'Import failed');
    }
    setImporting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Import Five Towns Businesses</h1>
        <p className="text-sm text-slate-500 mb-6">
          Searches Google Places for real businesses. Nothing is added to the directory until you
          review the results below and choose what to import.
        </p>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Town</label>
              <select
                value={town}
                onChange={(e) => setTown(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F5ED7]"
              >
                {TOWNS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F5ED7]"
              >
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Custom search (optional — overrides the category's default keywords)
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. kosher pizza"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F5ED7]"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[#0F5ED7] text-white font-semibold disabled:opacity-60"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {searching ? 'Searching...' : 'Search Google Places'}
          </button>
        </div>

        {results !== null && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-800">
                {results.length} result{results.length === 1 ? '' : 's'}
              </p>
              {results.length > 0 && (
                <p className="text-xs text-slate-500">{selected.size} selected</p>
              )}
            </div>

            {results.length === 0 && (
              <p className="text-sm text-slate-500">No results. Try a different town or custom search.</p>
            )}

            <div className="space-y-2">
              {results.map((r) => (
                <label
                  key={r.placeId}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-3 cursor-pointer ${
                    selected.has(r.placeId) ? 'border-[#0F5ED7] bg-blue-50/50' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(r.placeId)}
                    onChange={() => toggleSelected(r.placeId)}
                    className="mt-1 w-4 h-4 rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{r.name}</p>
                      {r.alreadyListed && (
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          Already listed
                        </span>
                      )}
                      {r.businessStatus === 'CLOSED_PERMANENTLY' && (
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                          Permanently closed
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {r.address}
                    </p>
                    {r.rating && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <Star className="w-3 h-3 shrink-0 text-amber-500" />
                        {r.rating}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {results.length > 0 && (
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-950 text-white font-semibold disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {importing ? 'Importing...' : `Import ${selected.size} selected`}
              </button>
            )}
          </div>
        )}

        {lastImport && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Import complete</span>
            </div>
            <p className="text-sm text-green-700">{lastImport.imported?.length || 0} added to the directory.</p>
            {lastImport.skipped?.length > 0 && (
              <p className="text-sm text-green-700">{lastImport.skipped.length} skipped (duplicate or failed).</p>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <AlertTriangle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 leading-5">
            Imported businesses are published immediately but are not marked Jewish-owned, kosher,
            or verified — Google Places has no way to know that. Those badges only appear once the
            actual owner claims the listing through the normal claim flow on the Map page.
          </p>
        </div>
      </div>
    </div>
  );
}
