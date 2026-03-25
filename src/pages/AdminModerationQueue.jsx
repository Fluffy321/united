import React, { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, Ban, CheckCircle2, AlertTriangle, Trash2, ExternalLink, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AdminModerationQueue() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await base44.auth.me();
    if (user.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    setCurrentUser(user);
  };

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const allReports = await base44.entities.Report.list('-created_date', 100);
      return allReports.filter(r => !r.resolved);
    },
    enabled: !!currentUser
  });

  const { data: flaggedRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-flagged-requests'],
    queryFn: async () => {
      const requests = await base44.entities.MitzvahRequest.list('-created_date', 100);
      return requests.filter(r => r.is_hidden);
    },
    enabled: !!currentUser
  });

  const { data: verificationRequests = [], isLoading: verificationsLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: () => base44.entities.VerificationRequest.filter({ status: 'pending' }, '-created_date'),
    enabled: !!currentUser
  });

  const approveVerificationMutation = useMutation({
    mutationFn: async ({ reqId, userId }) => {
      await base44.entities.VerificationRequest.update(reqId, {
        status: 'approved', reviewed_by: currentUser.id, reviewed_at: new Date().toISOString()
      });
      // Mark user as verified
      await base44.asServiceRole?.entities?.User?.update?.(userId, { is_verified: true }).catch(() =>
        base44.entities.User?.update?.(userId, { is_verified: true })
      );
    },
    onSuccess: () => { queryClient.invalidateQueries(['admin-verifications']); toast.success('User verified ✓'); }
  });

  const rejectVerificationMutation = useMutation({
    mutationFn: async ({ reqId, note }) => {
      await base44.entities.VerificationRequest.update(reqId, {
        status: 'rejected', admin_note: note || 'Insufficient documentation.',
        reviewed_by: currentUser.id, reviewed_at: new Date().toISOString()
      });
    },
    onSuccess: () => { queryClient.invalidateQueries(['admin-verifications']); toast.success('Request rejected'); }
  });

  const hideRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.MitzvahRequest.update(requestId, { is_hidden: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reports']);
      queryClient.invalidateQueries(['admin-flagged-requests']);
      toast.success('Request hidden');
    }
  });

  const unhideRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.MitzvahRequest.update(requestId, { is_hidden: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-flagged-requests']);
      toast.success('Request restored');
    }
  });

  const deleteContentMutation = useMutation({
    mutationFn: async ({ contentType, contentId }) => {
      if (contentType === 'post') await base44.entities.UnifiedPost.delete(contentId);
      else if (contentType === 'request') await base44.entities.MitzvahRequest.delete(contentId);
      else if (contentType === 'comment') await base44.entities.Comment.delete(contentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('Content deleted');
    }
  });

  const resolveReportMutation = useMutation({
    mutationFn: async (reportId) => {
      await base44.entities.Report.update(reportId, { 
        resolved: true,
        resolved_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('Report marked as resolved');
    }
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Moderation Queue</h1>
          <p className="text-sm text-slate-600 mt-1">Review reports and manage flagged content</p>
        </div>

        <Tabs defaultValue="reports">
          <TabsList className="mb-6">
            <TabsTrigger value="reports" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Reports ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="hidden" className="gap-2">
              <EyeOff className="w-4 h-4" />
              Hidden Requests ({flaggedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="verifications" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              Verifications ({verificationRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            {reportsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No pending reports</p>
                <p className="text-sm text-slate-400 mt-1">All clear!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(report => (
                  <div key={report.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2">
                          {report.content_type}
                        </Badge>
                        <p className="font-semibold text-slate-900">Reason: {report.reason}</p>
                        {report.details && (
                          <p className="text-sm text-slate-600 mt-1">{report.details}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <span>Reported {formatDistanceToNow(new Date(report.created_date), { addSuffix: true })}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => hideRequestMutation.mutate(report.reported_content_id)}
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide Content
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteContentMutation.mutate({ contentType: report.content_type, contentId: report.reported_content_id })}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveReportMutation.mutate(report.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hidden">
            {requestsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : flaggedRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <Eye className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No hidden requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-2xl p-4 shadow-sm border border-red-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Badge className="bg-red-600 text-white mb-2">
                          {request.category}
                        </Badge>
                        <h3 className="font-bold text-slate-900">{request.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{request.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <span>By: {request.created_by_name}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(request.created_date), { addSuffix: true })}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unhideRequestMutation.mutate(request.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verifications">
            {verificationsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : verificationRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <ShieldCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No pending verification requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequests.map(req => (
                  <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{req.verification_type?.replace('_', ' ')}</span>
                        </div>
                        <p className="font-bold text-slate-900">{req.user_name}</p>
                        <p className="text-xs text-slate-400">{req.user_email}</p>
                        {req.community_name && <p className="text-sm text-slate-600 mt-1">🏛 {req.community_name}</p>}
                        <p className="text-sm text-slate-700 mt-2 bg-slate-50 rounded-lg p-2">{req.proof_description}</p>
                      </div>
                    </div>
                    {req.proof_image_url && (
                      <a href={req.proof_image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-3 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" /> View proof document
                      </a>
                    )}
                    <p className="text-xs text-slate-400 mb-3">Submitted {formatDistanceToNow(new Date(req.created_date), { addSuffix: true })}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 gap-1"
                        onClick={() => approveVerificationMutation.mutate({ reqId: req.id, userId: req.user_id })}
                        disabled={approveVerificationMutation.isPending}
                      >
                        <ShieldCheck className="w-4 h-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 gap-1"
                        onClick={() => rejectVerificationMutation.mutate({ reqId: req.id, note: '' })}
                        disabled={rejectVerificationMutation.isPending}
                      >
                        <ShieldX className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}