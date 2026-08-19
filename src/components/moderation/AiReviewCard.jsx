import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  MapPin,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';

const DEFAULT_REASONS = {
  restore: 'Reviewed by a platform admin and restored.',
  keep_hidden: 'Reviewed by a platform admin and kept hidden.',
  dismiss: 'Reviewed by a platform admin and dismissed.',
};

export function createAdminDecision(decision, reason) {
  const cleanReason = String(reason || '').trim();
  if (decision === 'remove' && !cleanReason) {
    return { valid: false, error: 'Add a reason before permanently removing this post.' };
  }
  return {
    valid: true,
    decision,
    reason: cleanReason || DEFAULT_REASONS[decision] || 'Reviewed by a platform admin.',
  };
}

function MetadataPill({ children }) {
  return <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">{children}</span>;
}

export default function AiReviewCard({ review, onDecision, busy = false }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const confidence = Math.round(Math.max(0, Math.min(1, Number(review.confidence) || 0)) * 100);

  const decide = (decision) => {
    const result = createAdminDecision(decision, reason);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    setError('');
    onDecision?.({ jobId: review.id, decision: result.decision, reason: result.reason });
  };

  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,28,46,0.08)]">
      <div className="flex items-center justify-between gap-3 bg-navy px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">AI review</p>
            <p className="truncate text-sm font-bold">Needs a human decision</p>
          </div>
        </div>
        <span className="rounded-full bg-amber-300 px-2.5 py-1 text-[11px] font-black text-navy">{confidence}%</span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">{review.publishingTypeLabel}</p>
          <p className="text-[17px] font-bold leading-snug text-navy">{review.contentPreview}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <MetadataPill><UserRound className="mr-1 inline h-3.5 w-3.5" />{review.authorName}</MetadataPill>
          <MetadataPill><MapPin className="mr-1 inline h-3.5 w-3.5" />{review.audienceLabel}</MetadataPill>
          {review.moderationStatus === 'temporarily_hidden' && (
            <MetadataPill><EyeOff className="mr-1 inline h-3.5 w-3.5" />Temporarily hidden</MetadataPill>
          )}
        </div>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
          <div className="mb-1 flex items-center gap-2 text-sm font-black text-amber-950">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            AI flagged this because
          </div>
          <p className="text-sm leading-relaxed text-amber-950/80">{review.aiReason}</p>
          <p className="mt-2 text-[11px] font-bold text-amber-900">Final decision: Aryeh or Jonny</p>
        </section>

        {review.sourceUrl && (
          <a
            href={review.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-800"
          >
            Open submitted source
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}

        <details className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-600">
          <summary className="cursor-pointer font-bold text-slate-700">Review details</summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
            <dt>Provider</dt><dd className="font-semibold text-slate-800">{review.provider}</dd>
            <dt>Model</dt><dd className="font-semibold text-slate-800">{review.model}</dd>
            <dt>Policy</dt><dd className="font-semibold text-slate-800">{review.policyVersion}</dd>
          </dl>
        </details>

        <div>
          <label htmlFor={`moderation-reason-${review.id}`} className="mb-1.5 block text-xs font-bold text-slate-700">
            Admin note <span className="font-medium text-slate-400">(required to remove)</span>
          </label>
          <textarea
            id={`moderation-reason-${review.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="What did you decide and why?"
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {error && <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2" aria-label="Human moderation decisions">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide('restore')}
            className="min-h-11 rounded-xl bg-emerald-600 px-2 text-xs font-black text-white disabled:opacity-50"
          >
            <CheckCircle2 className="mx-auto mb-0.5 h-4 w-4" aria-hidden="true" />Restore
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide('keep_hidden')}
            className="min-h-11 rounded-xl bg-navy px-2 text-xs font-black text-white disabled:opacity-50"
          >
            <EyeOff className="mx-auto mb-0.5 h-4 w-4" aria-hidden="true" />Keep hidden
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide('remove')}
            className="min-h-11 rounded-xl border border-red-200 bg-red-50 px-2 text-xs font-black text-red-700 disabled:opacity-50"
          >
            <Trash2 className="mx-auto mb-0.5 h-4 w-4" aria-hidden="true" />Remove
          </button>
        </div>
      </div>
    </article>
  );
}
