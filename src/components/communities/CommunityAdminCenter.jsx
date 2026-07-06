import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X, LayoutDashboard, BarChart2, Users, Shield, Settings,
  Search, Loader2, Save, CheckCircle2, XCircle, ExternalLink,
  UserMinus, UserCheck, UserPlus, Crown, ShieldCheck, MoreVertical, Clock, TrendingUp,
  AlertCircle, ShieldAlert, Gavel, Activity, AlertTriangle,
  Pin, Lock, CreditCard, Megaphone, Send,
  LayoutGrid, Palette, Tag,
  ClipboardList,
  ShoppingBag,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import postsService from '@/services/postsService';
import paymentsService from '@/services/paymentsService';
import CommunityInviteModal from './CommunityInviteModal';
import AdminFormsTab from './admin/AdminFormsTab';
import StoreAdminTab from './admin/StoreAdminTab';
import { formatPlanDate, getCommunityPlanStatusLabel, isCommunityPremium } from '@/lib/communityPlans';
import { filterCommunityPlanSubscription, filterUserCommunity } from '@/services/entityServices';

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

import SettingsTab from './admin-center/SettingsTab';
import { LayoutTab, BrandingTab } from './admin-center/LayoutBrandingTabs';
import { RemoveMemberModal, ReviewAppealModal } from './admin-center/modals';
import { ACTION_LABELS, fmtDate, fmtRelative, isPublicCommunity, Avatar, RoleBadge, StatCard, SimpleBarChart, EmptyState, SectionHeader, buildWeeklyBuckets } from './admin-center/shared';


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
    queryFn: () => filterUserCommunity({ community_id: communityId, user_id: currentUser.id }),
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
    queryFn: () => filterCommunityPlanSubscription(
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
          <PlanFeature label="Premium" detail="Unlimited events/resources and marketplace" active={premiumActive} />
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

