import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Lock,
  Sparkles,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { CATEGORY_ORDER, PRIORITY, ROADMAP, STATUS } from '@/config/roadmap';

// ── Status display config ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  [STATUS.PLANNED]:   { label: 'Planned',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  [STATUS.DEFERRED]:  { label: 'Deferred',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  [STATUS.EXPLORING]: { label: 'Exploring', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  [STATUS.BLOCKED]:   { label: 'Blocked',   bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200' },
  [STATUS.SHIPPED]:   { label: 'Shipped',   bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200' },
  [STATUS.DROPPED]:   { label: 'Dropped',   bg: 'bg-slate-100', text: 'text-slate-500',  border: 'border-slate-200' },
};

const PRIORITY_CONFIG = {
  [PRIORITY.HIGH]:   { label: 'High',   dot: 'bg-rose-500' },
  [PRIORITY.MEDIUM]: { label: 'Med',    dot: 'bg-amber-400' },
  [PRIORITY.LOW]:    { label: 'Low',    dot: 'bg-slate-300' },
};

// ── Helper components ─────────────────────────────────────────────────────────

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG[STATUS.PLANNED];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function PriorityDot({ priority }) {
  if (!priority) return null;
  const cfg = PRIORITY_CONFIG[priority];
  if (!cfg) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Prompt copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy Prompt'}
    </button>
  );
}

function RoadmapCard({ item }) {
  const isInactive = item.status === STATUS.SHIPPED || item.status === STATUS.DROPPED;
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${isInactive ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <StatusChip status={item.status} />
            {item.priority && !isInactive && <PriorityDot priority={item.priority} />}
            {item.needs && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                <Lock className="h-2.5 w-2.5" />
                needs: {item.needs}
              </span>
            )}
          </div>
          <h3 className={`font-black ${isInactive ? 'text-slate-500' : 'text-slate-950'}`}>{item.title}</h3>
          <p className="mt-0.5 text-[13px] leading-5 text-slate-500">{item.description}</p>
          {item.why && !isInactive && (
            <p className="mt-1.5 text-[12px] font-semibold italic text-slate-400">
              Why deferred: {item.why}
            </p>
          )}
          {item.shippedNote && (
            <p className="mt-1.5 text-[12px] font-semibold text-emerald-600">{item.shippedNote}</p>
          )}
        </div>
      </div>
      {item.prompt && !isInactive && (
        <div className="mt-3">
          <CopyButton text={item.prompt} />
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, items, defaultOpen = false, accent = 'text-slate-500' }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!items.length) return null;
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-between gap-2"
      >
        <span className={`text-[11px] font-black uppercase tracking-wider ${accent}`}>
          {title} ({items.length})
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && (
        <div className="space-y-3">
          {items.map((item) => <RoadmapCard key={item.id} item={item} />)}
        </div>
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set([STATUS.PLANNED, STATUS.DEFERRED, STATUS.EXPLORING, STATUS.BLOCKED]);

export default function FutureFeatures() {
  const activeItems = ROADMAP.filter((item) => ACTIVE_STATUSES.has(item.status));
  const shippedItems = ROADMAP.filter((item) => item.status === STATUS.SHIPPED);
  const droppedItems = ROADMAP.filter((item) => item.status === STATUS.DROPPED);

  // Group active items by category in canonical order.
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = activeItems.filter((item) => item.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-slate-50 mobile-safe-bottom">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mobile-page-wide flex min-w-0 items-center gap-3 px-4 py-3">
          <Link
            to={createPageUrl('Settings')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-600">Admin Only</p>
            <h1 className="truncate text-xl font-bold text-slate-950">Product Roadmap</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-black text-blue-800">
              {activeItems.length} active
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-800">
              {shippedItems.length} shipped
            </span>
          </div>
        </div>
      </header>

      <div className="mobile-page-wide space-y-6 px-4 py-4">

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-black text-amber-900">Living product roadmap — admin view only</p>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                This roadmap is the single source of truth for JUnited feature planning.
                Edit <code className="rounded bg-amber-100 px-1 font-mono text-[11px]">src/config/roadmap.js</code> whenever
                a feature ships, gets deferred, or a new idea is worth tracking.
                Each card with a prompt can be copy-pasted into Claude Code to begin implementation.
              </p>
            </div>
          </div>
        </div>

        {/* Active roadmap grouped by category */}
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-500">
              {category}
            </h2>
            <div className="space-y-3">
              {items.map((item) => <RoadmapCard key={item.id} item={item} />)}
            </div>
          </section>
        ))}

        <div className="border-t border-slate-200 pt-2" />

        {/* Collapsed shipped section */}
        <CollapsibleSection
          title="Recently Shipped"
          items={shippedItems}
          defaultOpen={false}
          accent="text-emerald-700"
        />

        {/* Collapsed dropped section */}
        <CollapsibleSection
          title="Not Pursuing"
          items={droppedItems}
          defaultOpen={false}
          accent="text-slate-400"
        />

      </div>
    </main>
  );
}
