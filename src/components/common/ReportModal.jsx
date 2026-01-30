import React, { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const reasons = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'spam', label: 'Spam' },
  { value: 'antisemitism', label: 'Antisemitism or hate speech' },
  { value: 'safety_concern', label: 'Safety concern' },
  { value: 'other', label: 'Other' }
];

export default function ReportModal({ open, onOpenChange, contentId, contentType, currentUser }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    
    setIsSubmitting(true);
    
    await base44.entities.Report.create({
      reporter_id: currentUser.id,
      reported_content_id: contentId,
      content_type: contentType,
      reason,
      details: details.trim()
    });

    setReason('');
    setDetails('');
    setIsSubmitting(false);
    onOpenChange(false);
    toast.success('Report submitted. Our moderators will review it.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. All reports are confidential.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-base">What's the issue?</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-3 space-y-2">
              {reasons.map(r => (
                <div key={r.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer flex-1">{r.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Additional details (optional)</Label>
            <Textarea 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}