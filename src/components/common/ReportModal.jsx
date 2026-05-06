import React, { useState } from 'react';
import { Loader2, Flag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { dataService } from '@/services';

const REASONS = [
  { value: 'harassment', label: '😡 Harassment or bullying' },
  { value: 'inappropriate', label: '🚫 Inappropriate content' },
  { value: 'spam', label: '📢 Spam' },
  { value: 'misinformation', label: '❌ Misinformation' },
  { value: 'lashon_hara', label: '🗣️ Lashon hara (harmful speech)' },
  { value: 'shidduch_concern', label: '💍 Shidduch concern' },
  { value: 'self_harm', label: '⚠️ Self-harm or safety concern' },
  { value: 'doxxing', label: '🔍 Sharing private information' },
  { value: 'antisemitism', label: '✡️ Antisemitism or hate speech' },
  { value: 'other', label: '🔖 Other' },
];

const PRIORITY_MAP = {
  harassment: 'high',
  self_harm: 'critical',
  doxxing: 'high',
  antisemitism: 'high',
  inappropriate: 'medium',
  lashon_hara: 'medium',
  misinformation: 'medium',
  shidduch_concern: 'high',
  spam: 'low',
  other: 'medium',
};

export default function ReportModal({ open, onOpenChange, contentId, contentType, targetUserId, targetUserName, contentPreview, communityId, currentUser }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);

    await dataService.entities.Report.create({
      reporter_id: currentUser?.id || 'anonymous',
      reported_content_id: contentId,
      content_type: contentType,
      reason,
      details: details.trim() || undefined,
      priority: PRIORITY_MAP[reason] || 'medium',
      ai_flagged: false,
      community_id: communityId || undefined,
      target_user_id: targetUserId || undefined,
      target_user_name: targetUserName || undefined,
      content_preview: contentPreview ? contentPreview.slice(0, 200) : undefined,
      resolved: false,
    });

    setIsSubmitting(false);
    setDone(true);
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setDone(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help keep our community safe. All reports are confidential.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Report Submitted</h3>
            <p className="text-sm text-slate-500 mb-6">Our moderation team will review this shortly. Thank you for keeping our community safe.</p>
            <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {contentPreview && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 italic line-clamp-3">
                  "{contentPreview}"
                </div>
              )}

              <div>
                <Label className="text-base font-semibold">What's the issue?</Label>
                <RadioGroup value={reason} onValueChange={setReason} className="mt-3 space-y-1">
                  {REASONS.map(r => (
                    <div
                      key={r.value}
                      className={`flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer transition-colors ${reason === r.value ? 'bg-red-50 border border-red-200' : 'hover:bg-slate-50'}`}
                      onClick={() => setReason(r.value)}
                    >
                      <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                      <Label htmlFor={`reason-${r.value}`} className="font-normal cursor-pointer flex-1 text-sm">{r.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm">Additional context <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Provide any additional context that might help our team..."
                  className="mt-1 resize-none text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!reason || isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}