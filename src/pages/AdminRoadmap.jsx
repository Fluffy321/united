import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CircleDashed,
  Filter,
  Flag,
  List,
  Rocket,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROADMAP, STATUS } from '../../internal/roadmap.js';

// ─── Release Plan ordering ────────────────────────────────────────────────────
// Single source: internal/release-plan.md — updated 2026-06-22

const RELEASE_PLAN = {
  beta: {
    label: 'Beta',
    description: 'Must ship before / during beta.',
    color: 'rose',
    items: [
      'page-level-error-boundaries',
    ],
  },
  tier1: {
    label: 'Post-Beta · Tier 1',
    description: 'High priority, foundational. Nearly everything else depends on these.',
    color: 'amber',
    items: [
      'stripe-connect-payout-foundation',
      'connect-platform-payments-application-fees',
      'apple-signin',
    ],
  },
  tier2: {
    label: 'Post-Beta · Tier 2',
    description: 'Medium priority. Ship once Communities is re-enabled and payments are stable.',
    color: 'blue',
    items: [
      'mitzvah-payments-reimbursements',
      'verified-community',
      'community-pro-plan',
      'community-scheduled-announcements-digests',
      'community-notification-targeting-reminders',
      'community-notification-preferences',
      'advanced-community-analytics-dashboard',
      'community-resource-library-2',
      'community-invite-email',
      'business-reviews',
      'ride-requests',
      'chesed-hours',
      'mitzvah-recurring-needs',
      'yahrzeit-refuah',
      'desktop-responsive-shell',
    ],
  },
  tier3: {
    label: 'Post-Beta · Tier 3',
    description: 'Low priority / exploratory. Nice-to-have once the core is stable.',
    color: 'slate',
    items: [
      'community-home-section-ordering',
      'community-key-contacts-reorder',
      'community-recognition-badges',
      'group-extended-tabs',
      'newsletter-system',
      'meal-train-map-pins',
      'shul-directory',
      'candle-lighting-minhag-offset',
      'candle-lighting-location-sync',
      'business-promotions',
      'organization-pages',
      'feed-author-enrichment',
      'mta-transit-ingestion',
      'private-publishers',
      'news-aggregation',
      'premium-analytics',
      'ai-feedback-triage',
      'ux-design-token-system',
      'typescript-migration',
      'ai-assistant',
      'ai-community-setup',
    ],
  },
};

// Index roadmap by id for O(1) lookup
const BY_ID = Object.fromEntries(ROADMAP.map((item) => [item.id, item]));

// Active = not shipped and not dropped
const ACTIVE_STATUSES = new Set([STATUS.PLANNED, STATUS.EXPLORING, STATUS.BLOCKED, STATUS.DEFERRED]);

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const STATUS_META = {
  [STATUS.PLANNED]:   { label: 'Planned',   className: 'bg-blue-50 text-blue-700 border-blue-100' },
  [STATUS.EXPLORING]: { label: 'Exploring', className: 'bg-violet-50 text-violet-700 border-violet-100' },
  [STATUS.BLOCKED]:   { label: 'Blocked',   className: 'bg-rose-50 text-rose-700 border-rose-100' },
  [STATUS.DEFERRED]:  { label: 'Deferred',  className: 'bg-amber-50 text-amber-700 border-amber-100' },
  [STATUS.SHIPPED]:   { label: 'Shipped',   className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  [STATUS.DROPPED]:   { label: 'Dropped',   className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const TRACK_COLORS = {
  rose:  { header: 'bg-rose-50 border-rose-200',   badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500'  },
  amber: { header: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  blue:  { header: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-700',  dot: 'bg-blue-500'  },
  slate: { header: 'bg-slate-50 border-slate-200', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

function Badge({ children, className = 'bg-slate-100 text-slate-600 border-slate-200' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-black ${className}`}>
      {children}
    </span>
  );
}

function RoadmapCard({ item }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{item.category}</p>
          <h2 className="mt-1 text-base font-black leading-tight text-slate-950">{item.title}</h2>
        </div>
        <Badge className={STATUS_META[item.status]?.className}>{STATUS_META[item.status]?.label ?? item.status}</Badge>
      </div>
      {item.description && (
        <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-600">{item.description}</p>
      )}
      {item.why && (
        <p className="mt-1 text-[12px] font-medium leading-5 text-slate-500">{item.why}</p>
      )}
    </article>
  );
}

// ─── Release Plan view ────────────────────────────────────────────────────────

function ReleasePlanView() {
  return (
    <div className="space-y-6">
      {Object.values(RELEASE_PLAN).map((track) => {
        const colors = TRACK_COLORS[track.color];
        const resolvedItems = track.items
          .map((id) => BY_ID[id])
          .filter(Boolean)
          .filter((item) => ACTIVE_STATUSES.has(item.status));

        if (resolvedItems.length === 0) return null;

        return (
          <section key={track.label}>
            <div className={`mb-3 flex items-center gap-3 rounded-2xl border p-3 ${colors.header}`}>
              <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black text-slate-900">{track.label}</p>
                <p className="text-[12px] font-medium text-slate-500">{track.description}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ${colors.badge}`}>
                {resolvedItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {resolvedItems.map((item, idx) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-[17px] flex h-5 w-5 shrink-0 items-center justify-center">
                    <span className="text-[11px] font-black text-slate-400">{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <RoadmapCard item={item} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── Roadmap view (active items only, filterable) ─────────────────────────────

function RoadmapView() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const found = new Set(
      ROADMAP.filter((item) => ACTIVE_STATUSES.has(item.status))
        .map((item) => item.category)
        .filter(Boolean)
    );
    return [...found].sort();
  }, []);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROADMAP.filter((item) => {
      if (!ACTIVE_STATUSES.has(item.status)) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (q) {
        return [item.title, item.description, item.why, item.category]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      }
      return true;
    });
  }, [category, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-11 min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 min-w-0 flex-1 bg-transparent text-[13px] font-black text-slate-700 outline-none"
            >
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {visibleItems.map((item) => <RoadmapCard key={item.id} item={item} />)}
        {visibleItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <CircleDashed className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">No items match these filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRoadmap() {
  const navigate = useNavigate();
  const [view, setView] = useState('plan'); // 'plan' | 'all'

  const activeCount = useMemo(
    () => ROADMAP.filter((item) => ACTIVE_STATUSES.has(item.status)).length,
    []
  );

  const betaCount = useMemo(
    () =>
      RELEASE_PLAN.beta.items
        .map((id) => BY_ID[id])
        .filter((item) => item && ACTIVE_STATUSES.has(item.status)).length,
    []
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-4 pb-24 pt-5">
      <div className="mx-auto w-full max-w-3xl space-y-5">

        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Admin</p>
              <h1 className="truncate text-2xl font-black text-slate-950">Future Features</h1>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Rocket className="h-5 w-5" />
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Active</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{activeCount}</p>
            <p className="mt-1 text-[12px] font-semibold text-slate-500">not yet shipped</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-rose-400">Beta Critical</p>
            <p className="mt-2 text-3xl font-black text-rose-700">{betaCount}</p>
            <p className="mt-1 text-[12px] font-semibold text-rose-500">needed before launch</p>
          </div>
        </section>

        {/* View toggle */}
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setView('plan')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-black transition-colors ${
              view === 'plan'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Flag className="h-4 w-4" />
            Release Plan
          </button>
          <button
            type="button"
            onClick={() => setView('all')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-black transition-colors ${
              view === 'all'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="h-4 w-4" />
            All Features
          </button>
        </div>

        {/* Content */}
        {view === 'plan' ? <ReleasePlanView /> : <RoadmapView />}
      </div>
    </div>
  );
}
