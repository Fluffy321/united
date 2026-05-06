import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { dataService } from '@/services';
import { toast } from 'sonner';
import { Minus, Plus, Loader2, HandHeart } from 'lucide-react';

const CATEGORY_MAP = {
  'Errand': 'Chesed',
  'Lost & Found': 'Chesed',
  'Quick Favor': 'Chesed',
  'Tutoring': 'Tutoring',
  'Shabbat Help': 'Chesed',
  'Other': 'Chesed',
};

export default function LogHoursFromMitzvahModal({ open, onOpenChange, request, signup, currentUser, onSuccess }) {
  const [hours, setHoursState] = useState(1);
  const [hoursInput, setHoursInput] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [requestVerification, setRequestVerification] = useState(false);
  const [verifierName, setVerifierName] = useState('');
  const [verifierEmail, setVerifierEmail] = useState('');
  const [verifierPhone, setVerifierPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const adjustHours = (val) => {
    const clamped = Math.max(0.5, Math.round(val * 2) / 2);
    setHoursState(clamped);
    setHoursInput(String(clamped));
  };

  const handleSubmit = async () => {
    if (!hours || hours <= 0) return toast.error('Please enter valid hours');

    setSubmitting(true);
    try {
      // Prevent duplicate: if signup already has a log, just update it
      let logId = signup?.chesed_log_id;

      if (!logId) {
        const newLog = await dataService.entities.ChesedLog.create({
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.display_name,
          title: request.title,
          category: CATEGORY_MAP[request.category] || 'Chesed',
          date,
          hours,
          notes: notes.trim() || undefined,
          source: 'MITZVAH_REQUEST',
          request_id: request.id,
          signup_id: signup?.id,
          verification_status: requestVerification ? 'Pending' : 'Unverified',
          verifier_name: requestVerification ? verifierName.trim() : undefined,
          verifier_email: requestVerification ? verifierEmail.trim() : undefined,
          verifier_phone: requestVerification ? verifierPhone.trim() : undefined,
        });
        logId = newLog.id;

        // Link log back to signup
        if (signup?.id) {
          await dataService.entities.MitzvahSignup.update(signup.id, {
            chesed_log_id: logId,
            status: 'COMPLETED',
            completed_at: new Date().toISOString(),
          });
        }
      } else {
        // Update existing log — reset verification if it was verified
        const existingLogs = await dataService.entities.ChesedLog.filter({ id: logId });
        const wasVerified = existingLogs[0]?.verification_status === 'Verified';
        await dataService.entities.ChesedLog.update(logId, {
          date,
          hours,
          notes: notes.trim() || undefined,
          verification_status: wasVerified ? 'Pending' : (requestVerification ? 'Pending' : 'Unverified'),
          verifier_name: requestVerification ? verifierName.trim() : undefined,
          verifier_email: requestVerification ? verifierEmail.trim() : undefined,
          verifier_phone: requestVerification ? verifierPhone.trim() : undefined,
        });
      }

      // Mark the mitzvah request completed
      await dataService.entities.MitzvahRequest.update(request.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      toast.success('Hours logged & mitzvah completed! ✨');
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error('Failed to log hours');
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              <HandHeart className="w-4 h-4 text-purple-600" />
            </div>
            <DialogTitle className="text-[17px] font-bold text-[#0F172A]">Log Mitzvah Hours</DialogTitle>
          </div>
          <p className="text-[12px] text-[#6B7280] pb-3 border-b border-[#F0F3F9]">
            Pre-filled from: <span className="font-semibold text-[#374151]">{request?.title}</span>
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Hours stepper */}
          <div>
            <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">Hours *</label>
            <div className="flex items-center gap-3">
              <button onClick={() => adjustHours(hours - 0.5)} className="w-9 h-9 rounded-full bg-[#F0F3F9] flex items-center justify-center text-[#374151] active:scale-95">
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={hoursInput}
                onChange={e => {
                  setHoursInput(e.target.value);
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) setHoursState(v);
                }}
                className="flex-1 text-center text-[20px] font-bold text-[#0F172A] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl py-2 outline-none focus:border-[#2563EB]"
              />
              <button onClick={() => adjustHours(hours + 0.5)} className="w-9 h-9 rounded-full bg-[#F0F3F9] flex items-center justify-center text-[#374151] active:scale-95">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What did you do?"
              rows={2}
              className="w-full px-3 py-2.5 text-[14px] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#2563EB] resize-none"
            />
          </div>

          {/* Verification */}
          <div className="bg-[#F0F7FF] border border-[#BFDBFE] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#1D4ED8]">Request Verification</p>
                <p className="text-[11px] text-[#3B82F6]">For school / community requirements</p>
              </div>
              <button
                onClick={() => setRequestVerification(v => !v)}
                style={{ width: 40, height: 22, position: 'relative' }}
                className={`rounded-full transition-colors ${requestVerification ? 'bg-[#2563EB]' : 'bg-[#D1D5DB]'}`}
              >
                <span
                  style={{ width: 18, height: 18, position: 'absolute', top: 2, left: requestVerification ? 20 : 2 }}
                  className="bg-white rounded-full shadow transition-all"
                />
              </button>
            </div>
            {requestVerification && (
              <div className="mt-3 space-y-2">
                <input value={verifierName} onChange={e => setVerifierName(e.target.value)} placeholder="Verifier name"
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#BFDBFE] rounded-lg outline-none focus:border-[#2563EB]" />
                <input value={verifierEmail} onChange={e => setVerifierEmail(e.target.value)} placeholder="Verifier email" type="email"
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#BFDBFE] rounded-lg outline-none focus:border-[#2563EB]" />
                <input value={verifierPhone} onChange={e => setVerifierPhone(e.target.value)} placeholder="Verifier phone (optional)" type="tel"
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#BFDBFE] rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] font-semibold text-[15px]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {submitting ? 'Saving…' : 'Log Hours & Complete Mitzvah'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}