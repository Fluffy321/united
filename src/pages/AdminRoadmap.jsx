import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleDashed, Filter, Rocket, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_ORDER, PRIORITY, ROADMAP, STATUS } from '../../internal/roadmap.js';
import CopyPromptButton from '../components/common/CopyPromptButton.jsx';

const INACTIVE_STATUSES = [STATUS.SHIPPED, STATUS.DROPPED];

const STATUS_META = {
  [STATUS.PLANNED]: { label: 'Planned', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  [STATUS.EXPLORING]: { label: 'Exploring', className: 'bg-violet-50 text-violet-700 border-violet-100' },
  [STATUS.BLOCKED]: { label: 'Blocked', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  [STATUS.DEFERRED]: { label: 'Deferred', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  [STATUS.SHIPPED]: { label: 'Shipped', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  [STATUS.DROPPED]: { label: 'Dropped', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const PRIORITY_META = {
  [PRIORITY.HIGH]: 'High',
  [PRIORITY.MEDIUM]: 'Medium',
  [PRIORITY.LOW]: 'Low',
};

const TRACKED_STATUSES = [STATUS.PLANNED, STATUS.EXPLORING, STATUS.BLOCKED, STATUS.DEFERRED, STATUS.SHIPPED];

function Badge({ children, className = 'bg-slate-100 text-slate-600 border-slate-200' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-black ${className}`}>
      {children}
    </span>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      {sub && <p className="mt-1 text-[12px] font-semibold text-slate-500">{sub}</p>}
    </div>
  );
}

export default function AdminRoadmap() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('active');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const found = new Set(ROADMAP.map((item) => item.category).filter(Boolean));
    return CATEGORY_ORDER.filter((item) => found.has(item)).concat([...found].filter((item) => !CATEGORY_ORDER.includes(item)));
  }, []);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROADMAP.filter((item) => {
      const activeMatch = status === 'active'
        ? [STATUS.PLANNED, STATUS.EXPLORING, STATUS.BLOCKED, STATUS.DEFERRED].includes(item.status)
        : status === 'all' || item.status === status;
      const categoryMatch = category === 'all' || item.category === category;
      const queryMatch = !q || [item.title, item.description, item.why, item.shippedNote, item.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      return activeMatch && categoryMatch && queryMatch;
    });
  }, [category, query, status]);

  const groupedItems = useMemo(() => {
    const groups = new Map();
    visibleItems.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(item);
    });
    const ordered = [];
    categories.forEach((cat) => {
      if (groups.has(cat)) {
        ordered.push([cat, groups.get(cat)]);
        groups.delete(cat);
      }
    });
    groups.forEach((items, cat) => ordered.push([cat, items]));
    return ordered;
  }, [visibleItems, categories]);

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(TRACKED_STATUSES.map((item) => [item, 0]));
    ROADMAP.forEach((item) => {
      if (byStatus[item.status] !== undefined) byStatus[item.status] += 1;
    });
    const active = ROADMAP.filter((item) => [STATUS.PLANNED, STATUS.EXPLORING, STATUS.BLOCKED, STATUS.DEFERRED].includes(item.status)).length;
    return { byStatus, active, total: ROADMAP.length };
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-4 pb-24 pt-5">
      <div className="mx-auto w-full max-w-5xl space-y-5">
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

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="Active" value={counts.active} sub="planned, exploring, blocked, deferred" />
          <Stat label="Shipped" value={counts.byStatus[STATUS.SHIPPED]} sub="already live or completed" />
          <Stat label="Total" value={counts.total} sub="tracked roadmap entries" />
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
            <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search roadmap"
                className="h-11 min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent text-[13px] font-black text-slate-700 outline-none"
              >
                <option value="active">Active</option>
                <option value="all">All statuses</option>
                {TRACKED_STATUSES.map((item) => (
                  <option key={item} value={item}>{STATUS_META[item]?.label ?? item}</option>
                ))}
              </select>
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-black text-slate-700 outline-none"
            >
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </section>

        <section className="space-y-6">
          {groupedItems.map(([cat, items]) => (
            <div key={cat} className="space-y-3">
              <div className="flex items-end justify-between gap-3 px-1">
                <h2 className="text-[12px] font-black uppercase tracking-[0.12em] text-slate-500">{cat}</h2>
                <Badge>{items.length}</Badge>
              </div>
              {items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="min-w-0 text-lg font-black leading-tight text-slate-950">{item.title}</h3>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Badge className={STATUS_META[item.status]?.className}>{STATUS_META[item.status]?.label ?? item.status}</Badge>
                      <Badge>{PRIORITY_META[item.priority] ?? item.priority}</Badge>
                    </div>
                  </div>
                  {item.description && <p className="mt-3 text-[13px] font-semibold leading-5 text-slate-600">{item.description}</p>}
                  {item.why && <p className="mt-2 text-[12px] font-medium leading-5 text-slate-500">{item.why}</p>}
                  {item.shippedNote && (
                    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-[12px] font-semibold leading-5 text-emerald-800">
                      <span className="inline-flex items-center gap-1 font-black"><CheckCircle2 className="h-3.5 w-3.5" /> Shipped note:</span> {item.shippedNote}
                    </div>
                  )}
                  {item.prompt && !INACTIVE_STATUSES.includes(item.status) && (
                    <div className="mt-3">
                      <CopyPromptButton text={item.prompt} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          ))}
          {visibleItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <CircleDashed className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-black text-slate-700">No roadmap items match these filters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
