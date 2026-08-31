import React from 'react';
import { AlertCircle, ArrowUpRight, Copy, Loader2, MessageSquare, Pencil, Plus, RotateCcw, Send, Square, X } from 'lucide-react';

const STATUS_STYLES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function publishingStatus(item = {}) {
  const moderation = item.moderationStatus || item.moderation_status;
  const lifecycle = item.lifecycleStatus || item.lifecycle_status;

  if (['temporarily_hidden', 'hidden', 'needs_review'].includes(moderation)) {
    return { label: 'Hidden for review', tone: 'red' };
  }
  if (moderation === 'removed') return { label: 'Removed', tone: 'red' };
  if (lifecycle === 'expired') return { label: 'Expired', tone: 'slate' };
  if (['ended', 'deleted'].includes(lifecycle)) return { label: 'Ended', tone: 'slate' };
  if (moderation === 'pending') return { label: 'Safety check', tone: 'amber' };
  return { label: 'Live', tone: 'green' };
}

function readableDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function StateCard({ icon: Icon, title, body, action, actionLabel }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-8 text-center shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></span>
      <h2 className="mt-4 text-lg font-black tracking-[-0.02em] text-slate-950">{title}</h2>
      <p className="mx-auto mt-1 max-w-[280px] text-sm font-medium leading-6 text-slate-600">{body}</p>
      {action && <button type="button" onClick={action} className="mt-5 min-h-11 rounded-[15px] bg-[#0A1838] px-5 text-sm font-black text-white">{actionLabel}</button>}
    </section>
  );
}

function PublishingCard({ item, onAction, pendingAction }) {
  const status = publishingStatus(item);
  const contentId = item.contentId || item.content_id || item.id;
  const headline = item.headline || item.title || item.content?.headline || 'Untitled post';
  const destination = item.destinationLabel || item.destination_label || item.audienceLabel || item.audience?.network || 'JUnited';
  const expires = readableDate(item.expiresAt || item.expires_at);
  const isLive = status.label === 'Live' || status.label === 'Safety check';
  const canAppeal = status.label === 'Hidden for review' || status.label === 'Removed';
  const busy = pendingAction?.contentId === contentId;

  const actionButton = (name, label, Icon, classes = '') => (
    <button
      type="button"
      disabled={busy}
      onClick={() => onAction(name, item)}
      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] text-[13px] font-black transition active:scale-[0.98] disabled:opacity-50 ${classes}`}
    >
      {busy && pendingAction?.name === name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-600">{destination}</p>
          <h2 className="mt-1.5 text-[19px] font-black leading-[1.15] tracking-[-0.025em] text-slate-950">{headline}</h2>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${STATUS_STYLES[status.tone]}`}>{status.label}</span>
      </div>
      {expires && isLive && <p className="mt-3 text-xs font-bold text-slate-500">Ends {expires}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {actionButton('open', 'Open', ArrowUpRight, 'bg-[#0A1838] text-white')}
        {actionButton('edit', 'Edit', Pencil, 'bg-blue-50 text-blue-700')}
        {isLive ? actionButton('end', 'End', Square, 'bg-slate-100 text-slate-700') : canAppeal ? actionButton('startAppeal', 'Appeal', MessageSquare, 'bg-rose-50 text-rose-700') : actionButton('reuse', 'Reuse', RotateCcw, 'bg-slate-100 text-slate-700')}
        {actionButton('reuse', 'Reuse', isLive ? Copy : RotateCcw, 'bg-slate-100 text-slate-700')}
      </div>
    </article>
  );
}

function AppealForm({ item, reason, onReason, onAction, pendingAction }) {
  const contentId = item.contentId || item.content_id || item.id;
  const busy = pendingAction?.name === 'appeal' && pendingAction?.contentId === contentId;
  return (
    <section className="rounded-[24px] border border-blue-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">Appeal</p><h2 className="mt-1 text-lg font-black text-slate-950">Why should we take another look?</h2></div>
        <button type="button" aria-label="Cancel appeal" onClick={() => onAction('cancelAppeal')} className="flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-slate-100 text-slate-600"><X className="h-4 w-4" /></button>
      </div>
      <p className="mt-1 text-sm font-medium leading-5 text-slate-600">Keep it simple. Add any context or source that helps us understand the post.</p>
      <textarea value={reason} onChange={(event) => onReason(event.target.value)} maxLength={600} rows={4} placeholder="Tell us what we should know…" className="mt-4 w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-base font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      <button type="button" disabled={busy || reason.trim().length < 10} onClick={() => onAction('appeal', { item, reason: reason.trim() })} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-blue-600 text-sm font-black text-white disabled:opacity-45">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send appeal
      </button>
    </section>
  );
}

export default function MyPublishing({ items = [], loading = false, error = null, actionError = '', actionNotice = '', appealItem = null, appealReason = '', onAppealReason = () => {}, onAction = () => {}, onRetry, pendingAction = null }) {
  if (loading) return <StateCard icon={Loader2} title="Loading your posts" body="Getting everything you’ve shared." />;
  if (error) return <StateCard icon={AlertCircle} title="Couldn’t load your posts" body="Nothing was changed. Check your connection and try again." action={onRetry} actionLabel="Try again" />;
  if (!items.length) return <StateCard icon={Plus} title="You haven’t published anything yet" body="When you share something, you’ll be able to manage it here." action={() => onAction('create')} actionLabel="Create your first post" />;

  return (
    <div className="space-y-3">
      {actionError && <p role="alert" className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{actionError}</p>}
      {actionNotice && <p role="status" className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{actionNotice}</p>}
      {appealItem && <AppealForm item={appealItem} reason={appealReason} onReason={onAppealReason} onAction={onAction} pendingAction={pendingAction} />}
      {items.map((item, index) => <PublishingCard key={item.contentId || item.content_id || item.id || index} item={item} onAction={onAction} pendingAction={pendingAction} />)}
    </div>
  );
}
