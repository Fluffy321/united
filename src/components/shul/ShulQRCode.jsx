import React, { useState } from 'react';
import { QrCode, Copy, Check, Share2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function ShulQRCode({ shul }) {
  const [copied, setCopied] = useState(false);

  const joinUrl = `${window.location.origin}${window.location.pathname}#/${createPageUrl('ShulPage')}?shulId=${shul.id}`.replace('/#/', '/');
  // Simpler join URL:
  const directUrl = `${window.location.origin}/?page=ShulPage&shulId=${shul.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(directUrl)}&color=0F1C2E&bgcolor=FFFFFF&margin=10`;

  const handleCopy = () => {
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: shul.name, text: `Join ${shul.name} on the app!`, url: directUrl });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EAECF0] overflow-hidden"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#F2F4F7]">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-blue-600" />
          <p className="font-bold text-[14px] text-[#0F1C2E]">Join QR Code</p>
        </div>
        <p className="text-[12px] text-slate-500 mt-0.5">Print or share to let members join instantly</p>
      </div>

      {/* QR */}
      <div className="flex flex-col items-center px-4 py-5">
        <div className="bg-white rounded-2xl border-2 border-[#E8ECF4] p-3 mb-4 shadow-sm">
          <img src={qrUrl} alt="QR Code" className="w-[160px] h-[160px]" />
        </div>

        <p className="text-[13px] font-semibold text-[#0F1C2E] text-center mb-1">{shul.name}</p>
        <p className="text-[11px] text-slate-400 text-center mb-4 break-all max-w-xs">{directUrl}</p>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E8ECF4] text-[13px] font-semibold text-[#0F1C2E] hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0F1C2E] text-white text-[13px] font-semibold hover:bg-[#1e3a5f] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="bg-[#F0F6FF] rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-[#1E40AF] font-medium">💡 Print this QR code and post it at your shul entrance, bulletin board, or include in your weekly newsletter for easy member onboarding.</p>
        </div>
      </div>
    </div>
  );
}