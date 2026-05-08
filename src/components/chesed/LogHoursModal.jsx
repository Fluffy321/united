import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { dataService } from '@/services';
import { toast } from 'sonner';
import { Minus, Plus, Loader2 } from 'lucide-react';

const CATEGORIES = ['Chesed', 'Volunteering', 'Tutoring', 'Visiting Sick', 'Food Drive', 'Other'];

export default function LogHoursModal({ open, onOpenChange, currentUser, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    hours: 1,
    hoursInput: '1',
    category: 'Chesed',
    organization_name: '',
    notes: '',
    requestVerification: false,
    verifier_name: '',
    verifier_email: '',
    verifier_phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const setHours = (val) => {
    const clamped = Math.max(0.5, Math.round(val * 2) / 2);
    setForm(f => ({ ...f, hours: clamped, hoursInput: String(clamped) }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Please enter an activity title');
    if (!form.date) return toast.error('Please select a date');
    if (!form.hours || form.hours <= 0) return toast.error('Please enter valid hours');

    setSubmitting(true);
    const payload = {
      user_id: currentUser.id,
      user_name: currentUser.full_name || currentUser.display_name,
      title: form.title.trim(),
      date: form.date,
      hours: form.hours,
      category: form.category,
      organization_name: form.organization_name.trim() || undefined,
      notes: form.notes.trim() || undefined,
      verification_status: form.requestVerification ? 'Pending' : 'Unverified',
      verifier_name: form.requestVerification ? form.verifier_name.trim() : undefined,
      verifier_email: form.requestVerification ? form.verifier_email.trim() : undefined,
      verifier_phone: form.requestVerification ? form.verifier_phone.trim() : undefined,
    };

    await dataService.entities.ChesedLog.create(payload);
    toast.success('Hours logged!');
    setSubmitting(false);
    onOpenChange(false);
    setForm({ title: '', date: new Date().toISOString().split('T')[0], hours: 1, hoursInput: '1', category: 'Chesed', organization_name: '', notes: '', requestVerification: false, verifier_name: '', verifier_email: '', verifier_phone: '' });
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-[17px] font-bold text-[#0F172A]">Log Chesed Hours</DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">Activity *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Food pantry volunteering"
              className="w-full px-3 py-2.5 text-[14px] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>

          {/* Date + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 text-[13px] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 text-[13px] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#2563EB]"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Hours stepper */}
          <div>
            <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">Hours *</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setHours(form.hours - 0.5)} className="w-9 h-9 rounded-full bg-[#F0F3F9] flex items-center justify-center text-[#374151] active:scale-95">
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={form.hoursInput}
                onChange={e => {
                  setForm(f => ({ ...f, hoursInput: e.target.value }));
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) setForm(f => ({ ...f, hours: v, hoursInput: e.target.value }));
                }}
                className="flex-1 text-center text-[20px] font-bold text-[#0F172A] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl py-2 outline-none focus:border-[#2563EB]"
              />
              <button onClick={() => setHours(form.hours + 0.5)} className="w-9 h-9 rounded-full bg-[#F0F3F9] flex items-center justify-center text-[#374151] active:scale-95">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Organization */}
          <div>
            <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">Organization (optional)</label>
            <input
              value={form.organization_name}
              onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))}
              placeholder="e.g. Young Israel of Lawrence"
              className="w-full px-3 py-2.5 text-[14px] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="What did you do?"
              rows={2}
              className="w-full px-3 py-2.5 text-[14px] bg-[#F5F7FB] border border-[#E8ECF4] rounded-xl outline-none focus:border-[#2563EB] resize-none"
            />
          </div>

          {/* Request verification toggle */}
          <div className="bg-[#F0F7FF] border border-[#BFDBFE] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#1D4ED8]">Request Verification</p>
                <p className="text-[11px] text-[#3B82F6]">For school / community requirements</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, requestVerification: !f.requestVerification }))}
                className={`relative w-10 h-5.5 rounded-full transition-colors ${form.requestVerification ? 'bg-[#2563EB]' : 'bg-[#D1D5DB]'}`}
                style={{ width: 40, height: 22 }}
              >
                <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all ${form.requestVerification ? 'left-[18px]' : 'left-0.5'}`}
                  style={{ width: 18, height: 18 }} />
              </button>
            </div>
            {form.requestVerification && (
              <div className="mt-3 space-y-2">
                <input
                  value={form.verifier_name}
                  onChange={e => setForm(f => ({ ...f, verifier_name: e.target.value }))}
                  placeholder="Verifier name"
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#BFDBFE] rounded-lg outline-none focus:border-[#2563EB]"
                />
                <input
                  value={form.verifier_email}
                  onChange={e => setForm(f => ({ ...f, verifier_email: e.target.value }))}
                  placeholder="Verifier email"
                  type="email"
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#BFDBFE] rounded-lg outline-none focus:border-[#2563EB]"
                />
                <input
                  value={form.verifier_phone}
                  onChange={e => setForm(f => ({ ...f, verifier_phone: e.target.value }))}
                  placeholder="Verifier phone (optional)"
                  type="tel"
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#BFDBFE] rounded-lg outline-none focus:border-[#2563EB]"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] font-semibold text-[15px]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {submitting ? 'Logging…' : 'Log Hours'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}