import React, { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ACTIONS = [
  { value: 'dismiss', label: '✅ Dismiss — no action needed', color: 'text-slate-600' },
  { value: 'warn_user', label: '⚠️ Warn user', color: 'text-amber-600' },
  { value: 'remove_content', label: '🗑️ Remove content', color: 'text-orange-600' },
  { value: 'community_ban', label: '🚫 Ban from this community', color: 'text-red-600' },
  { value: 'temp_ban', label: '⏱️ Temporary platform ban', color: 'text-red-700' },
  { value: 'shadow_ban', label: '👻 Shadow ban (spam suppression)', color: 'text-purple-600' },
  { value: 'perm_ban', label: '🔨 Permanent ban', color: 'text-red-900' },
];

const BAN_DURATIONS = [
  { value: '1', label: '1 day' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

export default function ActionModal({ open, onOpenChange, report, onSuccess }) {
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [banDays, setBanDays] = useState('7');
  const [loading, setLoading] = useState(false);

  const needsBanDuration = action === 'temp_ban';
  const needsReason = action !== 'dismiss';

  const handleSubmit = async () => {
    if (!action) return;
    if (needsReason && !reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setLoading(true);
    try {
      await base44.functions.invoke('moderationAction', {
        action,
        report_id: report.id,
        content_type: report.content_type,
        content_id: report.reported_content_id,
        target_user_id: report.target_user_id || null,
        community_id: report.community_id || null,
        ban_days: needsBanDuration ? parseInt(banDays) : undefined,
        reason: reason.trim(),
      });
      toast.success('Action applied successfully');
      onSuccess?.();
      onOpenChange(false);
      setAction('');
      setReason('');
    } catch (e) {
      toast.error('Failed to apply action');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Take Moderation Action
          </DialogTitle>
        </DialogHeader>

        {report && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-2">
            <p className="font-semibold text-slate-800 mb-0.5">Report: {report.reason?.replace(/_/g, ' ')}</p>
            {report.content_preview && <p className="italic line-clamp-2">"{report.content_preview}"</p>}
            {report.target_user_name && <p className="text-xs text-slate-400 mt-1">User: {report.target_user_name}</p>}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="font-semibold">Action</Label>
            <div className="mt-2 space-y-1">
              {ACTIONS.map(a => (
                <button
                  key={a.value}
                  onClick={() => setAction(a.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    action === a.value
                      ? 'border-blue-400 bg-blue-50 text-blue-900'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  } ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {needsBanDuration && (
            <div>
              <Label>Ban Duration</Label>
              <Select value={banDays} onValueChange={setBanDays}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BAN_DURATIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsReason && action && (
            <div>
              <Label>Reason / Note <span className="text-slate-400 font-normal">(shown to user if applicable)</span></Label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain the reason for this action..."
                className="mt-1 resize-none text-sm"
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!action || loading}
            className={action === 'perm_ban' || action === 'shadow_ban' ? 'bg-red-700 hover:bg-red-800' : 'bg-slate-900 hover:bg-slate-800'}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply Action'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}