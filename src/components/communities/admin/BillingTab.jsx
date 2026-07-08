import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Crown, CreditCard, Lock, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import paymentsService from '@/services/paymentsService';
import { formatPlanDate, getCommunityPlanStatusLabel, isCommunityPremium } from '@/lib/communityPlans';
import { filterCommunityPlanSubscription, filterUserCommunity } from '@/services/entityServices';
import { SectionHeader, MODULE_CONFIG } from './shared';

// ─── Billing tab ─────────────────────────────────────────────────────────────

export default function BillingTab({ communityId, community, currentUser, onCommunityUpdated }) {
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
