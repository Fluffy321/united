import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

const ALERT_TYPES = [
  { value: 'power_outage', emoji: '⚡', label: 'Power Outage', desc: 'Family lost power' },
  { value: 'shiva',        emoji: '🕯️', label: 'Shiva Info',   desc: 'Inform the community' },
  { value: 'missing_item', emoji: '🔍', label: 'Missing Item', desc: 'Lost something important' },
  { value: 'urgent_ride',  emoji: '🚗', label: 'Urgent Ride',  desc: 'Need a ride now' },
  { value: 'medical',      emoji: '🏥', label: 'Medical',      desc: 'Medical emergency info' },
  { value: 'other',        emoji: '📢', label: 'Other',        desc: 'Urgent community notice' },
];

export default function CommunityAlertModal({ open, onOpenChange, currentUser }) {
  const [step, setStep] = useState(1); // 1=pick type, 2=fill form
  const [alertType, setAlertType] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep(1);
    setAlertType(null);
    setTitle('');
    setBody('');
    setContact('');
    setLoading(false);
  };

  const handleClose = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSelectType = (t) => {
    setAlertType(t);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in the required fields');
      return;
    }
    setLoading(true);
    try {
      await base44.entities.CommunityAlert.create({
        type: alertType.value,
        title: title.trim(),
        body: body.trim(),
        contact_info: contact.trim(),
        posted_by: currentUser.id,
        posted_by_name: currentUser.display_name || currentUser.full_name,
        city: currentUser.cityPreset || currentUser.cityCustom || 'Five Towns',
        is_resolved: false,
      });
      toast.success('🚨 Community alert sent!');
      handleClose(false);
    } catch (e) {
      toast.error('Failed to send alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden border-0" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Red header */}
        <div className="bg-gradient-to-br from-red-600 to-rose-700 px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-[16px] leading-tight">Community Alert</h2>
              <p className="text-white/70 text-[12px]">Notify your entire local community</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {step === 1 ? (
            <>
              <p className="text-[13px] text-slate-500 mb-3 font-medium">What's the alert type?</p>
              <div className="grid grid-cols-2 gap-2">
                {ALERT_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => handleSelectType(t)}
                    className="flex flex-col items-start gap-0.5 p-3 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all text-left active:scale-95"
                  >
                    <span className="text-xl">{t.emoji}</span>
                    <span className="font-semibold text-[13px] text-[#0F1C2E]">{t.label}</span>
                    <span className="text-[11px] text-slate-400">{t.desc}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium mb-3 hover:text-slate-600">
                <span>←</span> {alertType.emoji} {alertType.label}
              </button>
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-semibold text-slate-500 mb-1 block">Headline *</label>
                  <Input
                    placeholder={`e.g. "Lost power on Elm St — need help"`}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="text-[14px]"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-slate-500 mb-1 block">Details *</label>
                  <Textarea
                    placeholder="Provide any important details the community should know..."
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={3}
                    className="text-[14px] resize-none"
                    maxLength={400}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-slate-500 mb-1 block">Contact Info (optional)</label>
                  <Input
                    placeholder="Phone or email"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    className="text-[14px]"
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading || !title.trim() || !body.trim()}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] rounded-xl h-11"
              >
                {loading ? '⏳ Sending...' : '🚨 Send Alert to Community'}
              </Button>
              <p className="text-center text-[11px] text-slate-400 mt-2">Use sparingly — only for genuine urgent situations</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}