import React, { useState } from 'react';
import { Link2, Check, Copy, Loader2, X, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function InviteLinkButton({ communityId, communityName, currentUser }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
    setLoading(true);
    try {
      const code = generateCode();
      await base44.entities.InviteLink.create({
        code,
        community_id: communityId,
        community_name: communityName,
        inviter_id: currentUser.id,
        inviter_name: currentUser.display_name || currentUser.full_name || 'A member',
        uses_count: 0,
        is_active: true,
      });
      const url = `${window.location.origin}/join?code=${code}`;
      setLink(url);
    } catch {
      toast.error('Could not generate invite link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    setOpen(true);
    if (!link) generateLink();
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors"
      >
        <Link2 className="w-3.5 h-3.5" />
        Invite
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-bold text-slate-900">Invite to {communityName}</h3>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <p className="text-[13px] text-slate-500 mb-5">
          Share this link with friends. When they sign in, they'll automatically join.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-4">
              <p className="flex-1 text-[13px] text-slate-600 font-mono truncate">{link}</p>
              <button
                onClick={copyLink}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-blue-600 text-white"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={copyLink}
              className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-[15px] flex items-center justify-center gap-2"
            >
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Invite Link</>}
            </button>

            <button
              onClick={() => { setLink(''); generateLink(); }}
              className="w-full mt-2 py-2.5 text-[13px] font-medium text-slate-500 flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Generate new link
            </button>
          </>
        )}
      </div>
    </div>
  );
}