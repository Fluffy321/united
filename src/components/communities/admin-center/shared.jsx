import React from 'react';
import { Crown, ShieldCheck,
} from 'lucide-react';

export const MODULE_CONFIG = [
  { key: 'allow_member_events',   label: 'Events',      description: 'Free includes up to 3 upcoming published events; Premium is unlimited' },
  { key: 'allow_resources',       label: 'Resources',   description: 'Free includes up to 10 resources; Premium is unlimited' },
  { key: 'allow_forms',           label: 'Forms & Signups', description: 'Create signup sheets, volunteer forms, and surveys for members' },
  { key: 'allow_member_listings', label: 'Marketplace', description: 'Members can post buy/sell listings', premium: true },
  { key: 'allow_group_chat',      label: 'Group Chat',  description: 'Real-time group chat tab' },
];

export const SETTINGS_SECTIONS = [
  { key: 'profile',     label: 'Profile' },
  { key: 'appearance',  label: 'Appearance' },
  { key: 'modules',     label: 'Modules' },
  { key: 'permissions', label: 'Permissions' },
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

export const ACTION_LABELS = {
  member_removed:  'Removed member',
  appeal_submitted:'Member submitted appeal',
  appeal_approved: 'Appeal approved — member reinstated',
  appeal_denied:   'Appeal denied',
  role_promoted:   'Promoted member',
  role_demoted:    'Demoted member',
  settings_changed:'Updated community settings',
  community_updated:'Updated community profile',
};

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

export function StatCard({ label, value, sub, Icon, accent = 'blue', onClick }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    slate:  'bg-slate-100 text-slate-600',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm text-left w-full disabled:cursor-default active:scale-[0.98] transition-transform"
    >
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3 ${colors[accent]}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="text-2xl font-black text-slate-950">{value ?? '—'}</div>
      <div className="text-[12px] font-semibold text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
    </button>
  );
}

export function SimpleBarChart({ data, color = '#2563EB', label }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {label && <p className="text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-wide">{label}</p>}
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[10px] font-bold text-slate-500">{d.value || ''}</div>
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${Math.max(d.value > 0 ? 4 : 0, (d.value / max) * 80)}px`,
                background: color,
                opacity: 0.75 + 0.25 * (i / data.length),
              }}
            />
            <div className="text-[9px] text-slate-400 text-center leading-tight">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
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

// ─── Weekly bucket helper ─────────────────────────────────────────────────────

export function buildWeeklyBuckets(rows, dateField, weekCount = 8) {
  const buckets = [];
  const now = new Date();
  for (let i = weekCount - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1 - i * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const value = rows.filter(r => {
      const d = new Date(r[dateField] || r.created_at);
      return d >= start && d < end;
    }).length;
    buckets.push({ label, value, start });
  }
  return buckets;
}

// ─── Main component ───────────────────────────────────────────────────────────
