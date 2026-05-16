import React, { useState } from 'react';
import {
  ArrowLeft, Clock, Filter, Inbox,
  Loader2, MessageSquare, RefreshCw, Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  bug:       { label: '🐛 Bug',           color: 'bg-red-100 text-red-800 border-red-200' },
  feature:   { label: '💡 Feature idea',  color: 'bg-blue-100 text-blue-800 border-blue-200' },
  confusing: { label: '😕 Confusing',     color: 'bg-amber-100 text-amber-800 border-amber-200' },
  content:   { label: '⚠️ Content issue', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  other:     { label: '💬 Other',         color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const URGENCY_CONFIG = {
  blocking: { label: '🚨 Blocking', color: 'bg-red-100 text-red-800 border-red-200' },
  normal:   { label: 'Normal',      color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const STATUS_CONFIG = {
  new:        { label: 'New',        color: 'bg-blue-100 text-blue-800 border-blue-200' },
  reviewing:  { label: 'Reviewing',  color: 'bg-violet-100 text-violet-800 border-violet-200' },
  planned:    { label: 'Planned',    color: 'bg-amber-100 text-amber-800 border-amber-200' },
  resolved:   { label: 'Resolved',   color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  dismissed:  { label: 'Dismissed',  color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const ALL_STATUSES  = ['all', 'new', 'reviewing', 'planned', 'resolved', 'dismissed'];
const ALL_TYPES     = ['all', 'bug', 'feature', 'confusing', 'content', 'other'];
const ALL_URGENCIES = ['all', 'blocking', 'normal'];

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({ cfg }) {
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function FeedbackCard({ item, currentUser, onUpdate }) {
  const [note, setNote]         = useState(item.internal_note ?? '');
  const [savingNote, setSavingNote] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const typecfg     = TYPE_CONFIG[item.feedback_type]     || TYPE_CONFIG.other;
  const urgencycfg  = URGENCY_CONFIG[item.urgency]        || URGENCY_CONFIG.normal;
  const statuscfg   = STATUS_CONFIG[item.status]          || STATUS_CONFIG.new;
  const timeAgo     = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  const hasContext  = item.route_context && Object.keys(item.route_context).length > 0;

  const handleStatus = (newStatus) => onUpdate(item.id, {
    status: newStatus,
    reviewed_by: currentUser.id,
    reviewed_at: new Date().toISOString(),
  });

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await onUpdate(item.id, { internal_note: note });
      toast.success('Note saved');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-all ${
      item.urgency === 'blocking' ? 'border-red-200' :
      item.status === 'new' ? 'border-blue-100' : 'border-slate-100'
    }`}>
      {/* Card header — always visible */}
      <button
        className="w-full p-4 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Chip cfg={typecfg} />
          <Chip cfg={urgencycfg} />
          <Chip cfg={statuscfg} />
          {item.contact_ok && (
            <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
              📧 Contact OK
            </span>
          )}
          <span className="ml-auto text-[11px] text-slate-400">{timeAgo}</span>
        </div>

        <div className="mb-1 flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-slate-900">
            {item.submitter_name || 'Anonymous'}
          </span>
          {item.page_name && (
            <span className="text-[11px] text-slate-400">
              · from <span className="font-semibold text-slate-600">{item.page_name}</span>
            </span>
          )}
        </div>

        {item.route_path && (
          <p className="mb-1.5 truncate font-mono text-[10px] text-slate-400">{item.route_path}</p>
        )}

        <p className={`text-[13px] leading-5 text-slate-700 ${!expanded ? 'line-clamp-2' : ''}`}>
          {item.message}
        </p>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">

          {/* Route context */}
          {hasContext && (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Page Context</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(item.route_context).map(([k, v]) => (
                  <span key={k} className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-mono text-slate-600">
                    <span className="text-slate-400">{k}:</span> {String(v).slice(0, 36)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Device */}
          {item.viewport && (
            <p className="text-[10px] text-slate-400">
              Viewport: {item.viewport.width}×{item.viewport.height}
              {item.user_agent && ` · ${item.user_agent.slice(0, 60)}…`}
            </p>
          )}

          {/* Submitted at */}
          <p className="text-[11px] text-slate-400">
            Submitted {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
          </p>

          {/* Status actions */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {['reviewing', 'planned', 'resolved', 'dismissed'].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${
                    item.status === s
                      ? `${STATUS_CONFIG[s].color} opacity-100`
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Internal note */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Internal Note</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note for your team…"
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={handleSaveNote}
              disabled={savingNote || note === (item.internal_note ?? '')}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40"
            >
              {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminFeedbackInbox() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [statusFilter,  setStatusFilter]  = useState('all');
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const { data: allFeedback = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase
        .from('app_feedback')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-feedback'] }),
    onError: () => toast.error('Could not update — please try again.'),
  });

  const handleUpdate = (id, updates) => updateMutation.mutateAsync({ id, updates });

  const filtered = allFeedback.filter(item => {
    if (statusFilter  !== 'all' && item.status        !== statusFilter)  return false;
    if (typeFilter    !== 'all' && item.feedback_type  !== typeFilter)    return false;
    if (urgencyFilter !== 'all' && item.urgency        !== urgencyFilter) return false;
    return true;
  });

  const newCount = allFeedback.filter(f => f.status === 'new').length;

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
            <h1 className="truncate text-xl font-bold text-slate-950">Feedback Inbox</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {newCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-black text-blue-800">
                {newCount} new
              </span>
            )}
            <button
              onClick={() => refetch()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mobile-page-wide flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 min-w-[120px] rounded-full border-slate-200 text-[12px]">
              <Filter className="mr-1 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="text-[12px]">
                  {s === 'all' ? 'All statuses' : STATUS_CONFIG[s]?.label ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 min-w-[130px] rounded-full border-slate-200 text-[12px]">
              <MessageSquare className="mr-1 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_TYPES.map(t => (
                <SelectItem key={t} value={t} className="text-[12px]">
                  {t === 'all' ? 'All types' : TYPE_CONFIG[t]?.label ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="h-8 min-w-[120px] rounded-full border-slate-200 text-[12px]">
              <Clock className="mr-1 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_URGENCIES.map(u => (
                <SelectItem key={u} value={u} className="text-[12px]">
                  {u === 'all' ? 'All urgencies' : URGENCY_CONFIG[u]?.label ?? u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Body */}
      <div className="mobile-page-wide space-y-3 px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="font-bold text-slate-700">Could not load feedback.</p>
            <button onClick={() => refetch()} className="mt-2 text-[13px] text-blue-600">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-bold text-slate-700">
              {allFeedback.length === 0 ? 'No feedback yet' : 'No matches for current filters'}
            </p>
            <p className="mt-1 text-[13px] text-slate-400">
              {allFeedback.length === 0
                ? 'Submitted feedback will appear here.'
                : 'Try clearing the filters.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-semibold text-slate-400">
              {filtered.length} {filtered.length === 1 ? 'submission' : 'submissions'}
              {statusFilter !== 'all' || typeFilter !== 'all' || urgencyFilter !== 'all' ? ' (filtered)' : ''}
            </p>
            {filtered.map(item => (
              <FeedbackCard
                key={item.id}
                item={item}
                currentUser={currentUser}
                onUpdate={handleUpdate}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
