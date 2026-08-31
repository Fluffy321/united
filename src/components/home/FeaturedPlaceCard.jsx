import React from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import DirectoryPhotoMedia from './DirectoryPhotoMedia';

export default function FeaturedPlaceCard({ listing, onOpen }) {
  return (
    <article className="min-w-[244px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_10px_26px_rgba(15,28,46,0.07)]">
      <DirectoryPhotoMedia listing={listing} className="h-[128px] w-full" />
      <button type="button" onClick={() => onOpen?.(listing)} className="block w-full text-left">
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
    </article>
  );
}
