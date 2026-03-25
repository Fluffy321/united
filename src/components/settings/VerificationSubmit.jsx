import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TYPES = [
  { value: 'residency', label: '🏠 Proof of Residency', desc: 'Utility bill, lease, or ID showing local address' },
  { value: 'community_membership', label: '🕍 Community Membership', desc: 'Shul/school membership card or letter from rabbi/principal' },
  { value: 'professional', label: '💼 Professional', desc: 'License or credential for a local professional service' },
];

export default function VerificationSubmit({ currentUser }) {
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('residency');
  const [communityName, setCommunityName] = useState('');
  const [proofDesc, setProofDesc] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.VerificationRequest.filter({ user_id: currentUser.id }, '-created_date')
      .then(results => { setExisting(results[0] || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentUser.id]);

  const handleSubmit = async () => {
    if (!proofDesc.trim()) { toast.error('Please describe your proof'); return; }
    setSubmitting(true);
    let proofUrl = null;
    if (proofFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
      proofUrl = file_url;
    }
    const req = await base44.entities.VerificationRequest.create({
      user_id: currentUser.id,
      user_name: currentUser.display_name || currentUser.full_name,
      user_email: currentUser.email,
      verification_type: type,
      community_name: communityName.trim(),
      proof_description: proofDesc.trim(),
      proof_image_url: proofUrl,
      status: 'pending',
    });
    setExisting(req);
    setSubmitting(false);
    toast.success('Verification request submitted! We\'ll review it within 48 hours.');
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>;

  // Already verified
  if (currentUser.is_verified) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
        <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-bold text-green-800">Your account is verified ✓</p>
          <p className="text-sm text-green-600 mt-0.5">Your verified badge is visible on your profile and posts.</p>
        </div>
      </div>
    );
  }

  // Show existing request status
  if (existing) {
    const statusConfig = {
      pending: { icon: Clock, color: 'amber', label: 'Under Review', desc: 'We\'ll notify you within 48 hours.' },
      approved: { icon: CheckCircle2, color: 'green', label: 'Approved', desc: 'Your verification was approved!' },
      rejected: { icon: XCircle, color: 'red', label: 'Not Approved', desc: existing.admin_note || 'Please resubmit with clearer documentation.' },
    };
    const cfg = statusConfig[existing.status];
    const Icon = cfg.icon;
    return (
      <div className={`p-4 rounded-xl border bg-${cfg.color}-50 border-${cfg.color}-200`}>
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`w-6 h-6 text-${cfg.color}-600`} />
          <p className={`font-bold text-${cfg.color}-800`}>{cfg.label}</p>
        </div>
        <p className={`text-sm text-${cfg.color}-700`}>{cfg.desc}</p>
        {existing.status === 'rejected' && (
          <button
            onClick={() => setExisting(null)}
            className="mt-3 text-sm font-semibold text-red-700 underline"
          >
            Submit a new request
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800">
          Verified members get a <strong>✓ Verified</strong> badge on their profile, building trust for housing and help exchanges.
        </p>
      </div>

      {/* Type selector */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">What are you verifying?</p>
        {TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
              type === t.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <p className={`text-sm font-semibold ${type === t.value ? 'text-blue-700' : 'text-slate-800'}`}>{t.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      {type === 'community_membership' && (
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">Community / Shul / School name</label>
          <input
            value={communityName}
            onChange={e => setCommunityName(e.target.value)}
            placeholder="e.g. Young Israel of Woodmere"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1">Describe your proof</label>
        <textarea
          value={proofDesc}
          onChange={e => setProofDesc(e.target.value)}
          placeholder="e.g. I'm attaching a utility bill showing my address in Woodmere, NY..."
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-blue-400"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1">Upload document (optional but recommended)</label>
        <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
          <Upload className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">{proofFile ? proofFile.name : 'Tap to upload image or PDF'}</span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setProofFile(e.target.files[0])} />
        </label>
        <p className="text-xs text-slate-400 mt-1">Personal info will be reviewed by an admin only and kept confidential.</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !proofDesc.trim()}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        Submit Verification Request
      </button>
    </div>
  );
}