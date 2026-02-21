import React, { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ClaimModal({ open, onOpenChange, community, currentUser }) {
  const [name, setName]   = useState(currentUser?.display_name || currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [role, setRole]   = useState('');
  const [proof, setProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !role.trim()) {
      toast.error('Please fill in name, email, and your role');
      return;
    }
    setSubmitting(true);
    await base44.entities.ClaimRequest.create({
      community_id: community.id,
      requester_name: name.trim(),
      requester_email: email.trim(),
      requester_user_id: currentUser?.id,
      requester_phone: phone.trim() || undefined,
      requester_role: role.trim(),
      proof_text_or_link: proof.trim() || undefined,
      status: 'PENDING'
    });
    setSubmitting(false);
    setDone(true);
  };

  const handleClose = () => {
    setDone(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Claim "{community?.name}"</DialogTitle>
          <DialogDescription>
            Claiming gives you free admin tools. We'll verify and respond within 24–48 hours.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-slate-900 text-lg mb-2">Request Submitted!</h3>
            <p className="text-sm text-slate-500 mb-6">
              We'll review your claim and get back to you at <strong>{email}</strong> within 24–48 hours.
            </p>
            <Button onClick={handleClose} className="bg-[#0F5ED7] hover:bg-[#0D4EB8]">Got it</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Your Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Your Role *</Label>
                <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Rabbi, Principal, Staff..." className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Email Address *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Proof / Verification link (optional)</Label>
              <Textarea
                value={proof}
                onChange={e => setProof(e.target.value)}
                placeholder="Link to official website, staff directory, or brief note..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button className="flex-1 bg-[#0F5ED7] hover:bg-[#0D4EB8]" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Claim'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}