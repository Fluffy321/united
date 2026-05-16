import React, { useState } from 'react';
import {
  AlertTriangle, ArrowLeft, Ban, Clock, Copy, Filter,
  Inbox, Loader2, MessageSquare, RefreshCw, RotateCcw, Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
  new:       { label: 'New',       color: 'bg-blue-100 text-blue-800 border-blue-200' },
  reviewing: { label: 'Reviewing', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  planned:   { label: 'Planned',   color: 'bg-amber-100 text-amber-800 border-amber-200' },
  resolved:  { label: 'Resolved',  color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  dismissed: { label: 'Dismissed', color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const ALL_STATUSES  = ['all', 'new', 'reviewing', 'planned', 'resolved', 'dismissed'];
const ALL_TYPES     = ['all', 'bug', 'feature', 'confusing', 'content', 'other'];
const ALL_URGENCIES = ['all', 'blocking', 'normal'];

// ── Rule-based junk heuristics ────────────────────────────────────────────────
// These NEVER automatically move items to junk — they only surface advisory
// badges. Admins make the final call.

const JUNK_RULES = [
  {
    id: 'too_short',
    label: 'Too short to be actionable',
    test: (msg) => msg.trim().length < 5,
  },
  {
    id: 'test_submission',
    label: 'Appears to be a test submission',
    test: (msg) =>
      /^(test|hi|hello|hey|asdf|lol|ok|yep|no|yes|hm+|x+|a+|\.+|gg|ff|123+|qwerty|temp|foo|bar|baz|check|checking|nothing|n\/a|na)$/i
        .test(msg.trim()),
  },
  {
    id: 'repeating_chars',
    label: 'Contains repeating characters',
    test: (msg) => /(.)\1{6,}/.test(msg),
  },
  {
    id: 'many_links',
    label: 'Contains many links',
    test: (msg) => (msg.match(/https?:\/\//g) ?? []).length >= 3,
  },
  {
    id: 'only_symbols',
    label: 'Contains only symbols or punctuation',
    test: (msg) => {
      const t = msg.trim();
      return t.length > 0 && /^[^a-zA-Z0-9\s]+$/.test(t);
    },
  },
  {
    id: 'excessive_caps',
    label: 'Mostly uppercase text',
    test: (msg) => {
      const letters = msg.replace(/[^a-zA-Z]/g, '');
      if (letters.length < 10) return false;
      return (letters.replace(/[^A-Z]/g, '').length / letters.length) > 0.8;
    },
  },
];

function evaluateJunkFlags(msg) {
  if (!msg) return [];
  return JUNK_RULES.filter((rule) => rule.test(msg));
}

// ── Deterministic triage summary ──────────────────────────────────────────────
// Built from structured fields only. No AI, no guessing.

function buildTriageSummary(item) {
  const parts = [];
  if (item.page_name) parts.push(`Submitted from ${item.page_name} page`);
  if (item.feedback_type === 'bug' && item.urgency === 'blocking') {
    parts.push('Blocking bug — needs urgent attention');
  } else if (item.feedback_type === 'bug') {
    parts.push('User marked this as a Bug');
  } else if (item.feedback_type === 'feature') {
    parts.push('Feature request from user');
  } else if (item.feedback_type === 'confusing') {
    parts.push('User found something confusing');
  } else if (item.feedback_type === 'content') {
    parts.push('Content issue flagged by user');
  }
  if (item.urgency === 'blocking') parts.push('User marked urgency as Blocking me');
  if (item.route_context?.community_id) parts.push('Submitted within a community context');
  if (item.contact_ok) parts.push('User is OK with being contacted for follow-up');
  if ((item.message?.trim().length ?? 0) < 30) parts.push('Brief message — may need follow-up before acting');
  return parts;
}

// ── Fix prompt builder ────────────────────────────────────────────────────────
// Generates a ready-to-paste prompt for Claude Code or Codex.
// Only called for non-junk items. If the message is vague, the prompt says so.

function buildFixPrompt(item) {
  const typeLabel    = TYPE_CONFIG[item.feedback_type]?.label  ?? item.feedback_type ?? 'Unknown';
  const urgencyLabel = URGENCY_CONFIG[item.urgency]?.label ?? item.urgency ?? 'Normal';
  const isVague      = (item.message?.trim().length ?? 0) < 30;
  const hasContext   = item.route_context && Object.keys(item.route_context).length > 0;

  const ctxLines = hasContext
    ? Object.entries(item.route_context)
        .map(([k, v]) => `  - ${k}: ${v}`)
        .join('\n')
    : '  (none captured)';

  const vagueNote = isVague
    ? '\n⚠️  This report is brief. Determine whether it is actionable or if more detail is needed before attempting a fix.\n'
    : '';

  return `You are reviewing user-submitted feedback for the JUnited app (React 18 + Vite + Tailwind + Supabase).

## Feedback Details
- Type: ${typeLabel}
- Urgency: ${urgencyLabel}
- Page: ${item.page_name ?? 'Unknown'}
- Route path: ${item.route_path ?? 'Unknown'}
- Page context:
${ctxLines}
- User OK with contact: ${item.contact_ok ? 'Yes' : 'No'}
${vagueNote}
## User Message
"${item.message?.trim() ?? ''}"

## Your Task

1. **Audit before editing.** Do not touch any code until the audit is complete.
2. Search the codebase for the page, component, or feature referenced in the feedback. Focus on files related to "${item.page_name ?? item.route_path ?? 'the reported area'}".
3. Identify the most likely files responsible for the reported issue.
4. Determine whether the issue is reproducible from the description provided.
5. If reproducible: implement the minimal fix. Do not refactor unrelated code or introduce new abstractions.
6. If vague or missing detail: clearly state what additional information is needed to reproduce the issue.
7. After any code changes, run:
   - npm run lint
   - npm run build
8. **Final report:** list every file changed, what was fixed, and confirm whether the issue is resolved.`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({ cfg }) {
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function FeedbackCard({ item, currentUser, onUpdate, bucket }) {
  const [note, setNote]             = useState(item.internal_note ?? '');
  const [savingNote, setSavingNote] = useState(false);
  const [expanded, setExpanded]     = useState(false);

  const typecfg    = TYPE_CONFIG[item.feedback_type]  || TYPE_CONFIG.other;
  const urgencycfg = URGENCY_CONFIG[item.urgency]     || URGENCY_CONFIG.normal;
  const statuscfg  = STATUS_CONFIG[item.status]       || STATUS_CONFIG.new;
  const timeAgo    = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  const hasContext = item.route_context && Object.keys(item.route_context).length > 0;
  const junkFlags  = evaluateJunkFlags(item.message);
  const triageSummary = buildTriageSummary(item);

  const handleStatus = (newStatus) => onUpdate(item.id, {
    status: newStatus,
    reviewed_by: currentUser.id,
    reviewed_at: new Date().toISOString(),
  });

  const handleMarkJunk = () => {
    onUpdate(item.id, {
      is_junk: true,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
    });
    toast.success('Moved to Spam & Junk — item is preserved, not deleted');
  };

  const handleRestore = () => {
    onUpdate(item.id, {
      is_junk: false,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
    });
    toast.success('Restored to Inbox');
  };

  const handleCopyPrompt = () => {
    const prompt = buildFixPrompt(item);
    navigator.clipboard.writeText(prompt)
      .then(() => toast.success('Fix prompt copied — paste into Claude Code or Codex'))
      .catch(() => toast.error('Could not copy to clipboard'));
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await onUpdate(item.id, { internal_note: note });
      toast.success('Note saved');
    } finally {
      setSavingNote(false);
    }
  };

  const cardBorder =
    item.urgency === 'blocking' ? 'border-red-200' :
    item.status  === 'new'      ? 'border-blue-100' :
    'border-slate-100';

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-all ${cardBorder}`}>

      {/* Header — tap to expand */}
      <button className="w-full p-4 text-left" onClick={() => setExpanded((v) => !v)}>
        {/* Chips */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Chip cfg={typecfg} />
          {item.urgency !== 'normal' && <Chip cfg={urgencycfg} />}
          <Chip cfg={statuscfg} />
          {item.contact_ok && (
            <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
              📧 Contact OK
            </span>
          )}
          {junkFlags.length > 0 && !item.is_junk && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              Possible junk
            </span>
          )}
          <span className="ml-auto text-[11px] text-slate-400">{timeAgo}</span>
        </div>

        {/* Submitter + page */}
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

        {/* Route path */}
        {item.route_path && (
          <p className="mb-1.5 truncate font-mono text-[10px] text-slate-400">{item.route_path}</p>
        )}

        {/* Message preview */}
        <p className={`text-[13px] leading-5 text-slate-700 ${!expanded ? 'line-clamp-2' : ''}`}>
          {item.message}
        </p>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3">

          {/* Triage summary */}
          {triageSummary.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Triage Summary
              </p>
              <ul className="rounded-xl bg-slate-50 px-3 py-2.5 space-y-1">
                {triageSummary.map((s, i) => (
                  <li key={i} className="text-[11px] text-slate-600">· {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Junk signal details */}
          {junkFlags.length > 0 && !item.is_junk && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                Junk Signals Detected
              </p>
              <ul className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 space-y-1">
                {junkFlags.map((f) => (
                  <li key={f.id} className="text-[11px] text-amber-700">· {f.label}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Route context */}
          {hasContext && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Page Context
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(item.route_context).map(([k, v]) => (
                  <span key={k} className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-mono text-slate-600">
                    <span className="text-slate-400">{k}:</span> {String(v).slice(0, 40)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Viewport / UA */}
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

          {/* Status actions — inbox only */}
          {bucket === 'inbox' && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Update Status
              </p>
              <div className="flex flex-wrap gap-2">
                {['reviewing', 'planned', 'resolved', 'dismissed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatus(s)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${
                      item.status === s
                        ? `${STATUS_CONFIG[s].color}`
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Junk / Restore action */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Spam & Junk
            </p>
            {bucket === 'inbox' ? (
              <button
                onClick={handleMarkJunk}
                className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"
              >
                <Ban className="h-3.5 w-3.5" />
                Mark as Junk
              </button>
            ) : (
              <button
                onClick={handleRestore}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore to Inbox
              </button>
            )}
          </div>

          {/* Copy Fix Prompt — inbox only */}
          {bucket === 'inbox' && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Developer Prompt
              </p>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-[12px] font-bold text-violet-700 transition hover:bg-violet-100"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Fix Prompt
              </button>
              <p className="mt-1.5 text-[10px] text-slate-400">
                Generates a ready-to-paste prompt for Claude Code or Codex.
              </p>
            </div>
          )}

          {/* Internal note */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Internal Note
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note for your team…"
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={handleSaveNote}
              disabled={savingNote || note === (item.internal_note ?? '')}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40"
            >
              {savingNote
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Save className="h-3.5 w-3.5" />}
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

  const [bucket,        setBucket]        = useState('inbox'); // 'inbox' | 'junk'
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

  const inboxCount = allFeedback.filter((f) => !f.is_junk).length;
  const junkCount  = allFeedback.filter((f) =>  f.is_junk).length;
  const newCount   = allFeedback.filter((f) => !f.is_junk && f.status === 'new').length;

  const filtered = allFeedback.filter((item) => {
    if (bucket === 'junk') return Boolean(item.is_junk);
    if (item.is_junk) return false;
    if (statusFilter  !== 'all' && item.status        !== statusFilter)  return false;
    if (typeFilter    !== 'all' && item.feedback_type  !== typeFilter)    return false;
    if (urgencyFilter !== 'all' && item.urgency        !== urgencyFilter) return false;
    return true;
  });

  const isFiltered =
    bucket === 'inbox' &&
    (statusFilter !== 'all' || typeFilter !== 'all' || urgencyFilter !== 'all');

  return (
    <div className="min-h-screen bg-slate-50 mobile-safe-bottom">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">

        {/* Title bar */}
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

        {/* Bucket tabs: Inbox | Spam & Junk */}
        <div className="mobile-page-wide flex gap-1.5 px-4 pb-3">
          <button
            onClick={() => setBucket('inbox')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition ${
              bucket === 'inbox'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            Inbox
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none ${
              bucket === 'inbox' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {inboxCount}
            </span>
          </button>

          <button
            onClick={() => setBucket('junk')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition ${
              bucket === 'junk'
                ? 'bg-amber-600 text-white'
                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Ban className="h-3.5 w-3.5" />
            Spam & Junk
            {junkCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none ${
                bucket === 'junk' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
              }`}>
                {junkCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters — inbox tab only */}
        {bucket === 'inbox' && (
          <div className="mobile-page-wide flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 min-w-[120px] rounded-full border-slate-200 text-[12px]">
                <Filter className="mr-1 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
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
                {ALL_TYPES.map((t) => (
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
                {ALL_URGENCIES.map((u) => (
                  <SelectItem key={u} value={u} className="text-[12px]">
                    {u === 'all' ? 'All urgencies' : URGENCY_CONFIG[u]?.label ?? u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {/* ── Body ── */}
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
            {bucket === 'junk' ? (
              <>
                <Ban className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="font-bold text-slate-700">No spam or junk</p>
                <p className="mt-1 text-[13px] text-slate-400">
                  Items you mark as junk appear here and are never deleted.
                </p>
              </>
            ) : (
              <>
                <Inbox className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="font-bold text-slate-700">
                  {inboxCount === 0 ? 'No feedback yet' : 'No matches for current filters'}
                </p>
                <p className="mt-1 text-[13px] text-slate-400">
                  {inboxCount === 0
                    ? 'Submitted feedback will appear here.'
                    : 'Try clearing the filters.'}
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-[11px] font-semibold text-slate-400">
              {filtered.length} {filtered.length === 1 ? 'submission' : 'submissions'}
              {isFiltered ? ' (filtered)' : ''}
            </p>
            {filtered.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                currentUser={currentUser}
                onUpdate={handleUpdate}
                bucket={bucket}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
