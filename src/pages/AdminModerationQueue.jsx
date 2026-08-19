import React, { useState } from 'react';
import {
  Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle, Building2,
  X, Filter, Shield, Clock, Bot, User, RefreshCw,
  FileText, ArrowLeft, Store, Globe2, MapPin, ExternalLink, BadgeCheck, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notificationsService } from '@/services';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import ActionModal from '@/components/moderation/ActionModal';
import AiModerationPanel from '@/components/moderation/AiModerationPanel';
import { publishingService } from '@/services/publishingService';
import { createModerationAuditLog, filterBusinessClaimRequest, filterBusinessListing, filterClaimRequest, filterReport, listMitzvahRequest, listModerationAuditLog, updateClaimRequest, updateCommunity, updateMitzvahRequest, updateReport } from '@/services/entityServices';

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 border border-red-300' },
  high:     { label: 'High',     color: 'bg-orange-100 text-orange-800 border border-orange-300' },
  medium:   { label: 'Medium',   color: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  low:      { label: 'Low',      color: 'bg-slate-100 text-slate-600' },
};

const REASON_LABELS = {
  harassment: 'Harassment',
  inappropriate: 'Inappropriate',
  spam: 'Spam',
  misinformation: 'Misinformation',
  lashon_hara: 'Lashon Hara',
  shidduch_concern: 'Shidduch Concern',
  self_harm: 'Self-Harm ⚠️',
  doxxing: 'Doxxing',
  antisemitism: 'Antisemitism',
  other: 'Other',
};

const businessLocationLabel = (business) => {
  if (business.listing_type === 'online') return 'Online';
  if (business.listing_type === 'service_area') return business.service_area_text || business.neighborhood || 'Service area';
  if (business.hide_exact_address) return business.neighborhood || business.city || 'Address hidden';
  return business.address || business.neighborhood || business.city || 'Location pending';
};

const businessCategoryLabel = (value) => String(value || 'other')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const titleCase = (value) => String(value || 'Community post')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const moderationItems = (data) => {
  const items = Array.isArray(data) ? data : data?.items || [];
  return items.map((item) => ({
    id: item.id,
    contentPreview: item.contentPreview || item.content_preview || item.content_snapshot || 'Content preview unavailable.',
    authorName: item.authorName || item.author_name || 'JUnited member',
    audienceLabel: item.audienceLabel || item.audience_label || item.network || 'Local area',
    publishingTypeLabel: item.publishingTypeLabel || titleCase(item.publishing_type),
    moderationStatus: item.moderationStatus || item.moderation_status || item.status,
    aiReason: item.aiReason || item.ai_reason || item.human_reason || item.reasons?.[0] || 'This post needs a closer look.',
    confidence: item.confidence,
    provider: item.providerName || item.provider_name || item.provider || 'OpenAI',
    model: item.model || item.provider_model || 'Not recorded',
    policyVersion: item.policyVersion || item.policy_version || 'JUnited safety 1.0',
    sourceUrl: item.sourceUrl || item.source_url || null,
    appealReason: item.appealReason || item.appeal_reason || item.appeal?.reason || null,
  }));
};

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>;
}

function ReportCard({ report, onAction, onResolve }) {
  const timeAgo = formatDistanceToNow(new Date(report.created_date), { addSuffix: true });

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${report.priority === 'critical' ? 'border-red-300' : report.priority === 'high' ? 'border-orange-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <PriorityBadge priority={report.priority} />
            <Badge variant="outline" className="text-[11px]">
              {REASON_LABELS[report.reason] || report.reason}
            </Badge>
            <Badge variant="outline" className="text-[11px] capitalize">
              {report.content_type?.replace('_', ' ')}
            </Badge>
            {report.ai_flagged && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                <Bot className="w-3 h-3" /> AI flagged
              </span>
            )}
          </div>
          {report.content_preview && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 italic line-clamp-2 mb-2">
              "{report.content_preview}"
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            {report.target_user_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {report.target_user_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo}
            </span>
            {report.reporter_id !== 'ai_filter' && (
              <span>Reported by user</span>
            )}
          </div>
          {report.details && (
            <p className="text-xs text-slate-500 mt-2 border-l-2 border-slate-200 pl-2">{report.details}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => onResolve(report.id)}
          className="text-xs h-8">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-600" /> Dismiss
        </Button>
        <Button size="sm" onClick={() => onAction(report)}
          className="text-xs h-8 bg-slate-900 hover:bg-slate-800">
          <Shield className="w-3.5 h-3.5 mr-1.5" /> Take Action
        </Button>
      </div>
    </div>
  );
}

export default function AdminModerationQueue() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => filterReport({ resolved: false }, '-created_date', 200),
    enabled: !!currentUser,
    refetchInterval: 60000,
  });

  const { data: claimRequests = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['admin-claims'],
    queryFn: () => filterClaimRequest({ status: 'pending' }, '-created_date', 50),
    enabled: !!currentUser,
  });

  const { data: businessSubmissions = [], isLoading: businessSubmissionsLoading } = useQuery({
    queryKey: ['admin-business-submissions'],
    queryFn: () => filterBusinessListing({ status: 'pending' }, '-created_date', 100),
    enabled: !!currentUser,
  });

  const { data: businessClaims = [], isLoading: businessClaimsLoading } = useQuery({
    queryKey: ['admin-business-claims'],
    queryFn: () => filterBusinessClaimRequest({ status: 'pending' }, '-created_date', 100),
    enabled: !!currentUser,
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => listModerationAuditLog('-created_date', 100),
    enabled: !!currentUser,
  });

  const { data: flaggedRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-flagged-requests'],
    queryFn: async () => {
      const requests = await listMitzvahRequest('-created_date', 100);
      return requests.filter(r => r.is_hidden);
    },
    enabled: !!currentUser,
  });

  const { data: aiReviewResponse, isLoading: aiReviewLoading, error: aiReviewError, refetch: refetchAiReview } = useQuery({
    queryKey: ['admin-ai-moderation', 'needs_review'],
    queryFn: () => publishingService.listModerationQueue({ status: 'needs_review' }),
    enabled: currentUser?.role === 'admin',
    refetchInterval: 60000,
    retry: false,
  });

  const { data: aiHiddenResponse, isLoading: aiHiddenLoading, error: aiHiddenError, refetch: refetchAiHidden } = useQuery({
    queryKey: ['admin-ai-moderation', 'temporarily_hidden'],
    queryFn: () => publishingService.listModerationQueue({ status: 'temporarily_hidden' }),
    enabled: currentUser?.role === 'admin',
    refetchInterval: 60000,
    retry: false,
  });

  const { data: appealsResponse, isLoading: appealsLoading, error: appealsError, refetch: refetchAppeals } = useQuery({
    queryKey: ['admin-ai-moderation', 'appealed'],
    queryFn: () => publishingService.listModerationQueue({ status: 'appealed' }),
    enabled: currentUser?.role === 'admin',
    refetchInterval: 60000,
    retry: false,
  });

  const { data: moderationHealthResponse } = useQuery({
    queryKey: ['admin-moderation-health'],
    queryFn: () => publishingService.getModerationHealth(),
    enabled: currentUser?.role === 'admin',
    refetchInterval: 60000,
    retry: false,
  });

  const resolveReportMutation = useMutation({
    mutationFn: async (reportId) => {
      await updateReport(reportId, {
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: currentUser.id,
      });
      await createModerationAuditLog({
        admin_id: currentUser.id,
        admin_name: currentUser.full_name || currentUser.email,
        action: 'dismiss',
        report_id: reportId,
        performed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit'] });
      toast.success('Report dismissed');
    },
  });

  const approveClaimMutation = useMutation({
    mutationFn: async (claim) => {
      await updateClaimRequest(claim.id, { status: 'approved', reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() });
      await updateCommunity(claim.community_id, { is_claimed: true, is_verified: true, claimed_org_id: claim.requester_id });
      await createModerationAuditLog({
        admin_id: currentUser.id, admin_name: currentUser.full_name || currentUser.email,
        action: 'approve_claim', community_id: claim.community_id,
        target_user_id: claim.requester_id, performed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-claims'] }); toast.success('Claim approved ✓'); },
  });

  const rejectClaimMutation = useMutation({
    mutationFn: async (claim) => {
      await updateClaimRequest(claim.id, { status: 'rejected', reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() });
      await createModerationAuditLog({
        admin_id: currentUser.id, admin_name: currentUser.full_name || currentUser.email,
        action: 'reject_claim', community_id: claim.community_id, performed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-claims'] }); toast.success('Claim rejected'); },
  });

  const notifyBusinessOwner = async ({ userId, title, body, type }) => {
    if (!userId) return;
    try {
      await notificationsService.create({
        userId,
        actorId: currentUser?.id,
        type,
        title,
        body,
        linkUrl: '/Map',
      });
    } catch (err) {
      // Notification delivery is best-effort — never block the moderation action on it.
      console.error('Failed to notify business owner', err);
    }
  };

  const approveBusinessSubmissionMutation = useMutation({
    mutationFn: async (business) => {
      if (!supabase) throw new Error('Supabase is not configured');
      const { error } = await supabase.rpc('approve_business_listing_submission', {
        p_listing_id: business.id,
        p_review_note: null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, business) => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['business-directory-published'] });
      toast.success('Business published');
      notifyBusinessOwner({
        userId: business.submitted_by,
        type: 'business_verification',
        title: 'Your business listing is live',
        body: `"${business.name}" was approved and is now published in the JUnited business directory.`,
      });
    },
    onError: (error) => toast.error(error.message || 'Could not approve business'),
  });

  const rejectBusinessSubmissionMutation = useMutation({
    mutationFn: async (business) => {
      if (!supabase) throw new Error('Supabase is not configured');
      const { error } = await supabase.rpc('reject_business_listing_submission', {
        p_listing_id: business.id,
        p_review_note: null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, business) => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-submissions'] });
      toast.success('Business rejected');
      notifyBusinessOwner({
        userId: business.submitted_by,
        type: 'business_verification',
        title: 'Your business listing needs changes',
        body: `"${business.name}" was not approved for the business directory. Reply to this notification or contact support for details.`,
      });
    },
    onError: (error) => toast.error(error.message || 'Could not reject business'),
  });

  const approveBusinessClaimMutation = useMutation({
    mutationFn: async ({ claim, verifyJewishOwned = false, verifyKosher = false }) => {
      if (!supabase) throw new Error('Supabase is not configured');
      const { error } = await supabase.rpc('approve_business_claim_request', {
        p_claim_id: claim.id,
        p_review_note: null,
        p_verify_jewish_owned: verifyJewishOwned,
        p_verify_kosher: verifyKosher,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { claim }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-claims'] });
      queryClient.invalidateQueries({ queryKey: ['business-directory-published'] });
      toast.success('Business claim approved');
      notifyBusinessOwner({
        userId: claim.requester_id,
        type: 'business_verification',
        title: 'Your business claim was approved',
        body: `You're now the verified owner of "${claim.business_name || 'your business'}" on JUnited.`,
      });
    },
    onError: (error) => toast.error(error.message || 'Could not approve claim'),
  });

  const rejectBusinessClaimMutation = useMutation({
    mutationFn: async (claim) => {
      if (!supabase) throw new Error('Supabase is not configured');
      const { error } = await supabase.rpc('reject_business_claim_request', {
        p_claim_id: claim.id,
        p_review_note: null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, claim) => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-claims'] });
      toast.success('Business claim rejected');
      notifyBusinessOwner({
        userId: claim.requester_id,
        type: 'business_verification',
        title: 'Your business claim was not approved',
        body: `Your ownership claim for "${claim.business_name || 'this business'}" was not approved. Contact support if you believe this is a mistake.`,
      });
    },
    onError: (error) => toast.error(error.message || 'Could not reject claim'),
  });

  const unhideRequestMutation = useMutation({
    mutationFn: (requestId) => updateMitzvahRequest(requestId, { is_hidden: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-flagged-requests'] }); toast.success('Request restored'); },
  });

  const decideAiModerationMutation = useMutation({
    mutationFn: ({ jobId, decision, reason }) => publishingService.decideModeration(jobId, decision, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-health'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit'] });
      toast.success(variables.decision === 'restore' ? 'Post restored' : variables.decision === 'remove' ? 'Post removed' : 'Decision saved');
    },
    onError: (error) => toast.error(error.message || 'Could not save that decision'),
  });

  const filteredReports = reports.filter(r => {
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && r.content_type !== typeFilter) return false;
    return true;
  });

  const criticalCount = reports.filter(r => r.priority === 'critical').length;
  const highCount = reports.filter(r => r.priority === 'high').length;
  const businessQueueCount = businessSubmissions.length + businessClaims.length;
  const aiReviewItems = moderationItems(aiReviewResponse);
  const aiHiddenItems = moderationItems(aiHiddenResponse);
  const appealItems = moderationItems(appealsResponse);
  const moderationHealth = moderationHealthResponse?.health || moderationHealthResponse || {};

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] sm:py-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-2 sm:mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-black text-navy sm:text-2xl">
                <Shield className="w-6 h-6 text-blue-700" /> Admin Center
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">AI sorts the work. You make the call.</p>
            </div>
          </div>
          <button onClick={() => { refetchReports(); queryClient.invalidateQueries({ queryKey: ['admin-ai-moderation'] }); queryClient.invalidateQueries({ queryKey: ['admin-moderation-health'] }); }} aria-label="Refresh every admin queue" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-700">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Summary chips */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:mb-6 sm:flex-wrap">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-700">{criticalCount} critical</span>
            </div>
          )}
          {highCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-bold text-orange-700">{highCount} high priority</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2">
            <span className="text-sm text-slate-600">{reports.length} total pending</span>
          </div>
        </div>

        <Tabs defaultValue="ai-review">
          <TabsList className="sticky top-0 z-20 -mx-4 mb-4 flex h-auto w-[calc(100%+2rem)] justify-start gap-1 overflow-x-auto rounded-none border-y border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur [scrollbar-width:none] sm:static sm:mx-0 sm:mb-6 sm:w-full sm:rounded-xl sm:border">
            <TabsTrigger value="ai-review" className="min-h-11 shrink-0 gap-1.5 rounded-lg px-3">
              <Bot className="h-4 w-4" />
              Needs review
              {aiReviewItems.length > 0 && <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{aiReviewItems.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="ai-hidden" className="min-h-11 shrink-0 gap-1.5 rounded-lg px-3">
              <EyeOff className="h-4 w-4" />
              AI hidden
              {aiHiddenItems.length > 0 && <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{aiHiddenItems.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="appeals" className="min-h-11 shrink-0 gap-1.5 rounded-lg px-3">
              <MessageSquare className="h-4 w-4" />
              Appeals
              {appealItems.length > 0 && <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{appealItems.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              User reports
              {reports.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{reports.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="claims" className="gap-2">
              <Building2 className="w-4 h-4" />
              Claims
              {claimRequests.length > 0 && <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{claimRequests.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="businesses" className="gap-2">
              <Store className="w-4 h-4" />
              Businesses
              {businessQueueCount > 0 && <span className="ml-1 bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{businessQueueCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="hidden" className="gap-2">
              <EyeOff className="w-4 h-4" />
              Hidden ({flaggedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-review">
            {aiReviewLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>
            ) : (
              <AiModerationPanel
                title="Needs review"
                items={aiReviewItems}
                health={moderationHealth}
                error={aiReviewError}
                onRetry={refetchAiReview}
                busyJobId={decideAiModerationMutation.variables?.jobId}
                onDecision={(decision) => decideAiModerationMutation.mutate(decision)}
              />
            )}
          </TabsContent>

          <TabsContent value="ai-hidden">
            {aiHiddenLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>
            ) : (
              <AiModerationPanel
                title="AI hidden"
                items={aiHiddenItems}
                health={moderationHealth}
                error={aiHiddenError}
                onRetry={refetchAiHidden}
                busyJobId={decideAiModerationMutation.variables?.jobId}
                onDecision={(decision) => decideAiModerationMutation.mutate(decision)}
              />
            )}
          </TabsContent>

          <TabsContent value="appeals">
            {appealsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>
            ) : (
              <AiModerationPanel
                title="Appeals"
                items={appealItems}
                health={moderationHealth}
                error={appealsError}
                onRetry={refetchAppeals}
                busyJobId={decideAiModerationMutation.variables?.jobId}
                onDecision={(decision) => decideAiModerationMutation.mutate(decision)}
              />
            )}
          </TabsContent>

          {/* ── REPORTS TAB ── */}
          <TabsContent value="reports">
            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40 h-9 text-sm">
                  <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue placeholder="Content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="post">Posts</SelectItem>
                  <SelectItem value="unified_post">Feed Posts</SelectItem>
                  <SelectItem value="community_post">Community Posts</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="user">User profiles</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                </SelectContent>
              </Select>
              {(priorityFilter !== 'all' || typeFilter !== 'all') && (
                <button onClick={() => { setPriorityFilter('all'); setTypeFilter('all'); }} className="text-sm text-blue-600 font-medium">Clear filters</button>
              )}
            </div>

            {reportsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <p className="text-slate-700 font-semibold text-lg">Queue is clear!</p>
                <p className="text-sm text-slate-400 mt-1">No pending reports matching your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Critical first */}
                {filteredReports
                  .sort((a, b) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 };
                    return (order[a.priority] || 2) - (order[b.priority] || 2);
                  })
                  .map(report => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onAction={(r) => { setSelectedReport(r); setShowActionModal(true); }}
                      onResolve={(id) => resolveReportMutation.mutate(id)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* ── CLAIMS TAB ── */}
          <TabsContent value="claims">
            {claimsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : claimRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <Building2 className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-semibold">No pending claim requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {claimRequests.map(claim => (
                  <div key={claim.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Claim Request</Badge>
                          <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(claim.created_date), { addSuffix: true })}</span>
                        </div>
                        <h3 className="font-bold text-slate-900">{claim.community_name}</h3>
                        <p className="text-sm text-slate-600 mt-0.5">
                          <strong>{claim.requester_name}</strong> — {claim.role_at_org || 'Representative'}
                        </p>
                        <p className="text-sm text-blue-600 mt-0.5">📧 {claim.org_email}</p>
                        {claim.notes && (
                          <p className="text-sm text-slate-500 mt-2 bg-slate-50 rounded-lg p-2 italic">{claim.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveClaimMutation.mutate(claim)} disabled={approveClaimMutation.isPending}>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Verify
                      </Button>
                      <Button size="sm" variant="destructive"
                        onClick={() => rejectClaimMutation.mutate(claim)} disabled={rejectClaimMutation.isPending}>
                        <X className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── BUSINESSES TAB ── */}
          <TabsContent value="businesses">
            {(businessSubmissionsLoading || businessClaimsLoading) ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : businessQueueCount === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <Store className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-semibold">No pending business submissions or claims</p>
                <p className="text-sm text-slate-400 mt-1">Approved businesses appear on the Map directory.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {businessSubmissions.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Business submissions</h2>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{businessSubmissions.length} pending</span>
                    </div>
                    <div className="space-y-3">
                      {businessSubmissions.map((business) => (
                        <div key={business.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-800 border border-blue-200">New Business</Badge>
                                <Badge variant="outline" className="capitalize">{businessCategoryLabel(business.category)}</Badge>
                                {business.listing_type === 'online' && <Globe2 className="h-4 w-4 text-blue-600" />}
                                {business.listing_type === 'physical' && <MapPin className="h-4 w-4 text-slate-500" />}
                              </div>
                              <h3 className="text-base font-bold text-slate-900">{business.name}</h3>
                              <p className="mt-1 text-sm font-medium text-slate-600">{businessLocationLabel(business)}</p>
                              {business.description && (
                                <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-500">{business.description}</p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                                {business.submitted_by_name && <span>Submitted by {business.submitted_by_name}</span>}
                                {business.website && (
                                  <a href={business.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600">
                                    <ExternalLink className="h-3 w-3" /> Website
                                  </a>
                                )}
                                {business.jewish_owned_status === 'pending' && <span>Jewish-owned claim pending review</span>}
                                {business.kosher_status === 'pending' && <span>Kosher claim pending review</span>}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveBusinessSubmissionMutation.mutate(business)}
                              disabled={approveBusinessSubmissionMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Publish
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectBusinessSubmissionMutation.mutate(business)}
                              disabled={rejectBusinessSubmissionMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-1.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {businessClaims.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Business claim requests</h2>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">{businessClaims.length} pending</span>
                    </div>
                    <div className="space-y-3">
                      {businessClaims.map((claim) => (
                        <div key={claim.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Business Claim</Badge>
                            {claim.jewish_owned_claim && <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100"><BadgeCheck className="mr-1 h-3 w-3" /> Jewish-owned requested</Badge>}
                          </div>
                          <h3 className="font-bold text-slate-900">{claim.business_name || `Business claim ${claim.business_id}`}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            <strong>{claim.claimant_name}</strong> — {claim.role_at_business || 'Representative'}
                          </p>
                          <p className="mt-0.5 text-sm text-blue-600">📧 {claim.claimant_email}</p>
                          {claim.proof_notes && (
                            <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm italic text-slate-500">{claim.proof_notes}</p>
                          )}
                          {claim.kosher_claim && (
                            <p className="mt-2 text-xs font-bold text-slate-500">
                              Kosher claim: {claim.kosher_claim}
                              {claim.kosher_certifying_agency_claim
                                ? ` (agency: ${claim.kosher_certifying_agency_claim})`
                                : ' (no certifying agency named — cannot approve as kosher)'}
                              {claim.kosher_certification_expires_at_claim
                                ? ` · expires ${claim.kosher_certification_expires_at_claim}`
                                : claim.kosher_certification_no_expiration_claim
                                  ? ' · no expiration provided'
                                  : ' · no expiration info — cannot approve as kosher'}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveBusinessClaimMutation.mutate({ claim, verifyJewishOwned: false, verifyKosher: false })}
                              disabled={approveBusinessClaimMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Owner
                            </Button>
                            {claim.jewish_owned_claim && (
                              <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => approveBusinessClaimMutation.mutate({ claim, verifyJewishOwned: true, verifyKosher: false })}
                                disabled={approveBusinessClaimMutation.isPending}
                              >
                                <BadgeCheck className="w-4 h-4 mr-1.5" /> Approve + Jewish-Owned
                              </Button>
                            )}
                            {claim.kosher_claim
                              && claim.kosher_certifying_agency_claim
                              && (claim.kosher_certification_expires_at_claim || claim.kosher_certification_no_expiration_claim) && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => approveBusinessClaimMutation.mutate({ claim, verifyJewishOwned: Boolean(claim.jewish_owned_claim), verifyKosher: true })}
                                disabled={approveBusinessClaimMutation.isPending}
                              >
                                <BadgeCheck className="w-4 h-4 mr-1.5" /> Approve + Kosher
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectBusinessClaimMutation.mutate(claim)}
                              disabled={rejectBusinessClaimMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-1.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── HIDDEN TAB ── */}
          <TabsContent value="hidden">
            {requestsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : flaggedRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <Eye className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-semibold">No hidden content</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-xl border border-red-100 p-4 shadow-sm">
                    <Badge className="bg-red-100 text-red-700 mb-2">{request.category}</Badge>
                    <h3 className="font-bold text-slate-900">{request.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{request.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 my-2">
                      <span>By: {request.created_by_name}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(request.created_date), { addSuffix: true })}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => unhideRequestMutation.mutate(request.id)}>
                      <Eye className="w-4 h-4 mr-1.5" /> Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── AUDIT LOG TAB ── */}
          <TabsContent value="audit">
            {auditLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <FileText className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-semibold">No audit entries yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Admin</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {format(new Date(log.performed_at || log.created_date), 'MMM d, h:mm a')}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 text-xs">{log.admin_name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            log.action === 'perm_ban' || log.action === 'shadow_ban' ? 'bg-red-100 text-red-700' :
                            log.action === 'temp_ban' || log.action === 'community_ban' ? 'bg-orange-100 text-orange-700' :
                            log.action === 'warn_user' ? 'bg-amber-100 text-amber-700' :
                            log.action === 'remove_content' ? 'bg-slate-200 text-slate-700' :
                            log.action === 'approve_claim' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{log.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Modal */}
      <ActionModal
        open={showActionModal}
        onOpenChange={setShowActionModal}
        report={selectedReport}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
          queryClient.invalidateQueries({ queryKey: ['admin-audit'] });
        }}
      />
    </div>
  );
}
