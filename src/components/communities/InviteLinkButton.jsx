import React, { useState } from 'react';
import { Link2, Check, Copy, X } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteLinkButton({ communityId, communityName }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/community/${communityId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success('Community link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
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
          Share this link with friends. They'll be able to view and join this community.
        </p>

        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-4">
          <p className="flex-1 text-[13px] text-slate-600 font-mono truncate">{shareUrl}</p>
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
          {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
        </button>
      </div>
    </div>
  );
}
