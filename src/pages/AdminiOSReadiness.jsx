import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, Search, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALL_TASKS, IOS_READINESS_CATEGORIES, TASK_TYPE, computeCatalogReadiness } from '../../internal/iosReadiness.js';
import CopyPromptButton from '../components/common/CopyPromptButton.jsx';

// Tasks have no stored prompt, so compose one from the task's own fields for
// AI / Mixed tasks an agent could actually pick up and execute.
function buildTaskPrompt(task, categoryLabel) {
  const lines = ['You are completing an App Store readiness task for JUnited.', '', `Task: ${task.title}`];
  if (categoryLabel) lines.push(`Area: ${categoryLabel}`);
  if (task.description) lines.push(`Context: ${task.description}`);
  if (task.whyItMatters) lines.push(`Why it matters: ${task.whyItMatters}`);
  if (task.completionCriteria) lines.push(`Done when: ${task.completionCriteria}`);
  if (task.manualSteps?.length) {
    lines.push('Steps:');
    task.manualSteps.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
  }
  return lines.join('\n');
}

const TYPE_META = {
  [TASK_TYPE.AI]: { label: 'AI', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  [TASK_TYPE.MANUAL]: { label: 'Manual', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  [TASK_TYPE.MIXED]: { label: 'Mixed', className: 'bg-violet-50 text-violet-700 border-violet-100' },
};

const STATE_LABELS = {
  not_ready: 'Not ready',
  getting_close: 'Getting close',
  ready: 'Ready',
};

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

export default function AdminiOSReadiness() {
  const navigate = useNavigate();
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');

  const readiness = useMemo(() => computeCatalogReadiness(ALL_TASKS), []);
  const requiredCount = useMemo(() => ALL_TASKS.filter((task) => task.required).length, []);
  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return IOS_READINESS_CATEGORIES.map((category) => ({
      ...category,
      tasks: category.tasks.filter((task) => {
        const typeMatch = type === 'all' || task.taskType === type;
        const queryMatch = !q || [task.title, task.description, task.whyItMatters, task.completionCriteria, category.label]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
        return typeMatch && queryMatch;
      }),
    })).filter((category) => category.tasks.length > 0);
  }, [query, type]);

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
              <h1 className="truncate text-2xl font-black text-slate-950">App Store Readiness</h1>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
            <Smartphone className="h-5 w-5" />
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="Readiness" value={`${Math.round(readiness.pct)}%`} sub={`${readiness.done}/${readiness.total} required tasks done`} />
          <Stat label="Remaining" value={requiredCount} sub="required tasks still open" />
          <Stat label="Catalog" value={ALL_TASKS.length} sub="total open App Store tasks" />
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search App Store tasks"
                className="h-11 min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-black text-slate-700 outline-none"
            >
              <option value="all">All task types</option>
              <option value={TASK_TYPE.AI}>AI</option>
              <option value={TASK_TYPE.MANUAL}>Manual</option>
              <option value={TASK_TYPE.MIXED}>Mixed</option>
            </select>
          </div>
        </section>

        <section className="space-y-4">
          {visibleCategories.map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">{category.label}</h2>
                  <p className="mt-1 max-w-3xl text-[13px] font-semibold leading-5 text-slate-500">{category.description}</p>
                </div>
                <Badge>{category.tasks.length} tasks</Badge>
              </div>
              {category.tasks.map((task) => (
                <article key={task.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-black leading-5 text-slate-950">{task.title}</h3>
                      {task.description && <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-600">{task.description}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {task.required && <Badge className="bg-rose-50 text-rose-700 border-rose-100">Required</Badge>}
                      <Badge className={TYPE_META[task.taskType]?.className}>{TYPE_META[task.taskType]?.label ?? task.taskType}</Badge>
                    </div>
                  </div>
                  {task.whyItMatters && <p className="mt-3 text-[12px] font-medium leading-5 text-slate-500">{task.whyItMatters}</p>}
                  {task.completionCriteria && (
                    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-[12px] font-semibold leading-5 text-emerald-800">
                      <span className="inline-flex items-center gap-1 font-black"><CheckCircle2 className="h-3.5 w-3.5" /> Done when:</span> {task.completionCriteria}
                    </div>
                  )}
                  {task.manualSteps?.length > 0 && (
                    <details className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <summary className="flex cursor-pointer items-center gap-2 text-[12px] font-black text-slate-700">
                        <ClipboardList className="h-4 w-4 text-slate-400" /> Manual steps
                      </summary>
                      <ol className="mt-3 space-y-2 pl-4 text-[12px] font-semibold leading-5 text-slate-600">
                        {task.manualSteps.map((step) => <li key={step}>{step}</li>)}
                      </ol>
                    </details>
                  )}
                  {(task.taskType === TASK_TYPE.AI || task.taskType === TASK_TYPE.MIXED) && (
                    <div className="mt-3">
                      <CopyPromptButton text={buildTaskPrompt(task, category.label)} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
