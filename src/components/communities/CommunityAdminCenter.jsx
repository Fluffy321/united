import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X, LayoutDashboard, BarChart2, Users, Shield, Settings,
  Search, Loader2, Save, CheckCircle2, XCircle, ExternalLink,
  UserMinus, UserCheck, UserPlus, Crown, ShieldCheck, MoreVertical, Clock, TrendingUp,
  AlertCircle, ShieldAlert, Gavel, Activity, Trash2, AlertTriangle,
  Pin, Image, Lock, Globe, Upload, CreditCard, Megaphone, Send,
  LayoutGrid, ChevronUp, ChevronDown, Palette, Tag,
  ClipboardList, FilePlus, Download, ToggleLeft, ToggleRight, Eye, ChevronRight,
  ShoppingBag, Package, DollarSign,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { dataService } from '@/services';
import postsService from '@/services/postsService';
import paymentsService from '@/services/paymentsService';
import { notificationsService } from '@/services/notificationsService';
import { COMMUNITY_TYPE_OPTIONS, getCommunityTypeConfig, getCommunityTabLabel, getCommunityTypeKey } from '@/lib/communityTypes';
import CommunityInviteModal from './CommunityInviteModal';
import { formatPlanDate, getCommunityPlanStatusLabel, isCommunityPremium } from '@/lib/communityPlans';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',    label: 'Overview',    Icon: LayoutDashboard },
  { key: 'billing',     label: 'Billing',     Icon: CreditCard },
  { key: 'analytics',   label: 'Analytics',   Icon: BarChart2 },
  { key: 'content',     label: 'Content',     Icon: Pin },
  { key: 'members',     label: 'Members',     Icon: Users },
  { key: 'forms',       label: 'Forms',       Icon: ClipboardList },
  { key: 'store',       label: 'Store',       Icon: ShoppingBag },
  { key: 'localUpdates', label: 'Updates',    Icon: Activity },
  { key: 'moderation',  label: 'Moderation',  Icon: ShieldAlert },
  { key: 'appeals',     label: 'Appeals',     Icon: Gavel },
  { key: 'layout',      label: 'Layout',      Icon: LayoutGrid },
  { key: 'branding',    label: 'Branding',    Icon: Palette },
  { key: 'settings',    label: 'Settings',    Icon: Settings },
];

const MODULE_CONFIG = [
  { key: 'allow_member_events',   label: 'Events',      description: 'Free includes up to 3 upcoming published events; Premium is unlimited' },
  { key: 'allow_resources',       label: 'Resources',   description: 'Free includes up to 10 resources; Premium is unlimited' },
  { key: 'allow_forms',           label: 'Forms & Signups', description: 'Create signup sheets, volunteer forms, and surveys for members' },
  { key: 'allow_member_listings', label: 'Marketplace', description: 'Members can post buy/sell listings', premium: true },
  { key: 'allow_group_chat',      label: 'Group Chat',  description: 'Real-time group chat tab', premium: true },
];

const SETTINGS_SECTIONS = [
  { key: 'profile',     label: 'Profile' },
  { key: 'appearance',  label: 'Appearance' },
  { key: 'modules',     label: 'Modules' },
  { key: 'permissions', label: 'Permissions' },
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
  onDeleted,
  initialTab = 'overview',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const communityId = community?.id;

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  if (!open || typeof document === 'undefined') return null;

  const tabProps = { communityId, community, currentUser, onNavigateTo: setActiveTab, onCommunityUpdated, onDeleted };

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
        {activeTab === 'billing'    && <BillingTab    {...tabProps} />}
        {activeTab === 'analytics'  && <AnalyticsTab  {...tabProps} />}
        {activeTab === 'content'    && <ContentTab    {...tabProps} />}
        {activeTab === 'members'    && <MembersTab    {...tabProps} />}
        {activeTab === 'forms'      && <AdminFormsTab {...tabProps} />}
        {activeTab === 'store'      && <StoreAdminTab {...tabProps} />}
        {activeTab === 'localUpdates' && <LocalUpdatesTab {...tabProps} />}
        {activeTab === 'moderation' && <ModerationTab {...tabProps} />}
        {activeTab === 'appeals'    && <AppealsTab    {...tabProps} />}
        {activeTab === 'layout'     && <LayoutTab     {...tabProps} onCommunityUpdated={onCommunityUpdated} />}
        {activeTab === 'branding'   && <BrandingTab   {...tabProps} onCommunityUpdated={onCommunityUpdated} />}
        {activeTab === 'settings'   && (
          <SettingsTab {...tabProps} onCommunityUpdated={onCommunityUpdated} onClose={onClose} onDeleted={onDeleted} />
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

// ─── Billing tab ─────────────────────────────────────────────────────────────

function BillingTab({ communityId, community, currentUser, onCommunityUpdated }) {
  const queryClient = useQueryClient();
  const premiumActive = isCommunityPremium(community);
  const { data: myMembershipRows = [] } = useQuery({
    queryKey: ['community-billing-membership', communityId, currentUser?.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ community_id: communityId, user_id: currentUser.id }),
    enabled: Boolean(communityId && currentUser?.id),
  });
  const membershipRole = String(myMembershipRows[0]?.role || community?.myRole || community?.role || '').toLowerCase();
  const membershipStatus = String(myMembershipRows[0]?.status || 'active').toLowerCase();
  const canManageBilling = Boolean(
    currentUser?.role === 'admin'
    || community?.created_by_user_id === currentUser?.id
    || (membershipStatus === 'active' && ['owner', 'admin'].includes(membershipRole))
  );

  const { data: planRows = [], isLoading } = useQuery({
    queryKey: ['community-plan-subscriptions', communityId],
    queryFn: () => dataService.entities.CommunityPlanSubscription.filter(
      { community_id: communityId },
      '-created_at',
      5
    ),
    enabled: Boolean(communityId && canManageBilling),
  });

  const latestPlan = planRows[0] || null;
  const renewalDate = formatPlanDate(community?.plan_current_period_end || latestPlan?.current_period_end);
  const statusLabel = getCommunityPlanStatusLabel(community?.plan_status || latestPlan?.status);

  const checkoutMutation = useMutation({
    mutationFn: (interval) => paymentsService.createCommunityPlanCheckout({ communityId, interval }),
    onSuccess: ({ data }) => {
      if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      toast.error(error?.message || 'Could not open Premium checkout');
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => paymentsService.createCommunityPlanPortalSession({ communityId }),
    onSuccess: ({ data }) => {
      if (data?.portalUrl) window.location.href = data.portalUrl;
    },
    onError: (error) => {
      toast.error(error?.message || 'Could not open billing portal');
    },
  });

  const refreshBilling = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['community-plan-subscriptions', communityId] }),
      queryClient.invalidateQueries({ queryKey: ['community', communityId] }),
    ]);
    onCommunityUpdated?.(community);
  };

  if (!canManageBilling) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black text-slate-950">Billing is limited to owners and admins</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Moderators can help manage content and members, but only community owners and admins can change the paid plan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 px-4 py-5">
      <div className={`rounded-3xl border p-5 shadow-sm ${
        premiumActive
          ? 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50'
          : 'border-slate-100 bg-white'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
              <Crown className="h-3.5 w-3.5" />
              {statusLabel}
            </p>
            <h2 className="mt-3 text-xl font-black text-slate-950">
              {premiumActive ? 'Premium Community Plan' : 'Free Community Plan'}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              {premiumActive
                ? 'Unlimited events, unlimited resources, chat, and marketplace are unlocked for this community.'
                : 'Free communities include posts, members, basic admin tools, limited events, and limited resources.'}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <PlanFeature label="Free" detail="Posts, members, 3 events, 10 resources" active />
          <PlanFeature label="Premium" detail="Unlimited events/resources, chat, marketplace" active={premiumActive} />
          <PlanFeature
            label={renewalDate ? (latestPlan?.cancel_at_period_end ? 'Cancels' : 'Renews') : 'Status'}
            detail={renewalDate || statusLabel}
            active={premiumActive}
          />
        </div>

        {community?.plan_status === 'past_due' && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[13px] font-black text-amber-900">Payment needs attention</p>
            <p className="mt-0.5 text-[12px] font-semibold text-amber-800">
              Premium features stay visible for now, but billing should be updated soon.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {premiumActive || latestPlan ? (
            <button
              type="button"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
            >
              {portalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Manage billing
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => checkoutMutation.mutate('monthly')}
                disabled={checkoutMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm shadow-blue-600/20 disabled:opacity-60"
              >
                {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                Upgrade monthly
              </button>
              <button
                type="button"
                onClick={() => checkoutMutation.mutate('annual')}
                disabled={checkoutMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-5 text-sm font-black text-blue-700 disabled:opacity-60"
              >
                Annual plan
              </button>
            </>
          )}
          <button
            type="button"
            onClick={refreshBilling}
            disabled={isLoading}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 disabled:opacity-60"
          >
            Refresh status
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <SectionHeader title="Plan features" />
        <div className="mt-3 grid gap-2">
          {MODULE_CONFIG.map((module) => (
            <div key={module.key} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-3">
              <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                premiumActive || !module.premium ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {premiumActive || !module.premium ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-black text-slate-900">{module.label}</p>
                <p className="mt-0.5 text-[12px] font-semibold leading-5 text-slate-500">{module.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ label, detail, active }) {
  return (
    <div className={`rounded-2xl border px-3 py-3 ${
      active ? 'border-blue-100 bg-white text-slate-900' : 'border-slate-100 bg-slate-50 text-slate-500'
    }`}>
      <p className="text-[11px] font-black uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-[12px] font-bold leading-5">{detail}</p>
    </div>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ communityId }) {
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

// ─── Content tab (pinned post) ────────────────────────────────────────────────

function ContentTab({ communityId, currentUser }) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [pinAnnouncement, setPinAnnouncement] = useState(true);
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  const { data: pinnedPost = null } = useQuery({
    queryKey: ['community-pinned-post', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('posts')
        .select('id, title, body, content, type, post_type, post_kind, is_official, created_at')
        .eq('community_id', communityId)
        .eq('is_pinned', true)
        .order('pinned_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: recentPosts = [] } = useQuery({
    queryKey: ['community-content-posts', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('posts')
        .select('id, title, body, content, type, post_type, post_kind, is_official, created_at')
        .eq('community_id', communityId)
        .eq('is_pinned', false)
        .order('created_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: pickerOpen,
  });

  const invalidatePins = () => {
    queryClient.invalidateQueries({ queryKey: ['community-pinned-post', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-content-posts', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-hub-posts', communityId] });
  };

  const handleCreateAnnouncement = async () => {
    const body = announcementBody.trim();
    const title = announcementTitle.trim();
    if (!body) {
      toast.error('Add announcement text first.');
      return;
    }
    setCreatingAnnouncement(true);
    try {
      if (pinAnnouncement && pinnedPost) {
        const { error: unpinError } = await supabase.from('posts').update({ is_pinned: false }).eq('id', pinnedPost.id);
        if (unpinError) throw unpinError;
      }
      await postsService.createCommunityPost({
        community_id: communityId,
        user_id: currentUser?.id,
        author_user_id: currentUser?.id,
        author_name: currentUser?.display_name || currentUser?.full_name || 'Community admin',
        title: title || (body.length > 72 ? body.slice(0, 72) : 'Community announcement'),
        body,
        content: body,
        type: 'announcement',
        post_type: 'announcement',
        post_kind: 'announcement',
        is_official: true,
        is_pinned: pinAnnouncement,
      });
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setPinAnnouncement(true);
      invalidatePins();
      toast.success(pinAnnouncement ? 'Announcement posted and featured' : 'Announcement posted');
    } catch (err) {
      toast.error(err?.message || 'Could not create announcement');
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handlePin = async (postId) => {
    setPinning(true);
    try {
      if (pinnedPost) {
        await supabase.from('posts').update({ is_pinned: false }).eq('id', pinnedPost.id);
      }
      const { error } = await supabase.from('posts').update({ is_pinned: true }).eq('id', postId);
      if (error) throw error;
      invalidatePins();
      toast.success('Post pinned');
      setPickerOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Could not pin post');
    } finally {
      setPinning(false);
    }
  };

  const handleUnpin = async () => {
    if (!pinnedPost) return;
    setPinning(true);
    try {
      const { error } = await supabase.from('posts').update({ is_pinned: false }).eq('id', pinnedPost.id);
      if (error) throw error;
      invalidatePins();
      toast.success('Post unpinned');
    } catch (err) {
      toast.error(err?.message || 'Could not unpin post');
    } finally {
      setPinning(false);
    }
  };

  const postSnippet = (post) => {
    const text = post.title || post.content || '';
    return text.length > 80 ? text.slice(0, 80) + '…' : text;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      <div>
        <SectionHeader title="Official announcement" />
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-4 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">Create an official update</p>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-600">
                Announcements are labeled as official community updates and appear in the community experience.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              value={announcementTitle}
              onChange={(event) => setAnnouncementTitle(event.target.value)}
              placeholder="Optional headline"
              className="h-11 w-full rounded-2xl border border-amber-100 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-amber-300"
            />
            <textarea
              value={announcementBody}
              onChange={(event) => setAnnouncementBody(event.target.value)}
              rows={4}
              placeholder="Write the update members should see..."
              className="w-full resize-none rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none focus:border-amber-300"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={pinAnnouncement}
                  onChange={(event) => setPinAnnouncement(event.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                Feature this announcement
              </label>
              <button
                type="button"
                onClick={handleCreateAnnouncement}
                disabled={creatingAnnouncement || !announcementBody.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50"
              >
                {creatingAnnouncement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {creatingAnnouncement ? 'Posting...' : 'Post announcement'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Featured post" />
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          {pinnedPost ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Pin className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-900 line-clamp-2">{postSnippet(pinnedPost)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fmtRelative(pinnedPost.created_at)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex-1 h-9 rounded-xl border border-slate-200 bg-white text-[13px] font-black text-slate-700 hover:bg-slate-50"
                >
                  Change pin
                </button>
                <button
                  type="button"
                  onClick={handleUnpin}
                  disabled={pinning}
                  className="h-9 px-4 rounded-xl bg-slate-100 text-[13px] font-black text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  Unpin
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Pin className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-[13px] font-bold text-slate-500">No post pinned</p>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="h-9 px-5 rounded-xl bg-blue-600 text-white text-[13px] font-black"
              >
                Pin a post
              </button>
            </div>
          )}
        </div>
      </div>

      {pickerOpen && (
        <div className="space-y-3">
          <SectionHeader
            title="Select a post to pin"
            action={
              <button type="button" onClick={() => setPickerOpen(false)} className="text-[12px] font-bold text-slate-500 hover:text-slate-700">
                Cancel
              </button>
            }
          />
          {recentPosts.length === 0 ? (
            <EmptyState icon={Pin} title="No posts yet" body="Post something in the community first." />
          ) : (
            <div className="space-y-2">
              {recentPosts.map(post => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handlePin(post.id)}
                  disabled={pinning}
                  className="w-full text-left rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 hover:border-blue-300 transition-colors disabled:opacity-50"
                >
                  <p className="text-[13px] font-semibold text-slate-800 line-clamp-2">{postSnippet(post)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fmtRelative(post.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Featured posts appear in the community welcome area for all members. Use this for one important announcement, post, event reminder, or start-here update.
        </p>
      </div>
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({ communityId, community, currentUser }) {
  const queryClient = useQueryClient();
  const [search, setSearch]               = useState('');
  const [removingMember, setRemoving]     = useState(null);
  const [roleMenuOpen, setRoleMenuOpen]   = useState(null);
  const [showInviteModal, setShowInvite]  = useState(false);
  // contact title inline edit: memberId → draft title string (null = not editing)
  const [editingTitle, setEditingTitle]   = useState(null);
  const [titleDraft, setTitleDraft]       = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['admin-members', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('community_memberships')
        .select('id, user_id, role, status, user_name, joined_at, created_at, contact_title, contact_order, profile:user_id(id, display_name, avatar_url)')
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

  const contactTitleMutation = useMutation({
    mutationFn: async ({ userId, title }) => {
      const { error } = await supabase.rpc('set_member_contact_title', {
        p_community_id: communityId,
        p_user_id: userId,
        p_title: title || null,
        p_order: 0,
      });
      if (error) throw error;
    },
    onSuccess: (_, { title }) => {
      toast.success(title ? `Contact title set to "${title}"` : 'Contact title removed');
      queryClient.invalidateQueries({ queryKey: ['admin-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      setEditingTitle(null);
    },
    onError: (err) => toast.error(err.message || 'Could not save contact title'),
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
      {/* Invite button */}
      <button
        type="button"
        onClick={() => setShowInvite(true)}
        className="flex w-full items-center justify-center gap-2 h-10 rounded-2xl bg-slate-950 text-white font-bold text-[13px] active:scale-95 transition-all hover:bg-slate-800"
      >
        <UserPlus className="h-4 w-4" />
        Invite Members
      </button>

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

            const isEditingTitle = editingTitle === m.id;

            return (
              <div key={m.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3">
                  <Avatar name={name} size={38} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-bold text-slate-900 truncate">{name}</p>
                      {owner && <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                      {self && <span className="text-[11px] text-slate-400">(you)</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <RoleBadge role={role} />
                      {m.contact_title && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-800">
                          <Tag className="h-2.5 w-2.5" />
                          {m.contact_title}
                        </span>
                      )}
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
                            onClick={() => {
                              setRoleMenuOpen(null);
                              setEditingTitle(m.id);
                              setTitleDraft(m.contact_title ?? '');
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Tag className="h-4 w-4 text-slate-400" />
                            {m.contact_title ? 'Edit contact title' : 'Set contact title'}
                          </button>
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

                {/* Inline contact title editor */}
                {isEditingTitle && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                      Contact title (e.g. Rabbi, President, Volunteer Coordinator)
                    </p>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') contactTitleMutation.mutate({ userId: m.user_id, title: titleDraft.trim() });
                          if (e.key === 'Escape') setEditingTitle(null);
                        }}
                        placeholder="Enter title or leave blank to clear"
                        maxLength={60}
                        className="flex-1 h-9 rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        disabled={contactTitleMutation.isPending}
                        onClick={() => contactTitleMutation.mutate({ userId: m.user_id, title: titleDraft.trim() })}
                        className="h-9 px-3 rounded-xl bg-slate-950 text-white text-[12px] font-bold disabled:opacity-50"
                      >
                        {contactTitleMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTitle(null)}
                        className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {m.contact_title && (
                      <button
                        type="button"
                        onClick={() => contactTitleMutation.mutate({ userId: m.user_id, title: '' })}
                        className="mt-2 text-[11px] font-semibold text-red-600 hover:underline"
                      >
                        Remove title
                      </button>
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

      <CommunityInviteModal
        open={showInviteModal}
        onClose={() => setShowInvite(false)}
        community={community}
        currentUser={currentUser}
      />
    </div>
  );
}

// ─── Moderation tab ───────────────────────────────────────────────────────────

const REPORT_REASON_LABELS = {
  spam:          'Spam or scam',
  harassment:    'Harassment',
  hate_speech:   'Hate speech',
  misinformation:'Misinformation',
  inappropriate: 'Inappropriate content',
  violence:      'Violence or threats',
  other:         'Other',
};

const CONTENT_TYPE_LABELS = {
  post:    'Post',
  comment: 'Comment',
  user:    'User',
  request: 'Request',
};

function ModerationTab({ communityId }) {
  const [section, setSection] = useState('removals');

  const { data: removals = [], isLoading: removalsLoading } = useQuery({
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

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-community-reports', communityId],
    queryFn: async () => {
      const { data } = await supabase.from('reports')
        .select('id, content_type, content_preview, reason, details, resolved, created_at, target_user_name, reporter:reporter_id(display_name)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const isLoading = removalsLoading || reportsLoading;

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

  const openReports = reports.filter(r => !r.resolved);
  const resolvedReports = reports.filter(r => r.resolved);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      {/* Section toggle */}
      <div className="flex gap-2">
        {[
          { key: 'removals', label: `Removals (${removals.length})` },
          { key: 'reports',  label: `Content Reports (${openReports.length} open)` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
              section === key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Removals ── */}
      {section === 'removals' && (
        <>
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
        </>
      )}

      {/* ── Content Reports ── */}
      {section === 'reports' && (
        <>
          <SectionHeader title={`${openReports.length} open · ${resolvedReports.length} resolved`} />
          {reports.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No reports" body="Content reported in this community will appear here." />
          ) : (
            <div className="space-y-2">
              {reports.map(rpt => (
                <div key={rpt.id} className={`rounded-2xl bg-white border px-4 py-3.5 shadow-sm ${rpt.resolved ? 'border-slate-100 opacity-60' : 'border-amber-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          {CONTENT_TYPE_LABELS[rpt.content_type] || rpt.content_type}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {REPORT_REASON_LABELS[rpt.reason] || rpt.reason}
                        </span>
                        {rpt.resolved && (
                          <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Resolved</span>
                        )}
                      </div>
                      {rpt.content_preview && (
                        <p className="text-[12px] text-slate-700 italic mb-1 line-clamp-2">"{rpt.content_preview}"</p>
                      )}
                      {rpt.target_user_name && (
                        <p className="text-[12px] text-slate-500">Reported user: <span className="font-semibold">{rpt.target_user_name}</span></p>
                      )}
                      {rpt.details && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{rpt.details}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Reported by {rpt.reporter?.display_name || 'member'} · {fmtRelative(rpt.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mt-2">
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Report resolution is handled by platform admins. Community admins can view reports filed against content in this community.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Automated local updates tab ─────────────────────────────────────────────

function LocalUpdatesTab({ communityId }) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState({});

  const { data: sources = [], isLoading: sourcesLoading, error: sourcesError } = useQuery({
    queryKey: ['local-update-sources', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_update_sources')
        .select('id, name, source_type, source_url, category, enabled, requires_review, auto_publish, last_checked_at')
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(communityId),
  });

  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ['local-update-items', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_update_items')
        .select(`
          id,
          source_id,
          community_id,
          title,
          short_description,
          category,
          source_url,
          source_name,
          source_published_at,
          status,
          created_at,
          approved_at,
          rejected_at,
          published_post_id,
          source:source_id(name, source_type)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(communityId),
  });

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      items.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = {
            title: item.title || '',
            short_description: item.short_description || '',
            category: item.category || '',
          };
        }
      });
      return next;
    });
  }, [items]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['local-update-items', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-hub-posts', communityId] });
  };

  const updateDraft = (itemId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] || {}),
        [field]: value,
      },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async ({ item }) => {
      const draft = drafts[item.id] || {};
      const { data, error } = await supabase.rpc('update_local_update_item', {
        p_item_id: item.id,
        p_title: draft.title || item.title,
        p_short_description: draft.short_description || '',
        p_category: draft.category || '',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Queue item updated');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Could not update queue item'),
  });

  const publishMutation = useMutation({
    mutationFn: async ({ item }) => {
      const draft = drafts[item.id] || {};
      const { data, error } = await supabase.rpc('publish_local_update_item', {
        p_item_id: item.id,
        p_title: draft.title || item.title,
        p_short_description: draft.short_description || item.short_description || '',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Published as a community post');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Could not publish update'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ item }) => {
      const { data, error } = await supabase.rpc('reject_local_update_item', {
        p_item_id: item.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Update rejected');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Could not reject update'),
  });

  const isLoading = sourcesLoading || itemsLoading;
  const error = sourcesError || itemsError;
  const pendingItems = items.filter((item) => item.status === 'pending');
  const reviewedItems = items.filter((item) => item.status !== 'pending').slice(0, 8);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-900">Automated updates are not ready yet.</p>
          <p className="mt-1 text-[13px] font-semibold leading-5 text-amber-800">
            {error.message || 'The local updates tables or permissions are not available.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-blue-950">Automated Updates Queue</p>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-blue-800">
              Official public sources land here first. Review, edit, then publish only what belongs in the community.
            </p>
          </div>
        </div>
      </div>

      <section>
        <SectionHeader title={`Sources (${sources.length})`} />
        {sources.length === 0 ? (
          <EmptyState icon={AlertCircle} title="No sources configured" body="A platform admin needs to seed official sources for this community." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {sources.map((source) => (
              <div key={source.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-slate-900">{source.name}</p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {source.source_type} · {source.category || 'Local Update'}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${source.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {source.enabled ? 'On' : 'Off'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">
                  Last checked: {source.last_checked_at ? fmtRelative(source.last_checked_at) : 'Not yet'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={`Pending review (${pendingItems.length})`} />
        {pendingItems.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No pending updates" body="New official updates will appear here after the next ingestion run." />
        ) : (
          <div className="space-y-3">
            {pendingItems.map((item) => {
              const draft = drafts[item.id] || {};
              const busy = saveMutation.isPending || publishMutation.isPending || rejectMutation.isPending;
              return (
                <article key={item.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                      {item.category || 'Local Update'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                      {item.source_name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {fmtRelative(item.source_published_at || item.created_at)}
                    </span>
                  </div>

                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Post title</span>
                    <input
                      value={draft.title ?? item.title}
                      onChange={(event) => updateDraft(item.id, 'title', event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-blue-300 focus:bg-white"
                    />
                  </label>

                  <label className="mt-3 block">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Summary / post body</span>
                    <textarea
                      rows={4}
                      value={draft.short_description ?? item.short_description ?? ''}
                      onChange={(event) => updateDraft(item.id, 'short_description', event.target.value)}
                      className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold leading-6 text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-black text-blue-700 hover:text-blue-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Read source
                    </a>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => saveMutation.mutate({ item })}
                        className="motion-press inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700 disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => rejectMutation.mutate({ item })}
                        className="motion-press inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 text-[12px] font-black text-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy || !String(draft.title ?? item.title).trim()}
                        onClick={() => publishMutation.mutate({ item })}
                        className="motion-press inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-[12px] font-black text-white disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve & Publish
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {reviewedItems.length > 0 && (
        <section>
          <SectionHeader title="Recently reviewed" />
          <div className="space-y-2">
            {reviewedItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      {item.source_name} · {fmtRelative(item.approved_at || item.rejected_at || item.created_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                    item.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
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

// ─── Layout tab ───────────────────────────────────────────────────────────────

const LAYOUT_PRESETS = [
  {
    key: 'balanced',
    label: 'Balanced',
    desc: 'Default for your type. Equal blend of feed and features.',
    icon: '⚖️',
    settings: {},
  },
  {
    key: 'social',
    label: 'Social-first',
    desc: 'Conversation and updates front and center.',
    icon: '💬',
    settings: { composerMode: 'message', homeSections: ['digest', 'importantNow', 'composer', 'personalization', 'feed', 'adminTools'] },
  },
  {
    key: 'announcements',
    label: 'Announcements-forward',
    desc: 'Critical updates and events lead the home.',
    icon: '📢',
    settings: { homeSections: ['importantNow', 'digest', 'personalization', 'adminTools', 'composer', 'feed'] },
  },
  {
    key: 'action',
    label: 'Action-first',
    desc: 'Needs, requests, and help front and center.',
    icon: '🤝',
    settings: { composerMode: 'chesed', homeSections: ['importantNow', 'personalization', 'composer', 'feed', 'digest', 'adminTools'] },
  },
];

const DEFAULT_SECTION_ORDER = ['digest', 'importantNow', 'adminTools', 'personalization', 'composer', 'feed'];
const REQUIRED_SECTIONS = new Set(['composer', 'feed']);

const HOME_SECTION_LABELS = {
  digest: 'Since Last Visit digest',
  importantNow: 'Important Right Now strip',
  adminTools: 'Admin quick tools',
  personalization: 'For You module',
  composer: 'Post composer',
  feed: 'Community feed',
};

const COMPOSER_MODES = [
  { key: 'message', label: 'Conversational', desc: 'Simple message-style post' },
  { key: 'post', label: 'Standard post', desc: 'Post with optional title' },
  { key: 'official', label: 'Official update', desc: 'Admin-only announcement style' },
  { key: 'chesed', label: 'Help requests', desc: 'Request / Offer help buttons' },
];

function LayoutTab({ community, communityId, onCommunityUpdated }) {
  const isPremium = isCommunityPremium(community);
  const typeConfig = getCommunityTypeConfig(community || {});

  const existingLayout = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.layout || {})
    : {};

  const [localLayout, setLocalLayout] = useState(() => ({
    preset: existingLayout.preset || 'balanced',
    primaryTabs: existingLayout.primaryTabs || null,
    homeSections: existingLayout.homeSections?.length ? existingLayout.homeSections : [...DEFAULT_SECTION_ORDER],
    hiddenSections: existingLayout.hiddenSections || [],
    composerMode: existingLayout.composerMode || null,
  }));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (patch) => {
    setLocalLayout((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const applyPreset = (presetKey) => {
    const preset = LAYOUT_PRESETS.find((p) => p.key === presetKey) || LAYOUT_PRESETS[0];
    const ps = preset.settings || {};
    update({
      preset: presetKey,
      homeSections: ps.homeSections ? [...ps.homeSections] : [...DEFAULT_SECTION_ORDER],
      composerMode: ps.composerMode || null,
      primaryTabs: null,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newSettings = { ...(community?.settings || {}), layout: localLayout };
      const { data, error } = await supabase
        .from('communities')
        .update({ settings: newSettings })
        .eq('id', communityId)
        .select()
        .single();
      if (error) throw error;
      onCommunityUpdated?.(data);
      setDirty(false);
      toast.success('Layout saved');
    } catch {
      toast.error('Could not save layout');
    } finally {
      setSaving(false);
    }
  };

  const currentPrimaryTabs = localLayout.primaryTabs || typeConfig.primaryTabs || ['home', 'posts', 'members', 'about'];
  const hiddenSet = new Set(localLayout.hiddenSections);

  const moveSectionUp = (i) => {
    if (i === 0) return;
    const s = [...localLayout.homeSections];
    [s[i - 1], s[i]] = [s[i], s[i - 1]];
    update({ homeSections: s });
  };

  const moveSectionDown = (i) => {
    if (i === localLayout.homeSections.length - 1) return;
    const s = [...localLayout.homeSections];
    [s[i], s[i + 1]] = [s[i + 1], s[i]];
    update({ homeSections: s });
  };

  const toggleSection = (key) => {
    if (REQUIRED_SECTIONS.has(key)) return;
    const hidden = new Set(localLayout.hiddenSections);
    if (hidden.has(key)) hidden.delete(key); else hidden.add(key);
    update({ hiddenSections: [...hidden] });
  };

  const movePrimaryTabUp = (i) => {
    if (i === 0) return;
    const t = [...currentPrimaryTabs];
    [t[i - 1], t[i]] = [t[i], t[i - 1]];
    update({ primaryTabs: t });
  };

  const movePrimaryTabDown = (i) => {
    if (i === currentPrimaryTabs.length - 1) return;
    const t = [...currentPrimaryTabs];
    [t[i], t[i + 1]] = [t[i + 1], t[i]];
    update({ primaryTabs: t });
  };

  const togglePrimaryTab = (tab) => {
    if (tab === 'home') return;
    const current = [...currentPrimaryTabs];
    if (current.includes(tab)) {
      if (current.length <= 2) return;
      update({ primaryTabs: current.filter((t) => t !== tab) });
    } else {
      if (current.length >= 5) return;
      update({ primaryTabs: [...current, tab] });
    }
  };

  const previewMoreTabs = currentPrimaryTabs.length < 5
    ? ['posts', 'events', 'resources', 'members', 'about', 'announcements']
        .filter((t) => !currentPrimaryTabs.includes(t))
        .slice(0, 2)
    : [];

  return (
    <div className="pb-28">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-[17px] font-black text-slate-950">Community Layout</h2>
        <p className="text-[13px] font-semibold text-slate-500 mt-0.5 leading-5">
          Choose what members see first and how your community works.
        </p>
      </div>

      {/* Preset selector */}
      <section className="px-4 pb-5">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">Layout preset</p>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset.key)}
              className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                localLayout.preset === preset.key
                  ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-xl mb-1.5">{preset.icon}</div>
              <p className="text-[13px] font-black text-slate-900 leading-tight">{preset.label}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-4">{preset.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Primary navigation */}
      <section className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 flex-1">Primary navigation</p>
          {!isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              <Crown className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>
        {isPremium ? (
          <div className="space-y-1.5">
            {currentPrimaryTabs.map((tab, i) => (
              <div key={tab} className="flex items-center gap-2 rounded-xl bg-white border border-slate-100 px-3 py-2">
                <span className="flex-1 text-[13px] font-semibold text-slate-800">{getCommunityTabLabel(tab)}</span>
                {tab !== 'home' && (
                  <button type="button" onClick={() => togglePrimaryTab(tab)} className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex-shrink-0">
                    Remove
                  </button>
                )}
                <div className="flex gap-0.5 flex-shrink-0">
                  <button type="button" onClick={() => movePrimaryTabUp(i)} disabled={i === 0} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 disabled:opacity-30 hover:text-slate-700">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => movePrimaryTabDown(i)} disabled={i === currentPrimaryTabs.length - 1} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 disabled:opacity-30 hover:text-slate-700">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {currentPrimaryTabs.length < 5 && (
              <div className="mt-2 pt-1">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Add tab (max 5 primary)</p>
                <div className="flex flex-wrap gap-1.5">
                  {['posts', 'events', 'resources', 'members', 'about', 'announcements', 'questions', 'discussions', 'openNeeds', 'chat']
                    .filter((t) => !currentPrimaryTabs.includes(t))
                    .map((t) => (
                      <button key={t} type="button" onClick={() => togglePrimaryTab(t)}
                        className="h-7 px-2.5 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        + {getCommunityTabLabel(t)}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[13px] font-semibold text-slate-600 leading-5">
              Choose which tabs appear in primary navigation, in what order, and which overflow to More.
            </p>
            <p className="text-[12px] font-bold text-blue-600 mt-2">Upgrade to customize navigation →</p>
          </div>
        )}
      </section>

      {/* Home sections */}
      <section className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 flex-1">Home sections</p>
          {!isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              <Crown className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>
        {isPremium ? (
          <div className="space-y-1.5">
            {localLayout.homeSections.map((key, i) => {
              const isHidden = hiddenSet.has(key);
              const isRequired = REQUIRED_SECTIONS.has(key);
              return (
                <div key={key} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-opacity ${isHidden ? 'opacity-50 bg-slate-50 border-slate-100' : 'bg-white border-slate-100'}`}>
                  <button type="button" onClick={() => toggleSection(key)} disabled={isRequired} className="flex-shrink-0 disabled:opacity-40">
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${!isHidden ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}`}>
                      {!isHidden && <span className="text-white text-[8px] font-black leading-none">✓</span>}
                    </div>
                  </button>
                  <span className="flex-1 text-[12px] font-semibold text-slate-800">
                    {HOME_SECTION_LABELS[key] || key}
                    {isRequired && <span className="ml-1 text-[10px] text-slate-400">(required)</span>}
                  </span>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button type="button" onClick={() => moveSectionUp(i)} disabled={i === 0} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 disabled:opacity-30 hover:text-slate-700">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveSectionDown(i)} disabled={i === localLayout.homeSections.length - 1} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 disabled:opacity-30 hover:text-slate-700">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[13px] font-semibold text-slate-600 leading-5">
              Show, hide, and reorder the modules on your community home: digest, highlights, For You, composer, and feed.
            </p>
            <p className="text-[12px] font-bold text-blue-600 mt-2">Upgrade to customize home sections →</p>
          </div>
        )}
      </section>

      {/* Composer style */}
      <section className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 flex-1">Composer style</p>
          {!isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              <Crown className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>
        {isPremium ? (
          <div className="grid grid-cols-2 gap-2">
            {COMPOSER_MODES.map((mode) => {
              const isActive = (localLayout.composerMode || typeConfig.composerMode || 'message') === mode.key;
              return (
                <button key={mode.key} type="button" onClick={() => update({ composerMode: mode.key })}
                  className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${isActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <p className="text-[13px] font-black text-slate-900">{mode.label}</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-4">{mode.desc}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[13px] font-semibold text-slate-600 leading-5">
              Switch the composer between conversational, standard post, official-only, or chesed help-request mode.
            </p>
            <p className="text-[12px] font-bold text-blue-600 mt-2">Upgrade to customize the composer →</p>
          </div>
        )}
      </section>

      {/* Live preview */}
      <section className="border-t border-slate-100 px-4 py-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">Preview</p>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-2">Primary nav</p>
            <div className="flex flex-wrap gap-1.5">
              {currentPrimaryTabs.map((tab) => (
                <span key={tab} className="h-7 px-3 rounded-lg bg-blue-50 text-[12px] font-bold text-blue-700 flex items-center">
                  {getCommunityTabLabel(tab)}
                </span>
              ))}
              {previewMoreTabs.map((tab) => (
                <span key={tab} className="h-7 px-3 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-500 flex items-center">
                  {getCommunityTabLabel(tab)}
                </span>
              ))}
              <span className="h-7 px-3 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-400 flex items-center">More ···</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-2">Home stack</p>
            <div className="space-y-1">
              {localLayout.homeSections.filter((s) => !hiddenSet.has(s)).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 w-4 text-right">{i + 1}</span>
                  <span className="h-6 flex-1 px-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-600 flex items-center">
                    {HOME_SECTION_LABELS[s] || s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-100 bg-white px-4 py-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="w-full h-12 rounded-2xl bg-[#2563EB] text-white font-black text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : dirty ? 'Save Layout' : 'Layout Saved'}
        </button>
      </div>
    </div>
  );
}

// ─── Branding constants ───────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { key: 'blue',    value: '#2563EB', label: 'Blue' },
  { key: 'violet',  value: '#7C3AED', label: 'Violet' },
  { key: 'emerald', value: '#059669', label: 'Emerald' },
  { key: 'rose',    value: '#E11D48', label: 'Rose' },
  { key: 'amber',   value: '#D97706', label: 'Amber' },
  { key: 'teal',    value: '#0D9488', label: 'Teal' },
  { key: 'indigo',  value: '#4F46E5', label: 'Indigo' },
  { key: 'slate',   value: '#475569', label: 'Slate' },
];

const COVER_STYLES = [
  { key: 'default',  label: 'Default',  gradient: null },
  { key: 'midnight', label: 'Midnight', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' },
  { key: 'sunrise',  label: 'Sunrise',  gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  { key: 'forest',   label: 'Forest',   gradient: 'linear-gradient(135deg, #065f46 0%, #34d399 100%)' },
  { key: 'twilight', label: 'Twilight', gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #db2777 100%)' },
];

// ─── Branding tab ─────────────────────────────────────────────────────────────

function BrandingTab({ community, communityId, onCommunityUpdated, onNavigateTo }) {
  const isPremium = isCommunityPremium(community);
  const typeConfig = getCommunityTypeConfig(community || {});
  const TypeIcon = typeConfig.icon;

  const existingBranding = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.branding || {})
    : {};

  const [localBranding, setLocalBranding] = useState(() => ({
    accentColor: existingBranding.accentColor || '',
    coverStyle: existingBranding.coverStyle || 'default',
  }));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (patch) => {
    setLocalBranding((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newSettings = { ...(community?.settings || {}), branding: localBranding };
      const { data, error } = await supabase
        .from('communities')
        .update({ settings: newSettings })
        .eq('id', communityId)
        .select()
        .single();
      if (error) throw error;
      onCommunityUpdated?.(data);
      setDirty(false);
      toast.success('Branding saved');
    } catch {
      toast.error('Could not save branding');
    } finally {
      setSaving(false);
    }
  };

  const previewCoverStyleObj = COVER_STYLES.find((s) => s.key === localBranding.coverStyle) || COVER_STYLES[0];
  const previewGradient = localBranding.accentColor
    ? `linear-gradient(135deg, ${localBranding.accentColor}CC 0%, ${localBranding.accentColor}88 100%)`
    : (previewCoverStyleObj.gradient || typeConfig.coverPattern);

  return (
    <div className="pb-28">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-[17px] font-black text-slate-950">Community Branding</h2>
        <p className="text-[13px] font-semibold text-slate-500 mt-0.5 leading-5">
          Customise how your community looks across JUnited.
        </p>
        {!isPremium && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-3 py-2.5">
            <Crown className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] font-bold text-amber-800 leading-5">
              Branding customisation requires Community Premium. Preview changes below, then upgrade to save.
            </p>
          </div>
        )}
      </div>

      {/* Live preview */}
      <section className="px-4 pb-5">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">Preview</p>
        <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm">
          <div className="relative h-[56px]" style={{ background: previewGradient }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute bottom-2 left-2.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black backdrop-blur-sm ${typeConfig.badgeClass} bg-white/80`}>
                <TypeIcon className="h-2.5 w-2.5" />
                {typeConfig.label}
              </span>
            </div>
          </div>
          <div className="px-3 py-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-black text-slate-950 truncate">{community?.name || 'Your Community'}</p>
              <p className="text-[11px] font-semibold text-slate-400">Preview of Discover card</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
              style={{ background: localBranding.accentColor || '#2563EB' }}
            >
              Join
            </button>
          </div>
        </div>
      </section>

      {/* Accent colour palette */}
      <section className="px-4 pb-5">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">Accent colour</p>
        <div className="flex flex-wrap gap-2.5 mb-2">
          <button
            type="button"
            onClick={() => update({ accentColor: '' })}
            title="Default (type colour)"
            className={`h-9 w-9 rounded-full border-2 transition-all flex items-center justify-center ${
              !localBranding.accentColor ? 'border-slate-950 scale-110' : 'border-slate-200 hover:border-slate-400'
            }`}
            style={{ background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' }}
          >
            {!localBranding.accentColor && <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
          </button>
          {ACCENT_COLORS.map(({ key, value, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ accentColor: value })}
              title={label}
              className={`h-9 w-9 rounded-full border-2 transition-all ${
                localBranding.accentColor === value ? 'border-slate-950 scale-110' : 'border-transparent hover:scale-105'
              }`}
              style={{ background: value }}
            />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-slate-400">
          Drives the cover gradient and join button colour. Select default to use your community type's colour.
        </p>
      </section>

      {/* Cover style */}
      <section className="px-4 pb-5">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1">Cover style</p>
        <p className="text-[11px] font-semibold text-slate-400 mb-3">
          Applied when no cover photo is set. Overridden by an accent colour above.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {COVER_STYLES.map((style) => (
            <button
              key={style.key}
              type="button"
              onClick={() => update({ coverStyle: style.key })}
              className={`overflow-hidden rounded-xl border-2 transition-all active:scale-[0.97] ${
                localBranding.coverStyle === style.key
                  ? 'border-slate-950 shadow-md'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="h-10 w-full" style={{ background: style.gradient || typeConfig.coverPattern }} />
              <p className="py-1 bg-white text-center text-[10px] font-black text-slate-600">{style.label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Save / upgrade footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {isPremium ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="w-full h-12 rounded-2xl bg-[#2563EB] text-white font-black text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : dirty ? 'Save Branding' : 'Branding Saved'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigateTo?.('billing')}
            className="w-full h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Community Premium
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Settings tab (sub-nav: Profile | Appearance | Modules | Permissions) ─────

function SettingsTab({ communityId, community, currentUser, onCommunityUpdated, onClose, onDeleted }) {
  const [section, setSection] = useState('profile');
  const settings = useMemo(
    () => (community?.settings && typeof community.settings === 'object' ? community.settings : {}),
    [community?.settings]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {SETTINGS_SECTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${
              section === key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'profile' && (
        <ProfileSection
          communityId={communityId}
          community={community}
          settings={settings}
          onCommunityUpdated={onCommunityUpdated}
          onClose={onClose}
          currentUser={currentUser}
          onDeleted={onDeleted}
        />
      )}
      {section === 'appearance' && (
        <AppearanceSection
          communityId={communityId}
          community={community}
          onCommunityUpdated={onCommunityUpdated}
        />
      )}
      {section === 'modules' && (
        <ModulesSection
          communityId={communityId}
          community={community}
          onCommunityUpdated={onCommunityUpdated}
        />
      )}
      {section === 'permissions' && (
        <PermissionsSection
          communityId={communityId}
          community={community}
          onCommunityUpdated={onCommunityUpdated}
        />
      )}
    </div>
  );
}

function ProfileSection({ communityId, community, settings, onCommunityUpdated, onClose, currentUser, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name:        community?.name || '',
    description: community?.description || community?.description_short || '',
    location:    community?.location || community?.neighborhood || '',
    category:    community?.category || COMMUNITY_TYPE_OPTIONS[0]?.label || 'Community',
    privacy:     community?.privacy || 'Public',
    welcomeMessage: settings.welcome_message || community?.welcome_message || '',
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
        settings:    { ...settings, rules, welcome_message: form.welcomeMessage.trim() || null },
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
    <div className="space-y-4">
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

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-black text-slate-700">Welcome message</span>
        <textarea
          value={form.welcomeMessage}
          onChange={e => setField('welcomeMessage', e.target.value)}
          rows={3}
          placeholder="A short welcome note that appears at the top of your community home."
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
        />
      </label>

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

      <DangerZone
        communityId={communityId}
        community={community}
        currentUser={currentUser}
        onDeleted={onDeleted}
      />
    </div>
  );
}

function AppearanceSection({ communityId, community, onCommunityUpdated }) {
  const [coverFile, setCoverFile]     = useState(null);
  const [coverPreview, setCoverPreview] = useState(community?.cover_url || null);
  const [logoFile, setLogoFile]       = useState(null);
  const [logoPreview, setLogoPreview] = useState(community?.logo_url || null);
  const [saving, setSaving]           = useState(false);

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!coverFile && !logoFile) { toast.info('No changes to save'); return; }
    setSaving(true);
    try {
      const updates = {};
      if (coverFile) {
        const result = await dataService.integrations.Core.UploadFile({ file: coverFile, bucket: 'community-images' });
        updates.cover_url = typeof result === 'string' ? result : (result?.url || result?.publicUrl);
      }
      if (logoFile) {
        const result = await dataService.integrations.Core.UploadFile({ file: logoFile, bucket: 'community-images' });
        updates.logo_url = typeof result === 'string' ? result : (result?.url || result?.publicUrl);
      }
      const updated = await dataService.entities.Community.update(communityId, updates);
      toast.success('Appearance updated');
      onCommunityUpdated?.(updated);
      setCoverFile(null);
      setLogoFile(null);
    } catch (err) {
      toast.error(err?.message || 'Could not update appearance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Cover photo" />
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-800 relative" style={{ aspectRatio: '3/1' }}>
          {coverPreview && (
            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
          )}
          <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-colors group">
            <div className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Image className="h-5 w-5 text-slate-700" />
            </div>
            <input type="file" accept="image/*" className="sr-only" onChange={handleCoverChange} />
          </label>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">Recommended: 1200×400px. Click to change.</p>
      </div>

      <div>
        <SectionHeader title="Community logo" />
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden flex-shrink-0 relative">
            {logoPreview && (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            )}
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors group">
              <Upload className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <input type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} />
            </label>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-700">Community logo</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Square image, min 200×200px.<br />Click to upload.</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || (!coverFile && !logoFile)}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save appearance'}
      </button>
    </div>
  );
}

function ModulesSection({ communityId, community, onCommunityUpdated }) {
  const premiumActive = isCommunityPremium(community);
  const [flags, setFlags] = useState({
    allow_member_events:   Boolean(community?.allow_member_events),
    allow_resources:       Boolean(community?.allow_resources),
    allow_forms:           Boolean(community?.allow_forms),
    allow_member_listings: Boolean(community?.allow_member_listings),
    allow_group_chat:      Boolean(community?.allow_group_chat),
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    const moduleConfig = MODULE_CONFIG.find((module) => module.key === key);
    if (moduleConfig?.premium && !premiumActive && !flags[key]) {
      toast.info('Upgrade to Premium to enable this module.');
      return;
    }
    setFlags(f => ({ ...f, [key]: !f[key] }));
  };

  const handleSave = async () => {
    if (!premiumActive && MODULE_CONFIG.some(({ key, premium }) => premium && flags[key])) {
      toast.info('Premium modules need an active community plan.');
      return;
    }
    setSaving(true);
    try {
      const updated = await dataService.entities.Community.update(communityId, flags);
      toast.success('Modules updated');
      onCommunityUpdated?.(updated);
    } catch (err) {
      toast.error(err?.message || 'Could not update modules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!premiumActive && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-[13px] font-black text-blue-900">Free includes limited events and resources</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-5 text-blue-700">
            Free communities can run up to 3 upcoming events and share up to 10 resources. Marketplace and group chat unlock after upgrading in Billing.
          </p>
        </div>
      )}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[14px] font-bold text-slate-900">Posts</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Community discussion feed — always enabled</p>
          </div>
          <div className="w-11 h-6 rounded-full bg-blue-600 flex items-center justify-end px-0.5 flex-shrink-0 opacity-50 cursor-not-allowed">
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </div>
        </div>
        {MODULE_CONFIG.map(({ key, label, description, premium }, idx) => {
          const locked = premium && !premiumActive;
          return (
          <div
            key={key}
            className={`px-4 py-3.5 flex items-center justify-between ${idx < MODULE_CONFIG.length - 1 ? 'border-b border-slate-100' : ''} ${locked ? 'bg-slate-50/70' : ''}`}
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="flex items-center gap-1.5 text-[14px] font-bold text-slate-900">
                {label}
                {premium && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700">
                    Premium
                  </span>
                )}
              </p>
              <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={locked && !flags[key]}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                flags[key] ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
              }`}
              aria-checked={flags[key]}
              role="switch"
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save modules'}
      </button>
    </div>
  );
}

function PermissionsSection({ communityId, community, onCommunityUpdated }) {
  const [postingMode, setPostingMode] = useState(community?.posting_mode || 'open');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await dataService.entities.Community.update(communityId, { posting_mode: postingMode });
      toast.success('Permissions updated');
      onCommunityUpdated?.(updated);
    } catch (err) {
      toast.error(err?.message || 'Could not update permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Who can post?" />
      <div className="space-y-2">
        {[
          {
            value: 'open',
            label: 'All members',
            description: 'Any member can create posts in this community',
            Icon: Globe,
          },
          {
            value: 'admin_only',
            label: 'Admins & mods only',
            description: 'Only admins and moderators can post — ideal for announcement-only communities',
            Icon: Lock,
          },
        ].map(({ value, label, description, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPostingMode(value)}
            className={`w-full text-left rounded-2xl border px-4 py-3.5 flex items-start gap-3 transition-colors ${
              postingMode === value
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              postingMode === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] font-bold ${postingMode === value ? 'text-blue-900' : 'text-slate-900'}`}>{label}</p>
              <p className={`text-[12px] mt-0.5 leading-relaxed ${postingMode === value ? 'text-blue-700' : 'text-slate-400'}`}>{description}</p>
            </div>
            <div className={`mt-1 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              postingMode === value ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
            }`}>
              {postingMode === value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save permissions'}
      </button>
    </div>
  );
}

// ─── Danger Zone (delete community) ──────────────────────────────────────────

function DangerZone({ communityId, community, currentUser, onDeleted }) {
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: pendingRequest = null } = useQuery({
    queryKey: ['deletion-request', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_deletion_requests')
        .select('id, initiated_by, status, total_admins, created_at, initiator:initiated_by(display_name)')
        .eq('community_id', communityId)
        .eq('status', 'pending')
        .maybeSingle();
      return data;
    },
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['community-admins-for-deletion', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_memberships')
        .select('user_id, role, profile:user_id(display_name, avatar_url)')
        .eq('community_id', communityId)
        .eq('status', 'active')
        .in('role', ['owner', 'admin']);
      return data ?? [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['deletion-request', communityId] });
    queryClient.invalidateQueries({ queryKey: ['community-admins-for-deletion', communityId] });
  };

  return (
    <div className="mt-8 pt-6 border-t border-red-100">
      <p className="text-[12px] font-black text-red-500 uppercase tracking-widest mb-3">Danger Zone</p>

      {pendingRequest ? (
        <DeletionVoteBanner
          request={pendingRequest}
          admins={admins}
          communityId={communityId}
          currentUser={currentUser}
          onDeleted={onDeleted}
          onCancelled={invalidate}
        />
      ) : (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-[13px] font-black text-red-800 mb-1">Delete this community</p>
          <p className="text-[12px] text-red-600 mb-3 leading-relaxed">
            Permanently removes all content, posts, and memberships.
            {admins.length > 1
              ? ` All ${admins.length} admins must vote to approve.`
              : ' This action cannot be undone.'}
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-[13px] font-black text-white hover:bg-red-700 active:scale-95 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Community
          </button>
        </div>
      )}

      {showDeleteModal && (
        <DeleteCommunityModal
          community={community}
          currentUser={currentUser}
          admins={admins}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={onDeleted}
          onVoteInitiated={() => {
            setShowDeleteModal(false);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

// ─── Delete community modal ───────────────────────────────────────────────────

function DeleteCommunityModal({ community, currentUser, admins, onClose, onDeleted, onVoteInitiated }) {
  const isMultiAdmin = admins.length > 1;
  const [step, setStep]               = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const handleConfirm = async () => {
    if (!isMultiAdmin && confirmText !== community.name) {
      toast.error('Community name does not match.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('initiate_community_deletion', {
        p_community_id: community.id,
      });
      if (error) throw error;

      if (data.status === 'deleted') {
        toast.success('Community permanently deleted.');
        onDeleted?.();
      } else if (data.status === 'pending') {
        // Notify other admins about the vote
        const otherAdmins = admins.filter(a => a.user_id !== currentUser.id);
        const initiatorName = currentUser.display_name || currentUser.full_name || currentUser.user_name || 'An admin';
        await Promise.allSettled(
          otherAdmins.map(a =>
            notificationsService.notifyDeletionVoteStarted({
              recipientId:   a.user_id,
              initiatorId:   currentUser.id,
              initiatorName,
              communityId:   community.id,
              communityName: community.name,
              requestId:     data.request_id,
            })
          )
        );
        toast.success(`Deletion vote started. All ${data.total_admins} admins must approve.`);
        onVoteInitiated?.();
      }
    } catch (err) {
      toast.error(err.message || 'Could not initiate deletion');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end bg-slate-950/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:max-w-md sm:rounded-[28px]">
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
              Delete Community
            </p>
            <h2 className="mt-2 text-[18px] font-black text-slate-950">
              {step === 1 ? `Delete "${community.name}"?` : isMultiAdmin ? 'Start deletion vote' : 'Confirm deletion'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {step === 1 ? (
            <>
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 space-y-2">
                <p className="text-[13px] font-black text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  This action is permanent and irreversible
                </p>
                <ul className="space-y-1.5 text-[12px] font-semibold text-red-700 pl-1">
                  <li>• All posts and content will be permanently deleted</li>
                  <li>• All members will immediately lose access</li>
                  <li>• Invite links and community URLs will stop working</li>
                  <li>• This cannot be undone by anyone, including support</li>
                </ul>
              </div>
              {isMultiAdmin && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                  <p className="text-[12px] font-semibold text-blue-700">
                    This community has <strong>{admins.length} admins</strong>. A deletion vote will
                    be started — the community is only deleted once <strong>every admin approves</strong>.
                    Any admin can cancel the vote at any time.
                  </p>
                </div>
              )}
            </>
          ) : isMultiAdmin ? (
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-slate-600">
                The following admins will each need to approve before deletion proceeds:
              </p>
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                {admins.map((a, i) => (
                  <div
                    key={a.user_id}
                    className={`flex items-center gap-3 px-4 py-3 ${i < admins.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <Avatar name={a.profile?.display_name || 'Admin'} size={30} />
                    <p className="flex-1 text-[13px] font-semibold text-slate-800">
                      {a.profile?.display_name || 'Admin'}
                    </p>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={a.role} />
                      {a.user_id === currentUser.id && (
                        <span className="text-[11px] text-slate-400">(you)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-slate-600">
                Type <strong className="text-slate-900">{community.name}</strong> to confirm:
              </p>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={community.name}
                autoFocus
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-red-400 focus:bg-white"
              />
              {confirmText.length > 0 && confirmText !== community.name && (
                <p className="text-[12px] text-red-500 font-semibold">Name does not match.</p>
              )}
            </div>
          )}
        </section>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 flex gap-2">
          {step === 1 ? (
            <>
              <button type="button" onClick={onClose}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600">
                Cancel
              </button>
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 h-11 rounded-2xl bg-red-600 text-sm font-black text-white hover:bg-red-700">
                I understand, continue
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setStep(1)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600">
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting || (!isMultiAdmin && confirmText !== community.name)}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white disabled:opacity-50 hover:bg-red-700"
              >
                {submitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
                {submitting
                  ? 'Processing…'
                  : isMultiAdmin
                  ? 'Start Deletion Vote'
                  : 'Permanently Delete'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}

// ─── Deletion vote banner (shown inside DangerZone when a vote is pending) ────

function DeletionVoteBanner({ request, admins, currentUser, onDeleted, onCancelled }) {
  const queryClient = useQueryClient();
  const [voting, setVoting] = useState(false);

  const { data: votes = [] } = useQuery({
    queryKey: ['deletion-votes', request.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_deletion_votes')
        .select('admin_user_id, vote, voted_at')
        .eq('request_id', request.id);
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  const yesVotes      = votes.filter(v => v.vote === true);
  const myVote        = votes.find(v => v.admin_user_id === currentUser?.id);
  const iHaveVotedYes = myVote?.vote === true;
  const isInitiator   = request.initiated_by === currentUser?.id;
  const initiatorName = request.initiator?.display_name || 'An admin';
  const remaining     = request.total_admins - yesVotes.length;

  const handleVote = async (voteYes) => {
    setVoting(true);
    try {
      const { data, error } = await supabase.rpc('vote_on_community_deletion', {
        p_request_id: request.id,
        p_vote:       voteYes,
      });
      if (error) throw error;

      if (data.status === 'deleted') {
        toast.success('All admins approved. Community permanently deleted.');
        onDeleted?.();
      } else if (data.status === 'cancelled') {
        toast.success('Deletion vote cancelled.');
        onCancelled?.();
      } else {
        queryClient.invalidateQueries({ queryKey: ['deletion-votes', request.id] });
        toast.success(voteYes ? `Approved — waiting for ${remaining - 1} more.` : 'Vote recorded.');
      }
    } catch (err) {
      toast.error(err.message || 'Could not register vote');
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Trash2 className="h-4 w-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-red-800">Deletion vote in progress</p>
          <p className="text-[12px] text-red-600 mt-0.5">
            {isInitiator ? 'You initiated' : `${initiatorName} initiated`} a vote to permanently delete this community.
            {' '}<strong>{yesVotes.length} of {request.total_admins}</strong> admins have approved.
          </p>
        </div>
      </div>

      {/* Per-admin vote status */}
      {admins.length > 0 && (
        <div className="rounded-xl bg-white border border-red-100 overflow-hidden">
          {admins.map((a, i) => {
            const voted = votes.find(v => v.admin_user_id === a.user_id);
            const approvedByThisAdmin = voted?.vote === true;
            return (
              <div
                key={a.user_id}
                className={`flex items-center gap-3 px-3 py-2.5 ${i < admins.length - 1 ? 'border-b border-red-50' : ''}`}
              >
                <Avatar name={a.profile?.display_name || 'Admin'} size={26} />
                <p className="flex-1 text-[13px] font-semibold text-slate-700 truncate">
                  {a.profile?.display_name || 'Admin'}
                  {a.user_id === currentUser?.id && (
                    <span className="ml-1.5 text-[11px] text-slate-400">(you)</span>
                  )}
                </p>
                {approvedByThisAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Approved
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">Pending</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      {!iHaveVotedYes ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleVote(false)}
            disabled={voting}
            className="flex-1 h-9 rounded-xl border border-red-200 bg-white text-[13px] font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel Vote
          </button>
          <button
            type="button"
            onClick={() => handleVote(true)}
            disabled={voting}
            className="flex-1 h-9 rounded-xl bg-red-600 text-[13px] font-black text-white hover:bg-red-700 disabled:opacity-50"
          >
            {voting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
              : 'Approve Deletion'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleVote(false)}
            disabled={voting}
            className="h-9 rounded-xl border border-red-200 bg-white px-4 text-[13px] font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel Vote
          </button>
          <p className="flex-1 text-[12px] font-semibold text-slate-500 text-center">
            {remaining > 0
              ? `Waiting for ${remaining} more admin${remaining !== 1 ? 's' : ''}…`
              : 'All admins approved — deleting…'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Remove member modal ──────────────────────────────────────────────────────

function RemoveMemberModal({ member, community, currentUser, onClose, onRemoved }) {
  const isPublic    = isPublicCommunity(community);
  const reasons     = isPublic ? PUBLIC_REMOVAL_REASONS : PRIVATE_REMOVAL_REASONS;
  const [reasonCode, setReasonCode]   = useState('');
  const [reasonNote, setReasonNote]   = useState('');
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

// ─── Admin Forms tab ──────────────────────────────────────────────────────────

const FIELD_TYPES = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text',  label: 'Paragraph' },
  { value: 'select',     label: 'Dropdown' },
  { value: 'checkbox',   label: 'Checkbox (Yes/No)' },
  { value: 'date',       label: 'Date' },
  { value: 'phone',      label: 'Phone' },
  { value: 'email',      label: 'Email' },
  { value: 'number',     label: 'Number' },
];

const FORM_TYPES = [
  { value: 'general',   label: 'General form' },
  { value: 'signup',    label: 'Signup sheet' },
  { value: 'volunteer', label: 'Volunteer coordination' },
];

function newFieldDraft(order) {
  return { _id: crypto.randomUUID(), label: '', field_type: 'short_text', required: false, options: '', placeholder: '', field_order: order };
}

function CreateFormPanel({ communityId, currentUser, onCreated, onCancel }) {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [formType, setFormType] = useState('general');
  const [dueDate, setDueDate]   = useState('');
  const [maxSubs, setMaxSubs]   = useState('');
  const [allowMulti, setMulti]  = useState(false);
  const [fields, setFields]     = useState([newFieldDraft(0)]);
  const [saving, setSaving]     = useState(false);
  const [slots, setSlots]       = useState([]);

  const addField    = () => setFields((f) => [...f, newFieldDraft(f.length)]);
  const removeField = (idx) => setFields((f) => f.filter((_, i) => i !== idx));
  const updateField = (idx, patch) => setFields((f) => f.map((x, i) => i === idx ? { ...x, ...patch } : x));
  const addSlot    = () => setSlots((s) => [...s, { _id: crypto.randomUUID(), label: '', start_time: '', end_time: '', capacity: '1' }]);
  const removeSlot = (idx) => setSlots((s) => s.filter((_, i) => i !== idx));
  const updateSlot = (idx, patch) => setSlots((s) => s.map((x, i) => i === idx ? { ...x, ...patch } : x));

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Form title is required'); return; }
    if (fields.some((f) => !f.label.trim())) { toast.error('All field labels are required'); return; }
    setSaving(true);
    try {
      const { data: form, error: formErr } = await supabase
        .from('community_forms')
        .insert({
          community_id:    communityId,
          created_by:      currentUser.id,
          title:           title.trim(),
          description:     description.trim() || null,
          form_type:       formType,
          status:          'open',
          allow_multiple:  allowMulti,
          max_submissions: maxSubs ? parseInt(maxSubs, 10) : null,
          due_date:        dueDate || null,
        })
        .select('id')
        .single();
      if (formErr) throw formErr;
      if (fields.length) {
        const fieldRows = fields.map((f, i) => ({
          form_id:     form.id,
          label:       f.label.trim(),
          field_type:  f.field_type,
          required:    f.required,
          placeholder: f.placeholder.trim() || null,
          field_order: i,
          options: f.field_type === 'select'
            ? f.options.split(',').map((o) => o.trim()).filter(Boolean)
            : null,
        }));
        const { error: fieldErr } = await supabase.from('community_form_fields').insert(fieldRows);
        if (fieldErr) throw fieldErr;
      }
      if (formType === 'volunteer' && slots.length > 0) {
        const slotRows = slots
          .filter((s) => s.label.trim())
          .map((s) => ({
            form_id:    form.id,
            label:      s.label.trim(),
            start_time: s.start_time || null,
            end_time:   s.end_time || null,
            capacity:   Math.max(1, parseInt(s.capacity, 10) || 1),
          }));
        if (slotRows.length > 0) {
          const { error: slotErr } = await supabase.from('community_volunteer_slots').insert(slotRows);
          if (slotErr) throw slotErr;
        }
      }
      toast.success('Form created');
      onCreated?.();
    } catch (err) {
      toast.error(err.message || 'Could not create form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-black text-slate-900">New form</h2>
        <button type="button" onClick={onCancel} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
      </div>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm divide-y divide-slate-50">
        <div className="px-4 py-3">
          <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Shabbaton Signup" maxLength={100}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white" />
        </div>
        <div className="px-4 py-3">
          <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="What is this form for?"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white" />
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-50">
          <div className="px-4 py-3">
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Type</label>
            <select value={formType} onChange={(e) => setFormType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400">
              {FORM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="px-4 py-3">
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-50">
          <div className="px-4 py-3">
            <label className="block text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1.5">Max submissions</label>
            <input type="number" min="1" value={maxSubs} onChange={(e) => setMaxSubs(e.target.value)} placeholder="Unlimited"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400" />
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Allow re-submit</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Multiple per member</p>
            </div>
            <button type="button" onClick={() => setMulti((v) => !v)}>
              {allowMulti ? <ToggleRight className="h-6 w-6 text-blue-600" /> : <ToggleLeft className="h-6 w-6 text-slate-300" />}
            </button>
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-black text-slate-700">Fields</p>
          <button type="button" onClick={addField} className="flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700">
            <FilePlus className="h-3.5 w-3.5" /> Add field
          </button>
        </div>
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field._id} className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <input value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })}
                  placeholder={`Field ${idx + 1} label`} maxLength={80}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white" />
                {fields.length > 1 && (
                  <button type="button" onClick={() => removeField(idx)} className="shrink-0 text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={field.field_type} onChange={(e) => updateField(idx, { field_type: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:border-blue-400">
                  {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <label className="flex items-center gap-1 cursor-pointer select-none text-[12px] font-semibold text-slate-600">
                  <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, { required: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600" />
                  Required
                </label>
              </div>
              {field.field_type === 'select' && (
                <input value={field.options} onChange={(e) => updateField(idx, { options: e.target.value })}
                  placeholder="Option 1, Option 2, Option 3 (comma-separated)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold outline-none focus:border-blue-400 focus:bg-white" />
              )}
            </div>
          ))}
        </div>
      </div>
      {formType === 'volunteer' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-black text-slate-700">Volunteer Slots</p>
            <button type="button" onClick={addSlot} className="flex items-center gap-1 text-[12px] font-bold text-violet-600 hover:text-violet-700">
              <FilePlus className="h-3.5 w-3.5" /> Add slot
            </button>
          </div>
          {slots.length === 0 ? (
            <p className="text-[12px] font-semibold text-slate-400 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-center">
              No slots yet — add named shifts volunteers can claim.
            </p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, idx) => (
                <div key={slot._id} className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={slot.label}
                      onChange={(e) => updateSlot(idx, { label: e.target.value })}
                      placeholder={`Slot ${idx + 1} label (e.g. "Setup Crew 9am")`}
                      maxLength={80}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400 focus:bg-white"
                    />
                    <button type="button" onClick={() => removeSlot(idx)} className="shrink-0 text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Start</label>
                      <input
                        type="datetime-local"
                        value={slot.start_time}
                        onChange={(e) => updateSlot(idx, { start_time: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:border-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">End</label>
                      <input
                        type="datetime-local"
                        value={slot.end_time}
                        onChange={(e) => updateSlot(idx, { end_time: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:border-violet-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={slot.capacity}
                      onChange={(e) => updateSlot(idx, { capacity: e.target.value })}
                      className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:border-violet-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button type="button" onClick={handleCreate} disabled={saving}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-white font-bold text-[14px] disabled:opacity-60 active:scale-[0.98] transition-all">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
        {saving ? 'Creating…' : 'Create form'}
      </button>
    </div>
  );
}

function SubmissionsPanel({ form, fields, onBack, onFormUpdated }) {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin-form-submissions', form.id],
    queryFn: async () => {
      const { data } = await supabase.from('community_form_submissions').select('*').eq('form_id', form.id).order('submitted_at', { ascending: false });
      return data ?? [];
    },
  });

  const { data: slotSummary = { slots: [], claimsBySubmitter: {} } } = useQuery({
    queryKey: ['admin-form-slot-summary', form.id],
    queryFn: async () => {
      if (form.form_type !== 'volunteer') return { slots: [], claimsBySubmitter: {} };
      const { data: slotsData } = await supabase
        .from('community_volunteer_slots')
        .select('id, label, capacity, claimed_count')
        .eq('form_id', form.id)
        .order('created_at');
      const sl = slotsData ?? [];
      if (!sl.length) return { slots: sl, claimsBySubmitter: {} };
      const { data: claimsData } = await supabase
        .from('community_volunteer_claims')
        .select('slot_id, submitter_id')
        .in('slot_id', sl.map((s) => s.id));
      const slotLabelById = Object.fromEntries(sl.map((s) => [s.id, s.label]));
      const claimsBySubmitter = {};
      for (const c of (claimsData ?? [])) {
        if (!claimsBySubmitter[c.submitter_id]) claimsBySubmitter[c.submitter_id] = [];
        claimsBySubmitter[c.submitter_id].push(slotLabelById[c.slot_id] || c.slot_id);
      }
      return { slots: sl, claimsBySubmitter };
    },
    enabled: form.form_type === 'volunteer',
  });
  const { slots: formSlots, claimsBySubmitter } = slotSummary;

  const sortedFields = [...fields].sort((a, b) => (a.field_order ?? 0) - (b.field_order ?? 0));

  const toggleStatus = async () => {
    const next = form.status === 'open' ? 'closed' : 'open';
    const { error } = await supabase.from('community_forms').update({ status: next, updated_at: new Date().toISOString() }).eq('id', form.id);
    if (error) { toast.error(error.message); return; }
    toast.success(next === 'open' ? 'Form reopened' : 'Form closed');
    onFormUpdated?.();
  };

  const deleteForm = async () => {
    if (!window.confirm('Delete this form and all its submissions? This cannot be undone.')) return;
    const { error } = await supabase.from('community_forms').delete().eq('id', form.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Form deleted');
    onBack?.();
  };

  const exportCSV = () => {
    const hasSlots = form.form_type === 'volunteer' && formSlots.length > 0;
    const headers = ['Submitter', 'Date', ...sortedFields.map((f) => f.label), ...(hasSlots ? ['Claimed Slot(s)'] : [])];
    const rows = submissions.map((s) => [
      s.submitter_name || s.submitter_id,
      new Date(s.submitted_at).toLocaleDateString('en-US'),
      ...sortedFields.map((f) => {
        const val = s.answers?.[f.id];
        if (val === null || val === undefined) return '';
        return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val).replace(/,/g, ';');
      }),
      ...(hasSlots ? [(claimsBySubmitter[s.submitter_id] || []).join('; ') || 'None'] : []),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title.replace(/[^a-z0-9]/gi, '-')}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">← Back</button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <p className="text-[13px] font-black text-slate-900 truncate">{form.title}</p>
      </div>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-black text-slate-900 truncate">{form.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
              form.status === 'open' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
            }`}>{form.status}</span>
            <span className="text-[11px] text-slate-400">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {submissions.length > 0 && (
            <button type="button" onClick={exportCSV}
              className="flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-100 px-3 py-1.5 text-[12px] font-bold text-blue-700 hover:bg-blue-100">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          )}
          <button type="button" onClick={toggleStatus}
            className={`rounded-xl border px-3 py-1.5 text-[12px] font-bold ${
              form.status === 'open' ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
            }`}>{form.status === 'open' ? 'Close' : 'Reopen'}</button>
        </div>
      </div>
      {form.form_type === 'volunteer' && formSlots.length > 0 && (
        <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-violet-700">Slot Signups</p>
          {formSlots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-800">{slot.label}</span>
              <span className={`text-[12px] font-semibold ${slot.claimed_count >= slot.capacity ? 'text-red-500' : 'text-emerald-600'}`}>
                {slot.claimed_count} / {slot.capacity}
              </span>
            </div>
          ))}
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
      ) : submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
          <Eye className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-[13px] font-black text-slate-700">No submissions yet</p>
          <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Responses will appear here as members submit.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => {
            const submitterSlots = claimsBySubmitter[s.submitter_id] ?? [];
            return (
              <div key={s.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-black text-slate-900">{s.submitter_name || 'Member'}</p>
                  <p className="text-[11px] text-slate-400">{new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="space-y-1">
                  {submitterSlots.length > 0 && (
                    <div className="flex gap-2 text-[12px]">
                      <span className="font-black text-violet-500 shrink-0">Slot:</span>
                      <span className="font-semibold text-slate-800">{submitterSlots.join(', ')}</span>
                    </div>
                  )}
                  {sortedFields.map((field) => {
                    const val = s.answers?.[field.id];
                    if (val === null || val === undefined || val === '') return null;
                    return (
                      <div key={field.id} className="flex gap-2 text-[12px]">
                        <span className="font-black text-slate-500 shrink-0">{field.label}:</span>
                        <span className="font-semibold text-slate-800">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button type="button" onClick={deleteForm}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-red-500 hover:text-red-600 hover:underline">
        <Trash2 className="h-3.5 w-3.5" /> Delete this form
      </button>
    </div>
  );
}

function AdminFormsTab({ communityId, community, currentUser }) {
  const [view, setView] = useState(null);

  const { data: forms = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-forms', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_forms')
        .select('*, community_form_fields(*)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  if (!community?.allow_forms) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-slate-300 mb-3" />
        <p className="text-[15px] font-black text-slate-700">Forms & Signups is not enabled</p>
        <p className="mt-1 text-[13px] font-semibold text-slate-400 leading-5 max-w-xs mx-auto">
          Enable the Forms module in Settings → Modules to start creating forms.
        </p>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <CreateFormPanel
        communityId={communityId}
        currentUser={currentUser}
        onCreated={() => { refetch(); setView(null); }}
        onCancel={() => setView(null)}
      />
    );
  }

  if (view && view !== 'new') {
    return (
      <SubmissionsPanel
        form={view.form}
        fields={view.fields}
        onBack={() => setView(null)}
        onFormUpdated={() => { refetch(); setView(null); }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <button type="button" onClick={() => setView('new')}
        className="flex w-full items-center justify-center gap-2 h-10 rounded-2xl bg-slate-950 text-white font-bold text-[13px] active:scale-95 transition-all hover:bg-slate-800">
        <FilePlus className="h-4 w-4" /> New form
      </button>
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
      ) : forms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-[13px] font-black text-slate-700">No forms yet</p>
          <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Create your first signup sheet, survey, or volunteer form.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => {
            const fields = form.community_form_fields ?? [];
            return (
              <button key={form.id} type="button" onClick={() => setView({ form, fields })}
                className="w-full text-left rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 hover:bg-slate-50 active:scale-[0.99] transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-black text-slate-900 truncate">{form.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                        form.status === 'open' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
                      }`}>{form.status}</span>
                      <span className="text-[11px] text-slate-400">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
                      {form.due_date && (
                        <span className="text-[11px] text-slate-400">
                          Due {new Date(form.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Store Admin Tab ───────────────────────────────────────────────────────────

async function uploadListingImageAdmin(file) {
  const ext = file.name.split('.').pop();
  const path = `listing-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('community-images').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('community-images').getPublicUrl(path);
  return data.publicUrl;
}

const STORE_TYPE_CONFIG = {
  subscription: { label: 'Subscription', color: 'bg-violet-100 text-violet-700' },
  product:      { label: 'Product',      color: 'bg-blue-100 text-blue-700'   },
  service:      { label: 'Service',      color: 'bg-teal-100 text-teal-700'   },
};

function StoreListingForm({ communityId, currentUser, listing, onClose, onSaved }) {
  const [form, setForm] = useState({
    type:           listing?.type           || 'product',
    title:          listing?.title          || '',
    description:    listing?.description    || '',
    price:          listing?.price != null  ? String(listing.price) : '',
    billing_period: listing?.billing_period || 'one_time',
    perks:          listing?.perks?.join('\n') || '',
    image_url:      listing?.image_url      || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEdit = !!listing?.id;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadListingImageAdmin(file);
      setForm(f => ({ ...f, image_url: url }));
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = {
      community_id:   communityId,
      type:           form.type,
      title:          form.title.trim(),
      description:    form.description.trim(),
      price:          form.price ? parseFloat(form.price) : null,
      billing_period: form.billing_period,
      perks:          form.perks ? form.perks.split('\n').map(p => p.trim()).filter(Boolean) : [],
      image_url:      form.image_url || null,
      is_active:      true,
      seller_id:      currentUser?.id,
      seller_name:    currentUser?.full_name,
    };
    try {
      let saved;
      if (isEdit) {
        const { data, error } = await supabase
          .from('community_listings')
          .update(payload)
          .eq('id', listing.id)
          .select()
          .single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase
          .from('community_listings')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        saved = data;
      }
      toast.success(isEdit ? 'Listing updated!' : 'Listing created!');
      onSaved(saved);
    } catch (err) { toast.error(err.message || 'Failed to save listing'); }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-black text-slate-800">{isEdit ? 'Edit Listing' : 'New Listing'}</p>
        <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
      </div>

      {/* Type */}
      <div className="flex gap-2">
        {Object.entries(STORE_TYPE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setForm(f => ({ ...f, type: key }))}
            className={`flex-1 py-2 rounded-xl border text-[11px] font-bold transition-all ${
              form.type === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <input
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Title *"
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-blue-400 bg-white"
      />

      <textarea
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        rows={2}
        placeholder="Description (optional)"
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-blue-400 resize-none bg-white"
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="number" min="0" step="0.01"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            placeholder="Price"
            className="w-full pl-7 pr-2 py-2 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-400 bg-white"
          />
        </div>
        <select
          value={form.billing_period}
          onChange={e => setForm(f => ({ ...f, billing_period: e.target.value }))}
          className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-[12px] outline-none focus:border-blue-400 bg-white"
        >
          <option value="one_time">One-time</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {(form.type === 'subscription' || form.type === 'service') && (
        <textarea
          value={form.perks}
          onChange={e => setForm(f => ({ ...f, perks: e.target.value }))}
          rows={2}
          placeholder="Perks (one per line)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-blue-400 resize-none bg-white"
        />
      )}

      <div>
        {form.image_url ? (
          <div className="relative">
            <img src={form.image_url} alt="" className="w-full h-20 object-cover rounded-xl" />
            <button
              onClick={() => setForm(f => ({ ...f, image_url: '' }))}
              className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow"
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl h-12 cursor-pointer hover:border-blue-300 transition-colors bg-white">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> : <Image className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-[11px] text-slate-400">{uploading ? 'Uploading…' : 'Add image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl font-bold text-white text-[13px] bg-slate-950 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Listing'}
      </button>
    </div>
  );
}

function StoreAdminTab({ community, communityId, currentUser }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['admin-community-listings', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_listings')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!communityId,
  });

  const toggleActive = async (listing) => {
    const { error } = await supabase
      .from('community_listings')
      .update({ is_active: !listing.is_active, status: listing.is_active ? 'removed' : 'available' })
      .eq('id', listing.id);
    if (error) { toast.error('Could not update listing'); return; }
    qc.setQueryData(['admin-community-listings', communityId], prev =>
      (prev || []).map(l => l.id === listing.id ? { ...l, is_active: !l.is_active } : l)
    );
    qc.invalidateQueries({ queryKey: ['community-listings', communityId] });
    toast.success(listing.is_active ? 'Listing hidden' : 'Listing made active');
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this listing?')) return;
    const { error } = await supabase.from('community_listings').delete().eq('id', id);
    if (error) { toast.error('Could not delete listing'); return; }
    qc.setQueryData(['admin-community-listings', communityId], prev => (prev || []).filter(l => l.id !== id));
    qc.invalidateQueries({ queryKey: ['community-listings', communityId] });
    toast.success('Listing deleted');
  };

  const handleSaved = (saved) => {
    qc.setQueryData(['admin-community-listings', communityId], prev =>
      prev?.find(l => l.id === saved.id)
        ? prev.map(l => l.id === saved.id ? saved : l)
        : [saved, ...(prev || [])]
    );
    qc.invalidateQueries({ queryKey: ['community-listings', communityId] });
    setShowCreate(false);
    setEditingId(null);
  };

  const enabled = Boolean(community?.allow_member_listings);

  return (
    <div className="space-y-4 pb-8">
      {/* Module status notice */}
      {!enabled && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-[12px] font-semibold text-amber-800">
          The <strong>Marketplace</strong> module is currently off. Enable it in Settings → Modules for members to see the Store tab.
        </div>
      )}

      {/* Checkout coming soon notice */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-600">
        <strong>Checkout coming soon.</strong> Listing management is live. Payment processing via Stripe Connect will be enabled once the platform payment foundation ships.
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-black text-slate-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" /> Listings
          </p>
          <p className="text-[12px] font-semibold text-slate-400">{listings.length} total</p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-slate-950 text-white rounded-full px-3 py-1.5 text-[12px] font-bold active:scale-95 transition-all"
          >
            <FilePlus className="h-3.5 w-3.5" /> New Listing
          </button>
        )}
      </div>

      {showCreate && (
        <StoreListingForm
          communityId={communityId}
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-[13px] font-black text-slate-700">No listings yet</p>
          <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Create your first product, service, or subscription.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => {
            const typeCfg = STORE_TYPE_CONFIG[listing.type] || STORE_TYPE_CONFIG.product;
            const isEditing = editingId === listing.id;
            return (
              <div key={listing.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                {isEditing ? (
                  <div className="p-4">
                    <StoreListingForm
                      communityId={communityId}
                      currentUser={currentUser}
                      listing={listing}
                      onClose={() => setEditingId(null)}
                      onSaved={handleSaved}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3 px-4 py-3">
                    {listing.image_url ? (
                      <img src={listing.image_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-black text-slate-900 truncate">{listing.title}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        {!listing.is_active && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[12px] font-bold text-slate-700">
                          {listing.price == null || listing.price === 0
                            ? 'Free'
                            : `$${listing.price}${listing.billing_period === 'monthly' ? '/mo' : listing.billing_period === 'yearly' ? '/yr' : ''}`}
                        </span>
                        {listing.orders_count > 0 && (
                          <span className="text-[11px] text-slate-400">{listing.orders_count} orders</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(listing)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          listing.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {listing.is_active ? 'Active' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => setEditingId(listing.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
