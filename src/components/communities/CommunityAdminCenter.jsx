import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X, LayoutDashboard, BarChart2, Users, Shield, Settings,
  Search, Loader2, Save, CheckCircle2, XCircle,
  UserMinus, UserCheck, Crown, ShieldCheck, MoreVertical, Clock, TrendingUp,
  AlertCircle, ShieldAlert, Gavel, Activity,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { dataService } from '@/services';
import { notificationsService } from '@/services/notificationsService';
import { COMMUNITY_TYPE_OPTIONS, getCommunityTypeKey } from '@/lib/communityTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',    label: 'Overview',    Icon: LayoutDashboard },
  { key: 'analytics',   label: 'Analytics',   Icon: BarChart2 },
  { key: 'members',     label: 'Members',     Icon: Users },
  { key: 'moderation',  label: 'Moderation',  Icon: ShieldAlert },
  { key: 'appeals',     label: 'Appeals',     Icon: Gavel },
  { key: 'settings',    label: 'Settings',    Icon: Settings },
];

const PUBLIC_REMOVAL_REASONS = [
  { code: 'spam_scam',        label: 'Spam or scam behavior' },
  { code: 'harassment',       label: 'Harassment or abusive conduct' },
  { code: 'off_topic',        label: 'Repeated off-topic posting' },
  { code: 'misinformation',   label: 'Misinformation or dangerous content' },
  { code: 'privacy_violation', label: 'Privacy violation / sharing personal info' },
  { code: 'hate_speech',      label: 'Hate or discriminatory content' },
  { code: 'rule_violation',   label: 'Violation of community rules' },
  { code: 'other',            label: 'Other (written explanation required)' },
];

const PRIVATE_REMOVAL_REASONS = [
  { code: 'not_eligible',          label: 'No longer fits membership criteria' },
  { code: 'restructuring',         label: 'Community restructuring' },
  { code: 'inactive_or_error',     label: 'Inactive or invited in error' },
  { code: 'expectation_violation', label: 'Violation of community expectations' },
  { code: 'other',                 label: 'Other' },
];

const PRIVACY_OPTIONS = ['Public', 'Community-only', 'Private', 'Private / Anonymous'];

const REASON_LABEL_MAP = Object.fromEntries(
  [...PUBLIC_REMOVAL_REASONS, ...PRIVATE_REMOVAL_REASONS].map(r => [r.code, r.label])
);

const ACTION_LABELS = {
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

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtRelative = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return fmtDate(iso);
};

const isPublicCommunity = (community) =>
  ['public'].includes(String(community?.privacy || 'public').toLowerCase());

// ─── Small UI components ──────────────────────────────────────────────────────

function Avatar({ name = '', size = 40 }) {
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

function RoleBadge({ role }) {
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

function StatCard({ label, value, sub, Icon, accent = 'blue', onClick }) {
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

function SimpleBarChart({ data, color = '#2563EB', label }) {
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

function EmptyState({ icon: Icon, title, body }) {
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

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[13px] font-black text-slate-500 uppercase tracking-wide">{title}</h3>
      {action}
    </div>
  );
}

// ─── Weekly bucket helper ─────────────────────────────────────────────────────

function buildWeeklyBuckets(rows, dateField, weekCount = 8) {
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

export default function CommunityAdminCenter({
  community,
  currentUser,
  open,
  onClose,
  onCommunityUpdated,
  initialTab = 'overview',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const communityId = community?.id;

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  if (!open || typeof document === 'undefined') return null;

  const tabProps = { communityId, community, currentUser, onNavigateTo: setActiveTab };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col bg-[#F8FAFB]">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-slate-100 px-4 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 flex-shrink-0"
            aria-label="Close admin center"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Center
            </p>
            <h1 className="text-[17px] font-black text-slate-950 leading-tight truncate">{community?.name}</h1>
          </div>
        </div>

        {/* Tab bar */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex min-w-max gap-1 pb-0">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors relative ${
                  activeTab === key ? 'text-[#2563EB]' : 'text-slate-500'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {activeTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'overview'   && <OverviewTab   {...tabProps} />}
        {activeTab === 'analytics'  && <AnalyticsTab  {...tabProps} />}
        {activeTab === 'members'    && <MembersTab    {...tabProps} />}
        {activeTab === 'moderation' && <ModerationTab {...tabProps} />}
        {activeTab === 'appeals'    && <AppealsTab    {...tabProps} />}
        {activeTab === 'settings'   && (
          <SettingsTab {...tabProps} onCommunityUpdated={onCommunityUpdated} onClose={onClose} />
        )}
      </main>
    </div>,
    document.body
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ communityId, community, onNavigateTo }) {
  const oneWeekAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), []);

  const { data: memberCount = community?.follower_count ?? 0 } = useQuery({
    queryKey: ['admin-ov-members', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('community_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).eq('status', 'active');
      return count ?? 0;
    },
  });

  const { data: newMembersCount = 0 } = useQuery({
    queryKey: ['admin-ov-new-members', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('community_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).eq('status', 'active')
        .gte('joined_at', oneWeekAgo);
      return count ?? 0;
    },
  });

  const { data: postsThisWeek = 0 } = useQuery({
    queryKey: ['admin-ov-posts', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).gte('created_at', oneWeekAgo);
      return count ?? 0;
    },
  });

  const { data: pendingAppeals = 0 } = useQuery({
    queryKey: ['admin-ov-appeals', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('community_member_appeals')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).eq('status', 'pending');
      return count ?? 0;
    },
  });

  const { data: adminCount = 0 } = useQuery({
    queryKey: ['admin-ov-admins', communityId],
    queryFn: async () => {
      const { count } = await supabase.from('community_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId).eq('status', 'active')
        .in('role', ['admin', 'owner', 'moderator', 'Admin', 'Owner', 'Moderator']);
      return count ?? 0;
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['admin-ov-activity', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_admin_audit_log')
        .select('*').eq('community_id', communityId)
        .order('created_at', { ascending: false }).limit(8);
      return data ?? [];
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
      {/* Privacy badge */}
      <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
        isPublicCommunity(community)
          ? 'bg-green-50 text-green-700'
          : 'bg-slate-100 text-slate-600'
      }`}>
        <Shield className="h-3 w-3" />
        {community?.privacy || 'Public'} community
        {isPublicCommunity(community) && (
          <span className="ml-1 text-green-600">· removal reasons required</span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total members" value={memberCount.toLocaleString()} Icon={Users} accent="blue"
          onClick={() => onNavigateTo('members')} />
        <StatCard label="Joined this week" value={newMembersCount} Icon={TrendingUp} accent="green" />
        <StatCard label="Posts this week" value={postsThisWeek} Icon={Activity} accent="purple" />
        <StatCard
          label="Pending appeals"
          value={pendingAppeals}
          Icon={Gavel}
          accent={pendingAppeals > 0 ? 'amber' : 'slate'}
          sub={pendingAppeals > 0 ? 'Needs review' : undefined}
          onClick={pendingAppeals > 0 ? () => onNavigateTo('appeals') : undefined}
        />
        <StatCard label="Admins & mods" value={adminCount} Icon={ShieldCheck} accent="blue"
          onClick={() => onNavigateTo('members')} />
      </div>

      {/* Recent activity */}
      <div>
        <SectionHeader title="Recent admin activity" />
        {activity.length === 0 ? (
          <EmptyState icon={Clock} title="No activity yet" body="Admin actions will appear here." />
        ) : (
          <div className="space-y-2">
            {activity.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-white border border-slate-100 px-4 py-3 flex items-start gap-3 shadow-sm">
                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">
                    {ACTION_LABELS[entry.action_type] || entry.action_type}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fmtRelative(entry.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ communityId, community }) {
  const { data: allMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['admin-analytics-members', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_memberships')
        .select('joined_at, created_at, role')
        .eq('community_id', communityId).eq('status', 'active');
      return data ?? [];
    },
  });

  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['admin-analytics-posts', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('posts')
        .select('created_at')
        .eq('community_id', communityId)
        .gte('created_at', new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString());
      return data ?? [];
    },
  });

  const joinBuckets  = useMemo(() => buildWeeklyBuckets(allMembers, 'joined_at'), [allMembers]);
  const postBuckets  = useMemo(() => buildWeeklyBuckets(allPosts,   'created_at'), [allPosts]);
  const totalMembers = allMembers.length;
  const totalPosts   = allPosts.length;
  const adminsCount  = allMembers.filter(m => ['admin','owner','moderator'].includes(String(m.role).toLowerCase())).length;

  if (membersLoading || postsLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total members', value: totalMembers.toLocaleString() },
          { label: 'Posts (8 wks)',  value: totalPosts },
          { label: 'Admins & mods', value: adminsCount },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm text-center">
            <div className="text-2xl font-black text-slate-950">{s.value}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Member join chart */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
        <SimpleBarChart data={joinBuckets} color="#2563EB" label="New members by week" />
        <p className="text-[11px] text-slate-400 mt-3">Based on join timestamps — last 8 weeks</p>
      </div>

      {/* Posts chart */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
        <SimpleBarChart data={postBuckets} color="#7C3AED" label="Posts by week" />
        <p className="text-[11px] text-slate-400 mt-3">Community posts in the last 8 weeks</p>
      </div>

      {/* Future note */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5 mb-1">
          <AlertCircle className="h-3.5 w-3.5" /> Future analytics
        </p>
        <p className="text-[12px] text-slate-400 leading-relaxed">
          Retention rates, engagement trends, and daily active member metrics
          require a <code className="bg-slate-200 px-1 rounded">community_daily_metrics</code> table
          populated by scheduled jobs. Not yet implemented.
        </p>
      </div>
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({ communityId, community, currentUser }) {
  const queryClient = useQueryClient();
  const [search, setSearch]           = useState('');
  const [removingMember, setRemoving] = useState(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['admin-members', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_memberships')
        .select('id, user_id, role, status, user_name, joined_at, created_at, profile:user_id(id, display_name, avatar_url)')
        .eq('community_id', communityId).eq('status', 'active')
        .order('joined_at', { ascending: true });
      return data ?? [];
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      const { data, error } = await supabase.rpc('update_community_member_role', {
        p_community_id: communityId,
        p_user_id: userId,
        p_new_role: newRole,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { newRole }) => {
      toast.success(`Role updated to ${newRole}`);
      queryClient.invalidateQueries({ queryKey: ['admin-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['admin-ov-admins', communityId] });
      setRoleMenuOpen(null);
    },
    onError: (err) => toast.error(err.message || 'Could not update role'),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return members;
    return members.filter(m => {
      const name = String(m.profile?.display_name || m.user_name || '').toLowerCase();
      return name.includes(q);
    });
  }, [members, search]);

  const isOwner = (m) => m.user_id === community?.created_by_user_id;
  const isSelf  = (m) => m.user_id === currentUser?.id;

  // Close role menu on outside click
  const menuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-role-menu]')) setRoleMenuOpen(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-blue-400"
        />
      </div>

      <SectionHeader title={`${filtered.length} member${filtered.length !== 1 ? 's' : ''}`} />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No members found" body="Try a different search term." />
      ) : (
        <div className="space-y-2">
          {filtered.map(m => {
            const name  = m.profile?.display_name || m.user_name || 'Member';
            const role  = String(m.role || 'member').toLowerCase();
            const owner = isOwner(m);
            const self  = isSelf(m);
            const canAct = !owner && !self;

            return (
              <div key={m.id} className="rounded-2xl bg-white border border-slate-100 px-4 py-3 shadow-sm flex items-center gap-3">
                <Avatar name={name} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-bold text-slate-900 truncate">{name}</p>
                    {owner && <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                    {self && <span className="text-[11px] text-slate-400">(you)</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <RoleBadge role={role} />
                    <span className="text-[11px] text-slate-400">
                      Joined {fmtDate(m.joined_at || m.created_at)}
                    </span>
                  </div>
                </div>

                {canAct && (
                  <div className="relative flex-shrink-0" data-role-menu>
                    <button
                      type="button"
                      onClick={() => setRoleMenuOpen(roleMenuOpen === m.id ? null : m.id)}
                      className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                      aria-label="Member actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {roleMenuOpen === m.id && (
                      <div className="absolute right-0 top-9 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl w-52 py-1.5 overflow-hidden">
                        {[
                          { label: 'Promote to Admin',     role: 'admin',     disabled: role === 'admin', Icon: ShieldCheck },
                          { label: 'Promote to Moderator', role: 'moderator', disabled: role === 'moderator', Icon: Shield },
                          { label: 'Demote to Member',     role: 'member',    disabled: role === 'member', Icon: UserCheck },
                        ].map(action => (
                          <button
                            key={action.role}
                            type="button"
                            disabled={action.disabled || roleChangeMutation.isPending}
                            onClick={() => roleChangeMutation.mutate({ userId: m.user_id, newRole: action.role })}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <action.Icon className="h-4 w-4 text-slate-400" />
                            {action.label}
                          </button>
                        ))}
                        <div className="mx-3 my-1 h-px bg-slate-100" />
                        <button
                          type="button"
                          onClick={() => { setRoleMenuOpen(null); setRemoving(m); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
                        >
                          <UserMinus className="h-4 w-4" />
                          Remove from community
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {removingMember && (
        <RemoveMemberModal
          member={removingMember}
          community={community}
          currentUser={currentUser}
          onClose={() => setRemoving(null)}
          onRemoved={() => {
            setRemoving(null);
            queryClient.invalidateQueries({ queryKey: ['admin-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['admin-ov-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
          }}
        />
      )}
    </div>
  );
}

// ─── Moderation tab ───────────────────────────────────────────────────────────

function ModerationTab({ communityId, community }) {
  const { data: removals = [], isLoading } = useQuery({
    queryKey: ['admin-removals', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_member_removals')
        .select(`
          id, removed_user_id, reason_code, reason_note, removed_at, community_privacy,
          removed_user:removed_user_id(display_name, avatar_url),
          remover:removed_by_user_id(display_name),
          appeal:community_member_appeals(id, status)
        `)
        .eq('community_id', communityId)
        .order('removed_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const appealStatus = (r) => r.appeal?.[0]?.status ?? null;
  const appealBadge = (status) => {
    if (!status) return null;
    const cfg = {
      pending:  'bg-amber-50 text-amber-700',
      approved: 'bg-green-50 text-green-700',
      denied:   'bg-slate-100 text-slate-500',
    }[status] || 'bg-slate-100 text-slate-500';
    return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${cfg}`}>Appeal: {status}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <SectionHeader title={`${removals.length} removal${removals.length !== 1 ? 's' : ''}`} />

      {removals.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No removals" body="Member removal records will appear here." />
      ) : (
        <div className="space-y-2">
          {removals.map(r => {
            const name = r.removed_user?.display_name || 'Former member';
            const removerName = r.remover?.display_name || 'Admin';
            const status = appealStatus(r);
            return (
              <div key={r.id} className="rounded-2xl bg-white border border-slate-100 px-4 py-3.5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar name={name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-bold text-slate-900">{name}</p>
                      {status && appealBadge(status)}
                    </div>
                    <p className="text-[12px] text-slate-600 mt-0.5">
                      {REASON_LABEL_MAP[r.reason_code] || r.reason_code}
                    </p>
                    {r.reason_note && (
                      <p className="text-[12px] text-slate-400 mt-1 italic">"{r.reason_note}"</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Removed by {removerName} · {fmtDate(r.removed_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note about community-scoped reports */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 mt-4">
        <p className="text-[12px] text-slate-500 leading-relaxed">
          <span className="font-bold">Future:</span> Community-scoped content reports require
          adding a <code className="bg-slate-200 px-1 rounded">community_id</code> column to
          the <code className="bg-slate-200 px-1 rounded">reports</code> table.
          Global reports are reviewed in the platform Admin Queue.
        </p>
      </div>
    </div>
  );
}

// ─── Appeals tab ──────────────────────────────────────────────────────────────

function AppealsTab({ communityId, community, currentUser }) {
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState(null);

  const { data: appeals = [], isLoading } = useQuery({
    queryKey: ['admin-appeals', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_member_appeals')
        .select(`
          id, removal_id, appellant_user_id, message, status, review_note, created_at, reviewed_at,
          removal:removal_id(reason_code, reason_note, removed_at, community_privacy),
          appellant:appellant_user_id(display_name, avatar_url),
          reviewer:reviewed_by_user_id(display_name)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const pending  = appeals.filter(a => a.status === 'pending');
  const resolved = appeals.filter(a => a.status !== 'pending');

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const AppealCard = ({ appeal }) => {
    const name   = appeal.appellant?.display_name || 'Member';
    const isPending = appeal.status === 'pending';
    return (
      <div className={`rounded-2xl bg-white border shadow-sm px-4 py-4 ${isPending ? 'border-amber-200' : 'border-slate-100'}`}>
        <div className="flex items-start gap-3">
          <Avatar name={name} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-bold text-slate-900">{name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                isPending ? 'bg-amber-50 text-amber-700' :
                appeal.status === 'approved' ? 'bg-green-50 text-green-700' :
                'bg-slate-100 text-slate-500'
              }`}>{appeal.status}</span>
            </div>

            {appeal.removal && (
              <p className="text-[12px] text-slate-500 mt-1">
                Removed for: <span className="font-semibold">
                  {REASON_LABEL_MAP[appeal.removal.reason_code] || appeal.removal.reason_code}
                </span>
              </p>
            )}

            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
              <p className="text-[12px] font-bold text-slate-500 mb-1">Appeal message</p>
              <p className="text-[13px] text-slate-700 leading-relaxed">{appeal.message}</p>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Submitted {fmtRelative(appeal.created_at)}
            </p>

            {appeal.status !== 'pending' && appeal.reviewer && (
              <p className="text-[11px] text-slate-400">
                Reviewed by {appeal.reviewer.display_name} · {fmtDate(appeal.reviewed_at)}
              </p>
            )}
            {appeal.review_note && (
              <p className="text-[12px] text-slate-500 italic mt-1">Admin note: "{appeal.review_note}"</p>
            )}
          </div>
        </div>

        {isPending && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReviewing({ ...appeal, action: 'approved' })}
              className="flex-1 h-9 rounded-xl bg-emerald-600 text-white text-[13px] font-black flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => setReviewing({ ...appeal, action: 'denied' })}
              className="flex-1 h-9 rounded-xl bg-slate-200 text-slate-700 text-[13px] font-black flex items-center justify-center gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              Deny
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
      {appeals.length === 0 ? (
        <EmptyState icon={Gavel} title="No pending appeals" body="When removed members submit appeals, they will appear here." />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <SectionHeader title={`${pending.length} pending`} />
              {pending.map(a => <AppealCard key={a.id} appeal={a} />)}
            </div>
          )}
          {resolved.length > 0 && (
            <div className="space-y-3">
              <SectionHeader title="Resolved" />
              {resolved.map(a => <AppealCard key={a.id} appeal={a} />)}
            </div>
          )}
        </>
      )}

      {reviewing && (
        <ReviewAppealModal
          appeal={reviewing}
          community={community}
          currentUser={currentUser}
          onClose={() => setReviewing(null)}
          onReviewed={() => {
            setReviewing(null);
            queryClient.invalidateQueries({ queryKey: ['admin-appeals', communityId] });
            queryClient.invalidateQueries({ queryKey: ['admin-ov-appeals', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
          }}
        />
      )}
    </div>
  );
}

// ─── Settings tab (inline form, same fields as CommunityManagePanel) ──────────

function SettingsTab({ communityId, community, onCommunityUpdated, onClose }) {
  const settings = useMemo(
    () => (community?.settings && typeof community.settings === 'object' ? community.settings : {}),
    [community?.settings]
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name:        community?.name || '',
    description: community?.description || community?.description_short || '',
    location:    community?.location || community?.neighborhood || '',
    category:    community?.category || COMMUNITY_TYPE_OPTIONS[0]?.label || 'Community',
    privacy:     community?.privacy || 'Public',
    rulesText:   Array.isArray(settings.rules) ? settings.rules.join('\n') : (settings.rules || community?.rules || ''),
  }));

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    const name        = form.name.trim();
    const description = form.description.trim();
    if (name.length < 2)        { toast.error('Community name is required.'); return; }
    if (description.length < 8) { toast.error('Add a short description.'); return; }

    const typeKey = getCommunityTypeKey({ category: form.category });
    const rules   = form.rulesText.split('\n').map(r => r.trim()).filter(Boolean);

    setSaving(true);
    try {
      const updated = await dataService.entities.Community.update(communityId, {
        name,
        description,
        description_short: description,
        location:    form.location.trim() || null,
        neighborhood: form.location.trim() || null,
        category:    form.category,
        type:        typeKey,
        template_key: typeKey,
        privacy:     form.privacy,
        settings:    { ...settings, rules },
      });
      toast.success('Community updated');
      onCommunityUpdated?.(updated);
    } catch (err) {
      toast.error(err?.message || 'Could not update community');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <SectionHeader title="Community profile" />

      {[
        { field: 'name', label: 'Community name', type: 'input' },
        { field: 'description', label: 'Description', type: 'textarea', rows: 4 },
      ].map(({ field, label, type, rows }) => (
        <label key={field} className="block">
          <span className="mb-1.5 block text-[13px] font-black text-slate-700">{label}</span>
          {type === 'textarea' ? (
            <textarea
              value={form[field]}
              onChange={e => setField(field, e.target.value)}
              rows={rows}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          ) : (
            <input
              value={form[field]}
              onChange={e => setField(field, e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          )}
        </label>
      ))}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-black text-slate-700">Type</span>
          <select
            value={form.category}
            onChange={e => setField('category', e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
          >
            {COMMUNITY_TYPE_OPTIONS.map(o => (
              <option key={o.key} value={o.label}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-black text-slate-700">Privacy</span>
          <select
            value={form.privacy}
            onChange={e => setField('privacy', e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
          >
            {PRIVACY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-black text-slate-700">Location / neighborhood</span>
        <input
          value={form.location}
          onChange={e => setField('location', e.target.value)}
          placeholder="Five Towns, Cedarhurst…"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-black text-slate-700">Rules</span>
        <textarea
          value={form.rulesText}
          onChange={e => setField('rulesText', e.target.value)}
          rows={5}
          placeholder="One rule per line"
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
        />
      </label>

      <div className="pt-2 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Remove member modal ──────────────────────────────────────────────────────

function RemoveMemberModal({ member, community, currentUser, onClose, onRemoved }) {
  const isPublic    = isPublicCommunity(community);
  const reasons     = isPublic ? PUBLIC_REMOVAL_REASONS : PRIVATE_REMOVAL_REASONS;
  const [reasonCode, setReasonCode]   = useState('');
  const [reasonNote, setReasonNote]   = useState('');
  const [confirming, setConfirming]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  const name = member.profile?.display_name || member.user_name || 'this member';

  const handleRemove = async () => {
    if (!reasonCode) { toast.error('Select a removal reason.'); return; }
    if (reasonCode === 'other' && isPublic && !reasonNote.trim()) {
      toast.error('A written explanation is required for "Other".'); return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('remove_community_member', {
        p_community_id: community.id,
        p_user_id:      member.user_id,
        p_reason_code:  reasonCode,
        p_reason_note:  reasonNote.trim() || null,
      });
      if (error) throw error;

      // Notify removed user
      try {
        await notificationsService.notifyMemberRemoved({
          removedUserId: member.user_id,
          adminId:       currentUser.id,
          communityName: community.name,
          communityId:   community.id,
          removalId:     data?.removal_id,
        });
      } catch { /* notification failure is non-fatal */ }

      toast.success(`${name} was removed from the community.`);
      onRemoved();
    } catch (err) {
      toast.error(err.message || 'Could not remove member');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-md sm:rounded-[28px]">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red-700">
                <UserMinus className="h-3.5 w-3.5" />
                Remove member
              </p>
              <h2 className="mt-2 text-[18px] font-black text-slate-950">Remove {name}?</h2>
              {isPublic && (
                <p className="mt-1 text-[12px] font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 mt-2">
                  This is a public community — a valid reason is required and the member can appeal.
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-[13px] font-black text-slate-700 mb-2">
              {isPublic ? 'Removal reason (required)' : 'Removal reason'}
            </p>
            <div className="space-y-2">
              {reasons.map(r => (
                <label key={r.code} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.code}
                    checked={reasonCode === r.code}
                    onChange={() => setReasonCode(r.code)}
                    className="mt-0.5 accent-blue-600"
                  />
                  <span className="text-[13px] font-semibold text-slate-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[13px] font-black text-slate-700 mb-1.5 block">
              Admin note
              {isPublic && reasonCode === 'other' ? ' (required)' : ' (optional)'}
            </span>
            <textarea
              value={reasonNote}
              onChange={e => setReasonNote(e.target.value)}
              rows={3}
              placeholder="Add context for your records…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
        </section>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={submitting || (!reasonCode && isPublic)}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
            {submitting ? 'Removing…' : 'Remove member'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

// ─── Review appeal modal ──────────────────────────────────────────────────────

function ReviewAppealModal({ appeal, community, currentUser, onClose, onReviewed }) {
  const decision    = appeal.action; // 'approved' | 'denied'
  const [note, setNote]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isApprove = decision === 'approved';

  const handleReview = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('review_community_appeal', {
        p_appeal_id:   appeal.id,
        p_decision:    decision,
        p_review_note: note.trim() || null,
      });
      if (error) throw error;

      // Notify appellant
      try {
        await notificationsService.notifyAppealResolved({
          userId:        appeal.appellant_user_id,
          adminId:       currentUser.id,
          communityName: community.name,
          communityId:   community.id,
          decision,
        });
      } catch { /* non-fatal */ }

      toast.success(isApprove ? 'Appeal approved — member reinstated.' : 'Appeal denied.');
      onReviewed();
    } catch (err) {
      toast.error(err.message || 'Could not process appeal review');
    } finally {
      setSubmitting(false);
    }
  };

  const name = appeal.appellant?.display_name || 'this member';

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-md sm:rounded-[28px]">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
              isApprove ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {isApprove ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {isApprove ? 'Approve appeal' : 'Deny appeal'}
            </p>
            <h2 className="mt-2 text-[17px] font-black text-slate-950">
              {isApprove ? `Reinstate ${name}?` : `Deny ${name}'s appeal?`}
            </h2>
            {isApprove && (
              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                They will be re-added as a regular member.
              </p>
            )}
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Appeal summary */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[12px] font-bold text-slate-500 mb-1">Appeal message</p>
            <p className="text-[13px] text-slate-700 leading-relaxed">{appeal.message}</p>
          </div>
          {appeal.removal && (
            <div className="text-[12px] text-slate-500">
              <span className="font-bold">Original reason: </span>
              {REASON_LABEL_MAP[appeal.removal.reason_code] || appeal.removal.reason_code}
            </div>
          )}
          <label className="block">
            <span className="text-[13px] font-black text-slate-700 mb-1.5 block">Review note (optional)</span>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Leave a note about this decision…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
        </section>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReview}
            disabled={submitting}
            className={`flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white disabled:opacity-60 ${
              isApprove ? 'bg-emerald-600' : 'bg-slate-800'
            }`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> :
              isApprove ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {submitting ? 'Saving…' : isApprove ? 'Approve & reinstate' : 'Deny appeal'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

// ─── AppealSubmitModal (exported — used in CommunityDetailView for removed users) ──

export function AppealSubmitModal({ removal, communityName, onClose, onSubmitted }) {
  const [message, setMessage]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error('Please write your appeal message.'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('submit_community_appeal', {
        p_removal_id: removal.id,
        p_message:    message.trim(),
      });
      if (error) throw error;
      toast.success('Your appeal has been submitted. The community admin will review it.');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.message || 'Could not submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-md sm:rounded-[28px]">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
              <Gavel className="h-3.5 w-3.5" /> Appeal removal
            </p>
            <h2 className="mt-2 text-[17px] font-black text-slate-950">
              Appeal your removal from {communityName || 'this community'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Explain why you believe this decision should be reconsidered.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-[13px] font-black text-slate-700 mb-1.5 block">Your message</span>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={6}
              placeholder="Explain why you believe this removal was in error or why you should be reinstated…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
          <p className="text-[11px] text-slate-400 mt-2">You can only submit one appeal per removal.</p>
        </section>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
            {submitting ? 'Submitting…' : 'Submit appeal'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
