import React, { useState, useRef } from 'react';
import { Loader2, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { dataService } from '@/services';
import { toast } from 'sonner';
import CommunityLogo from './CommunityLogo';

export default function ClaimModal({ open, onOpenChange, community, currentUser }) {
  const [name, setName]   = useState(currentUser?.display_name || currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [role, setRole]   = useState('');
  const [proof, setProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [logoUrl, setLogoUrl] = useState(community?.logo_url ?? null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { file_url } = await dataService.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
      toast.success('Logo ready!');
    } catch {
      toast.error('Upload failed');
    }
    setLogoUploading(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !role.trim()) {
      toast.error('Please fill in name, email, and your role');
      return;
    }
    setSubmitting(true);
    await dataService.entities.ClaimRequest.create({
      community_id: community.id,
      community_name: community.name,
      requester_id: currentUser?.id,
      requester_name: name.trim(),
      requester_email: email.trim(),
      org_email: email.trim(),
      role_at_org: role.trim(),
      notes: proof.trim() || undefined,
      status: 'pending',
    });
    // If they uploaded a logo, save it immediately
    if (logoUrl && logoUrl !== community?.logo_url) {
      await dataService.entities.Community.update(community.id, {
        logo_url: logoUrl,
        logo_source: 'UPLOADED',
      });
    }
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
            {/* Logo upload step */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <CommunityLogo community={{ ...community, logo_url: logoUrl }} size="md" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-700 mb-1">Upload your logo <span className="text-slate-400 font-normal">(optional)</span></p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#0F5ED7] bg-[#EEF4FF] px-3 py-1.5 rounded-lg"
                >
                  {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {logoUploading ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
                </button>
              </div>
            </div>
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