import React, { useState } from 'react';
import { ArrowRight, Compass } from 'lucide-react';

export default function UsefulNearbyCard({ title, detail, count, imageUrl, onOpen, tone = 'from-[#173A7A] to-[#2861E8]' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <button type="button" onClick={onOpen} className="relative min-h-[154px] min-w-[174px] overflow-hidden rounded-[23px] bg-[#102650] text-left text-white shadow-[0_10px_24px_rgba(16,38,80,0.18)] active:scale-[0.98]">
      {showImage ? (
        <img src={imageUrl} alt="" onError={() => setImageFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${tone}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07142E]/95 via-[#07142E]/45 to-transparent" />
      <div className="relative flex min-h-[154px] flex-col justify-between p-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm"><Compass className="h-4 w-4" /></span>
        <span>
          <strong className="block max-w-[145px] text-[15px] font-black leading-tight tracking-[-0.02em]">{title}</strong>
          <span className="mt-1 block text-[10px] font-semibold leading-snug text-white/75">{detail}</span>
          <span className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.08em] text-white">{count} nearby options <ArrowRight className="h-3 w-3" /></span>
        </span>
      </div>
    </button>
  );
}
