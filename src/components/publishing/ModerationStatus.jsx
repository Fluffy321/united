import React from 'react';

const STATUS = {
  pending: ['Checking', 'bg-amber-100 text-amber-800'],
  clear: ['Live', 'bg-emerald-100 text-emerald-800'],
  needs_review: ['Needs review', 'bg-amber-100 text-amber-800'],
  temporarily_hidden: ['Temporarily hidden', 'bg-rose-100 text-rose-800'],
  restored: ['Restored', 'bg-blue-100 text-blue-800'],
  ended: ['Ended', 'bg-slate-100 text-slate-700'],
  expired: ['Expired', 'bg-slate-100 text-slate-700'],
};

export default function ModerationStatus({ status = 'pending' }) {
  const [label, style] = STATUS[status] || STATUS.pending;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${style}`}>{label}</span>;
}
