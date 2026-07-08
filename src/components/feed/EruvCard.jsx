import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle, HelpCircle, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

async function fetchEruvStatuses() {
  const { data, error } = await supabase
    .from('eruv_statuses')
    .select('*')
    .order('area');
  if (error) throw error;
  return data || [];
}

const STATUS_CONFIG = {
  up:        { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', pill: 'bg-emerald-600', label: 'Up ✓' },
  down:      { icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         pill: 'bg-red-600',     label: 'Down ✗' },
  uncertain: { icon: HelpCircle,   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     pill: 'bg-amber-500',   label: 'Check' },
};

function getWeekLabel() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  // Find the Friday of this week
  const daysToFriday = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + (daysToFriday === 0 ? 0 : daysToFriday));
  return friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EruvCard({ isAdmin = false }) {
  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ['eruv-statuses'],
    queryFn: fetchEruvStatuses,
    staleTime: 30 * 60 * 1000,
  });

  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(null); // eruv id being edited
  const [editForm, setEditForm] = useState({});
  const qc = useQueryClient();
  const { user } = useAuth();

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const { error } = await supabase
        .from('eruv_statuses')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eruv-statuses'] });
      setEditing(null);
    },
  });

  if (isLoading || statuses.length === 0) return null;

  const allUp = statuses.every(s => s.status === 'up');
  const anyDown = statuses.some(s => s.status === 'down');
  const summaryStatus = anyDown ? 'down' : allUp ? 'up' : 'uncertain';
  const summaryConfig = STATUS_CONFIG[summaryStatus];

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
      style={{ borderColor: anyDown ? '#fecaca' : allUp ? '#bbf7d0' : '#fde68a' }}>

      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3"
        style={{ background: anyDown ? '#fef2f2' : allUp ? '#f0fdf4' : '#fffbeb' }}
      >
        <div className="flex items-center gap-2.5">
          <summaryConfig.icon className={`h-5 w-5 shrink-0 ${summaryConfig.color}`} />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Five Towns Eruv · Shabbos {getWeekLabel()}</p>
            <p className={`text-[15px] font-black ${summaryConfig.color}`}>
              {anyDown ? 'Eruv is DOWN this Shabbos' : allUp ? 'Eruv is UP this Shabbos' : 'Status uncertain — check before Shabbos'}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>

      {/* Expanded detail */}
      <div style={{
        display: 'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div className="divide-y divide-slate-100 border-t border-slate-100 bg-white">
            {statuses.map(eruv => {
              const cfg = STATUS_CONFIG[eruv.status] || STATUS_CONFIG.uncertain;
              const isEditingThis = editing === eruv.id;

              return (
                <div key={eruv.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-black text-slate-950">{eruv.area}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black text-white ${cfg.pill}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {eruv.message && !isEditingThis && (
                        <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{eruv.message}</p>
                      )}
                      {eruv.checked_by && !isEditingThis && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Checked by: {eruv.checked_by} · {new Date(eruv.updated_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    {isAdmin && !isEditingThis && (
                      <button
                        type="button"
                        onClick={() => { setEditing(eruv.id); setEditForm({ status: eruv.status, message: eruv.message || '', checked_by: eruv.checked_by || '' }); }}
                        className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-slate-500"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {isEditingThis && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2">
                        {['up', 'down', 'uncertain'].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditForm(f => ({ ...f, status: s }))}
                            className={`flex-1 rounded-xl border py-2 text-[12px] font-black transition ${
                              editForm.status === s
                                ? `${STATUS_CONFIG[s].pill} border-transparent text-white`
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
                        placeholder="Note (optional)"
                        value={editForm.message}
                        onChange={e => setEditForm(f => ({ ...f, message: e.target.value }))}
                      />
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400"
                        placeholder="Checked by (name)"
                        value={editForm.checked_by}
                        onChange={e => setEditForm(f => ({ ...f, checked_by: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateMutation.mutate({ id: eruv.id, ...editForm })}
                          disabled={updateMutation.isPending}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-950 py-2 text-[13px] font-black text-white disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2">
                          <X className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="px-4 py-2.5 bg-slate-50">
              <p className="text-[11px] font-semibold text-slate-400">
                Always call your local eruv hotline to confirm before carrying.{' '}
                <a href="tel:5163889640" className="font-black text-blue-600">516-388-9640</a> (Lawrence eruv hotline)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
