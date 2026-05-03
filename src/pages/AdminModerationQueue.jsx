import React, { useState, useEffect } from 'react';
import {
  Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle, Building2,
  X, Filter, Shield, Clock, Bot, User, RefreshCw,
  FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import ActionModal from '@/components/moderation/ActionModal';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== 'admin') { window.location.href = '/'; return; }
      setCurrentUser(user);
    });
  }, []);

  const { data: reports = [], isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => base44.entities.Report.filter({ resolved: false }, '-created_date', 200),
    enabled: !!currentUser,
    refetchInterval: 60000,
  });

  const { data: claimRequests = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['admin-claims'],
    queryFn: () => base44.entities.ClaimRequest.filter({ status: 'pending' }, '-created_date', 50),
    enabled: !!currentUser,
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => base44.entities.ModerationAuditLog.list('-created_date', 100),
    enabled: !!currentUser,
  });

  const { data: flaggedRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-flagged-requests'],
    queryFn: async () => {
      const requests = await base44.entities.MitzvahRequest.list('-created_date', 100);
      return requests.filter(r => r.is_hidden);
    },
    enabled: !!currentUser,
  });

  const resolveReportMutation = useMutation({
    mutationFn: async (reportId) => {
      await base44.entities.Report.update(reportId, {
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: currentUser.id,
      });
      await base44.entities.ModerationAuditLog.create({
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
      await base44.entities.ClaimRequest.update(claim.id, { status: 'approved', reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() });
      await base44.entities.Community.update(claim.community_id, { is_claimed: true, is_verified: true, claimed_org_id: claim.requester_id });
      await base44.entities.ModerationAuditLog.create({
        admin_id: currentUser.id, admin_name: currentUser.full_name || currentUser.email,
        action: 'approve_claim', community_id: claim.community_id,
        target_user_id: claim.requester_id, performed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-claims'] }); toast.success('Claim approved ✓'); },
  });

  const rejectClaimMutation = useMutation({
    mutationFn: async (claim) => {
      await base44.entities.ClaimRequest.update(claim.id, { status: 'rejected', reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() });
      await base44.entities.ModerationAuditLog.create({
        admin_id: currentUser.id, admin_name: currentUser.full_name || currentUser.email,
        action: 'reject_claim', community_id: claim.community_id, performed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-claims'] }); toast.success('Claim rejected'); },
  });

  const unhideRequestMutation = useMutation({
    mutationFn: (requestId) => base44.entities.MitzvahRequest.update(requestId, { is_hidden: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-flagged-requests'] }); toast.success('Request restored'); },
  });

  const filteredReports = reports.filter(r => {
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && r.content_type !== typeFilter) return false;
    return true;
  });

  const criticalCount = reports.filter(r => r.priority === 'critical').length;
  const highCount = reports.filter(r => r.priority === 'high').length;

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-slate-700" /> Moderation Queue
            </h1>
            <p className="text-sm text-slate-500 mt-1">Review flagged content and take action</p>
          </div>
          <button onClick={() => refetchReports()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Summary chips */}
        <div className="flex gap-3 mb-6 flex-wrap">
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

        <Tabs defaultValue="reports">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="reports" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Reports
              {reports.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{reports.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="claims" className="gap-2">
              <Building2 className="w-4 h-4" />
              Claims
              {claimRequests.length > 0 && <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{claimRequests.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="hidden" className="gap-2">
              <EyeOff className="w-4 h-4" />
              Hidden ({flaggedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

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