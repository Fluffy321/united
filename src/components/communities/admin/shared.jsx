import React from 'react';
import { Crown, ShieldCheck } from 'lucide-react';

// ─── Shared constants ─────────────────────────────────────────────────────────

export const MODULE_CONFIG = [
  { key: 'allow_member_events',   label: 'Events',      description: 'Free includes up to 3 upcoming published events; Premium is unlimited' },
  { key: 'allow_resources',       label: 'Resources',   description: 'Free includes up to 10 resources; Premium is unlimited' },
  { key: 'allow_forms',           label: 'Forms & Signups', description: 'Create signup sheets, volunteer forms, and surveys for members' },
  { key: 'allow_member_listings', label: 'Marketplace', description: 'Members can post buy/sell listings', premium: true },
  { key: 'allow_group_chat',      label: 'Group Chat',  description: 'Real-time group chat tab' },
];

export const PUBLIC_REMOVAL_REASONS = [
  { code: 'spam_scam',        label: 'Spam or scam behavior' },
  { code: 'harassment',       label: 'Harassment or abusive conduct' },
  { code: 'off_topic',        label: 'Repeated off-topic posting' },
  { code: 'misinformation',   label: 'Misinformation or dangerous content' },
  { code: 'privacy_violation', label: 'Privacy violation / sharing personal info' },
  { code: 'hate_speech',      label: 'Hate or discriminatory content' },
  { code: 'rule_violation',   label: 'Violation of community rules' },
  { code: 'other',            label: 'Other (written explanation required)' },
];

export const PRIVATE_REMOVAL_REASONS = [
  { code: 'not_eligible',          label: 'No longer fits membership criteria' },
  { code: 'restructuring',         label: 'Community restructuring' },
  { code: 'inactive_or_error',     label: 'Inactive or invited in error' },
  { code: 'expectation_violation', label: 'Violation of community expectations' },
  { code: 'other',                 label: 'Other' },
];

export const PRIVACY_OPTIONS = ['Public', 'Community-only', 'Private', 'Private / Anonymous'];

export const REASON_LABEL_MAP = Object.fromEntries(
  [...PUBLIC_REMOVAL_REASONS, ...PRIVATE_REMOVAL_REASONS].map(r => [r.code, r.label])
);

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

export const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const fmtRelative = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return fmtDate(iso);
};

export const isPublicCommunity = (community) =>
  ['public'].includes(String(community?.privacy || 'public').toLowerCase());

// ─── Small UI components ──────────────────────────────────────────────────────

export function Avatar({ name = '', size = 40 }) {
  const initial = String(name).trim()[0]?.toUpperCase() || '?';
  const colors = ['#2563EB','#7C3AED','#16A34A','#D97706','#DC2626','#0891B2'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: color }}
    >
      {initial}
    </div>
  );
}

export function RoleBadge({ role }) {
  const r = String(role || 'member').toLowerCase();
  const cfg = {
    owner:     'bg-amber-100 text-amber-800',
    admin:     'bg-blue-100 text-blue-800',
    moderator: 'bg-purple-100 text-purple-800',
    member:    'bg-slate-100 text-slate-600',
  }[r] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${cfg}`}>
      {r === 'owner' && <Crown className="h-2.5 w-2.5" />}
      {r === 'admin' && <ShieldCheck className="h-2.5 w-2.5" />}
      {r}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-[15px] font-black text-slate-700">{title}</p>
      {body && <p className="text-[13px] font-semibold text-slate-400 mt-1 max-w-xs">{body}</p>}
    </div>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[13px] font-black text-slate-500 uppercase tracking-wide">{title}</h3>
      {action}
    </div>
  );
}
