import React, { useState, useCallback } from 'react';
import {
  ArrowLeft, CheckCircle2, ChevronDown, ChevronRight,
  Circle, Clock, Copy, ExternalLink, Loader2, MinusCircle,
  RefreshCw, Smartphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  IOS_READINESS_CATEGORIES,
  ALL_TASKS,
  TASK_STATUS,
  TASK_TYPE,
  READINESS_STATE,
  computeReadiness,
} from '@/config/iosReadiness';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  [TASK_STATUS.NOT_STARTED]: {
    label: 'Not started',
    icon: Circle,
    color: 'text-slate-400',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  [TASK_STATUS.IN_PROGRESS]: {
    label: 'In progress',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  [TASK_STATUS.DONE]: {
    label: 'Done',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  [TASK_STATUS.NA]: {
    label: 'N/A',
    icon: MinusCircle,
    color: 'text-slate-300',
    bg: 'bg-slate-50 text-slate-400 border-slate-200',
  },
};

const TYPE_CFG = {
  [TASK_TYPE.AI]:     { label: 'AI', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  [TASK_TYPE.MANUAL]: { label: 'Manual', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  [TASK_TYPE.MIXED]:  { label: 'AI + Manual', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const READINESS_CFG = {
  [READINESS_STATE.NOT_READY]:     { label: 'Not Ready', color: 'text-red-600',    bar: 'bg-red-500' },
  [READINESS_STATE.GETTING_CLOSE]: { label: 'Getting Close', color: 'text-amber-600', bar: 'bg-amber-500' },
  [READINESS_STATE.READY]:         { label: 'Ready to Submit', color: 'text-emerald-600', bar: 'bg-emerald-500' },
};

const STATUS_CYCLE = [
  TASK_STATUS.NOT_STARTED,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.DONE,
  TASK_STATUS.NA,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Prompt copied to clipboard'),
    () => toast.error('Could not copy — try manually selecting the text'),
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReadinessHeader({ readiness }) {
  const cfg = READINESS_CFG[readiness.state];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <Smartphone className="h-5 w-5 text-slate-400" />
        <span className="text-[11px] font-black uppercase tracking-wide text-amber-600">Admin Only</span>
      </div>
      <h2 className="mb-4 text-xl font-bold text-slate-900">iOS App Store Readiness</h2>

      <div className="mb-2 flex items-baseline justify-between">
        <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
        <span className="text-[13px] text-slate-500">
          {readiness.done} / {readiness.total} required tasks complete
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
          style={{ width: `${Math.max(readiness.pct, readiness.pct > 0 ? 4 : 0)}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {Object.values(TASK_STATUS).map(s => {
          const count = ALL_TASKS.filter(t =>
            s === TASK_STATUS.NOT_STARTED
              ? !progressGlobalRef[t.id]?.status || progressGlobalRef[t.id]?.status === s
              : progressGlobalRef[t.id]?.status === s
          ).length;
          if (count === 0) return null;
          const c = STATUS_CFG[s];
          return (
            <span key={s} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.bg}`}>
              {count} {c.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Hack: module-level ref so ReadinessHeader can access progress without prop-drilling
let progressGlobalRef = {};

function TaskCard({ task, progress, onSave, saving }) {
  const [expanded, setExpanded]         = useState(false);
  const [showPrompt, setShowPrompt]     = useState(false);
  const [showSteps, setShowSteps]       = useState(false);
  const [localStatus, setLocalStatus]   = useState(progress?.status ?? TASK_STATUS.NOT_STARTED);
  const [notes, setNotes]               = useState(progress?.notes ?? '');
  const [evidenceUrl, setEvidenceUrl]   = useState(progress?.evidence_url ?? '');
  const [noteDirty, setNoteDirty]       = useState(false);

  const statusCfg = STATUS_CFG[localStatus] ?? STATUS_CFG[TASK_STATUS.NOT_STARTED];
  const typeCfg   = TYPE_CFG[task.taskType];
  const StatusIcon = statusCfg.icon;

  const cycleStatus = () => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(localStatus) + 1) % STATUS_CYCLE.length];
    setLocalStatus(next);
    onSave({ task_id: task.id, status: next, notes, evidence_url: evidenceUrl });
  };

  const saveNotes = () => {
    onSave({ task_id: task.id, status: localStatus, notes, evidence_url: evidenceUrl });
    setNoteDirty(false);
  };

  const cardBorder =
    localStatus === TASK_STATUS.DONE ? 'border-emerald-200' :
    localStatus === TASK_STATUS.IN_PROGRESS ? 'border-amber-200' :
    task.required ? 'border-slate-200' : 'border-slate-100';

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-colors ${cardBorder}`}>
      {/* Header row */}
      <button
        className="w-full p-3.5 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3">
          {/* Status icon — tap to cycle */}
          <button
            onClick={e => { e.stopPropagation(); cycleStatus(); }}
            className="mt-0.5 shrink-0"
            title={`Status: ${statusCfg.label} — tap to advance`}
          >
            <StatusIcon className={`h-5 w-5 ${statusCfg.color}`} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {task.required ? (
                <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Required</span>
              ) : (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Optional</span>
              )}
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${typeCfg.color}`}>
                {typeCfg.label}
              </span>
              <span className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusCfg.bg}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-[13px] font-semibold leading-5 text-slate-800">{task.title}</p>
            {!expanded && (
              <p className="mt-0.5 line-clamp-1 text-[12px] text-slate-500">{task.description}</p>
            )}
          </div>

          <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3">
          {/* Description + why */}
          <div>
            <p className="text-[13px] leading-5 text-slate-700">{task.description}</p>
            <p className="mt-1.5 text-[12px] italic text-slate-500">
              <span className="font-semibold not-italic">Why: </span>{task.whyItMatters}
            </p>
          </div>

          {/* Completion criteria */}
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Done when…</p>
            <p className="mt-0.5 text-[12px] text-slate-600">{task.completionCriteria}</p>
          </div>

          {/* AI copy prompt */}
          {task.copyPrompt && (
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-500">AI Prompt</p>
                <button
                  onClick={() => setShowPrompt(v => !v)}
                  className="text-[10px] text-slate-400 underline"
                >
                  {showPrompt ? 'hide' : 'show'}
                </button>
              </div>
              <button
                onClick={() => copyToClipboard(task.copyPrompt)}
                className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] font-semibold text-violet-700 transition hover:bg-violet-100 active:scale-[0.98]"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy prompt for Claude
              </button>
              {showPrompt && (
                <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-violet-100 bg-violet-50 p-3 text-[11px] leading-4 text-slate-700">
                  {task.copyPrompt}
                </pre>
              )}
            </div>
          )}

          {/* Manual steps */}
          {task.manualSteps?.length > 0 && (
            <div>
              <button
                onClick={() => setShowSteps(v => !v)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600"
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${showSteps ? 'rotate-90' : ''}`} />
                Step-by-step instructions ({task.manualSteps.length} steps)
              </button>
              {showSteps && (
                <ol className="mt-2 space-y-1.5 pl-1">
                  {task.manualSteps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-[12px] leading-5 text-slate-700">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Status buttons */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_CYCLE.map(s => {
                const c = STATUS_CFG[s];
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setLocalStatus(s);
                      onSave({ task_id: task.id, status: s, notes, evidence_url: evidenceUrl });
                    }}
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${
                      localStatus === s ? c.bg : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Notes / Evidence</p>
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); setNoteDirty(true); }}
              rows={2}
              placeholder="Add notes, links, or evidence…"
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="url"
              value={evidenceUrl}
              onChange={e => { setEvidenceUrl(e.target.value); setNoteDirty(true); }}
              placeholder="Evidence URL (screenshot, PR, doc…)"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={saveNotes}
                disabled={!noteDirty || saving}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save notes
              </button>
              {evidenceUrl && (
                <a
                  href={evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[12px] text-blue-600"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Open link
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({ category, progressMap, onSave, saving }) {
  const [open, setOpen] = useState(false);

  const tasks      = category.tasks;
  const doneCount  = tasks.filter(t => {
    const s = progressMap[t.id]?.status;
    return s === TASK_STATUS.DONE || s === TASK_STATUS.NA;
  }).length;
  const reqCount   = tasks.filter(t => t.required).length;
  const reqDone    = tasks.filter(t => t.required && (
    progressMap[t.id]?.status === TASK_STATUS.DONE ||
    progressMap[t.id]?.status === TASK_STATUS.NA
  )).length;
  const allDone    = reqDone === reqCount;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-colors ${allDone ? 'border-emerald-200' : 'border-slate-200'}`}>
      <button
        className="w-full px-4 py-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h3 className="text-[15px] font-bold text-slate-900">{category.label}</h3>
              {allDone && reqCount > 0 && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-slate-500">{category.description}</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[12px] font-bold text-slate-700">
              {reqDone}/{reqCount} required
            </span>
            <span className="text-[11px] text-slate-400">
              {doneCount}/{tasks.length} total
            </span>
          </div>

          <ChevronDown className={`ml-2 h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>

        {/* Mini progress bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: reqCount === 0 ? '100%' : `${(reqDone / reqCount) * 100}%` }}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              progress={progressMap[task.id]}
              onSave={onSave}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminiOSReadiness() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [savingIds, setSavingIds] = useState(new Set());

  const { data: progressRows = [], isLoading, refetch } = useQuery({
    queryKey: ['ios-readiness-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ios_app_store_readiness_progress')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Build a map of task_id → progress row for fast lookup
  const progressMap = Object.fromEntries(progressRows.map(r => [r.task_id, r]));
  progressGlobalRef = progressMap; // expose for ReadinessHeader

  const readiness = computeReadiness(progressMap, ALL_TASKS);

  const upsertMutation = useMutation({
    mutationFn: async (updates) => {
      const { task_id, status, notes, evidence_url } = updates;
      const payload = {
        task_id,
        status,
        notes: notes || null,
        evidence_url: evidence_url || null,
        completed_by: currentUser?.id ?? null,
        completed_at: status === TASK_STATUS.DONE ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const existing = progressMap[task_id];
      if (existing) {
        const { error } = await supabase
          .from('ios_app_store_readiness_progress')
          .update(payload)
          .eq('task_id', task_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ios_app_store_readiness_progress')
          .insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ios-readiness-progress'] });
    },
    onError: () => toast.error('Could not save — please try again.'),
  });

  const handleSave = useCallback(async (updates) => {
    setSavingIds(s => new Set(s).add(updates.task_id));
    try {
      await upsertMutation.mutateAsync(updates);
    } finally {
      setSavingIds(s => { const n = new Set(s); n.delete(updates.task_id); return n; });
    }
  }, [upsertMutation]);

  return (
    <div className="min-h-screen bg-slate-50 mobile-safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mobile-page-wide flex min-w-0 items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-600">Admin Only</p>
            <h1 className="truncate text-xl font-bold text-slate-950">iOS Readiness</h1>
          </div>
          <button
            onClick={() => refetch()}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="mobile-page-wide space-y-4 px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Score card */}
            <ReadinessHeader readiness={readiness} />

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
              <span className="text-[11px] text-slate-400">Tap the status icon on any task to advance it · Expand for prompts &amp; steps</span>
            </div>

            {/* Category sections */}
            {IOS_READINESS_CATEGORIES.map(cat => (
              <CategorySection
                key={cat.id}
                category={cat}
                progressMap={progressMap}
                onSave={handleSave}
                saving={savingIds.size > 0}
              />
            ))}

            {/* Footer totals */}
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
              <p className="text-[12px] text-slate-500">
                {ALL_TASKS.filter(t => t.required).length} required tasks ·{' '}
                {ALL_TASKS.filter(t => !t.required).length} optional tasks ·{' '}
                {ALL_TASKS.length} total
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
