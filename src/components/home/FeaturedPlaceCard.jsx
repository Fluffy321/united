import React, { useState } from 'react';
import { ArrowUpRight, Image, MapPin } from 'lucide-react';

const FALLBACK_TONES = {
  'jewish-life': 'from-indigo-100 via-blue-50 to-white text-indigo-700',
  food: 'from-amber-100 via-orange-50 to-white text-amber-700',
  family: 'from-sky-100 via-cyan-50 to-white text-sky-700',
  shopping: 'from-pink-100 via-rose-50 to-white text-pink-700',
  'things-to-do': 'from-orange-100 via-yellow-50 to-white text-orange-700',
};

export default function FeaturedPlaceCard({ listing, onOpen }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(listing?.imageUrl) && !imageFailed;

  return (
    <article className="min-w-[244px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_10px_26px_rgba(15,28,46,0.07)]">
      <button type="button" onClick={() => onOpen?.(listing)} className="block w-full text-left">
        <div className={`relative h-[128px] overflow-hidden bg-gradient-to-br ${FALLBACK_TONES[listing?.groupId] || 'from-slate-100 via-slate-50 to-white text-slate-600'}`}>
          {showImage ? (
            <img src={listing.imageUrl} alt="" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <Image className="h-7 w-7" />
              <span className="text-[10px] font-black">Photo coming from an official source</span>
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black text-slate-700 shadow-sm">{listing.town}</span>
        </div>
        <div className="p-3.5">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-black leading-tight tracking-[-0.025em] text-slate-950">{listing.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-500"><MapPin className="h-3 w-3" /> {listing.address || listing.town}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-350" />
          </div>
          {listing.whyGo && (
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#2861E8]">Why go</span>
              <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-600">{listing.whyGo}</p>
            </div>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {(listing.tags || []).slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">{tag}</span>)}
          </div>
        </div>
      </button>
      {showImage && (
        <a href={listing.imageSourceUrl} target="_blank" rel="noreferrer" className="mx-3.5 mb-3 inline-flex min-h-8 items-center text-[9px] font-bold text-slate-400">Official photo · {listing.imageSourceLabel}</a>
      )}
    </article>
  );
}
