import React from 'react';
import { Heart } from 'lucide-react';

export default function ThankYouBanner({ helperName, requesterName }) {
  if (!helperName) return null;
  return (
    <div
      className="rounded-2xl px-4 py-4 flex items-start gap-3 mb-3"
      style={{
        background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
        border: '1px solid #86EFAC',
        boxShadow: '0 4px 12px rgba(22,163,74,0.12)',
      }}
    >
      <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <Heart className="w-4 h-4 text-white fill-current" />
      </div>
      <div>
        <p className="font-bold text-green-900 text-[15px] leading-tight">
          Thank you, {helperName}! 💚
        </p>
        <p className="text-green-800 text-[13px] mt-0.5 leading-snug">
          {helperName} stepped up and helped{requesterName ? ` ${requesterName}` : ' this community member'}.
          That's what community looks like.
        </p>
      </div>
    </div>
  );
}