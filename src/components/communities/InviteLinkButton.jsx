import React, { useState } from 'react';
import { Link2, Share2, MessageCircle, Check } from 'lucide-react';
import { createPageUrl } from '@/utils';

/**
 * InviteLinkButton
 * type: 'community' | 'group'
 * id: the community or group id
 * name: for the share text
 */
export default function InviteLinkButton({ type, id, name, className = '' }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const inviteUrl = `${window.location.origin}${createPageUrl('InviteJoin')}?type=${type}&id=${id}`;
  const shareText = `Join me in "${name}" on Kehilla! 🌟`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + inviteUrl)}`, '_blank');
  };

  const shareSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(shareText + '\n' + inviteUrl)}`, '_blank');
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: `Join ${name}`, text: shareText, url: inviteUrl });
    } else {
      setOpen(true);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors active:scale-95 ${className}`}
      >
        <Share2 className="w-3.5 h-3.5" />
        Invite
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Sheet */}
          <div
            className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-100 p-4 z-50"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
          >
            <p className="text-[13px] font-bold text-slate-800 mb-1">Invite people to join</p>
            <p className="text-[11px] text-slate-400 mb-3 truncate">{inviteUrl}</p>

            <div className="space-y-2">
              {/* Copy Link */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                {copied
                  ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <Link2 className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                <span className="text-[13px] font-semibold text-slate-700">
                  {copied ? 'Copied!' : 'Copy Link'}
                </span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-green-50 transition-colors text-left"
                style={{ background: '#F0FDF4' }}
              >
                <span className="text-lg leading-none">💬</span>
                <span className="text-[13px] font-semibold text-green-700">Share on WhatsApp</span>
              </button>

              {/* SMS / Text */}
              <button
                onClick={shareSMS}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-left"
              >
                <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-[13px] font-semibold text-blue-700">Send as Text</span>
              </button>

              {/* Native Share (Instagram, etc.) */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={shareNative}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <span className="text-lg leading-none">📤</span>
                  <span className="text-[13px] font-semibold text-slate-700">More options…</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}