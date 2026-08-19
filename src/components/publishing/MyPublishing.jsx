import React from 'react';
import { AlertCircle, ArrowUpRight, Copy, Loader2, Pencil, Plus, RotateCcw, Square } from 'lucide-react';

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
        {isLive ? actionButton('end', 'End', Square, 'bg-slate-100 text-slate-700') : actionButton('reuse', 'Reuse', RotateCcw, 'bg-slate-100 text-slate-700')}
        {isLive ? actionButton('reuse', 'Reuse', Copy, 'bg-slate-100 text-slate-700') : actionButton('open', 'View', ArrowUpRight, 'bg-slate-100 text-slate-700')}
      </div>
    </article>
  );
}

export default function MyPublishing({ items = [], loading = false, error = null, actionError = '', onAction = () => {}, onRetry, pendingAction = null }) {
  if (loading) return <StateCard icon={Loader2} title="Loading your posts" body="Getting everything you’ve shared." />;
  if (error) return <StateCard icon={AlertCircle} title="Couldn’t load your posts" body="Nothing was changed. Check your connection and try again." action={onRetry} actionLabel="Try again" />;
  if (!items.length) return <StateCard icon={Plus} title="You haven’t published anything yet" body="When you share something, you’ll be able to manage it here." action={() => onAction('create')} actionLabel="Create your first post" />;

  return (
    <div className="space-y-3">
      {actionError && <p role="alert" className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{actionError}</p>}
      {items.map((item, index) => <PublishingCard key={item.contentId || item.content_id || item.id || index} item={item} onAction={onAction} pendingAction={pendingAction} />)}
    </div>
  );
}
