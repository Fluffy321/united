import React from 'react';
import { CheckCircle2, ExternalLink, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import {
  canShowKosherVerification,
  directoryMapLinks,
} from '@/lib/directory/fiveTownsDirectory';

export default function DirectoryListingCard({ listing, onOpen, onReportCorrection }) {
  const maps = directoryMapLinks(listing);
  const isKosherVerified = canShowKosherVerification(listing);

  return (
    <article className="rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-[0_8px_26px_rgba(15,28,46,0.06)]">
      <button type="button" onClick={() => onOpen?.(listing)} className="w-full text-left">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF0FF] text-[#2456D8]">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-black leading-tight tracking-[-0.015em] text-[#0F1C2E]">
              {listing.name}
            </span>
            <span className="mt-1 block text-[12px] font-medium leading-snug text-slate-500">
              {listing.address || listing.town}
            </span>
          </span>
          <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
        </div>
      </button>

      {isKosherVerified && (
        <a
          href={listing.kosherSourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified kosher{listing.kosherCertifier ? ` · ${listing.kosherCertifier}` : ''}
        </a>
      )}

      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {Object.entries(maps).map(([provider, href]) => (
          <a
            key={provider}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black capitalize text-slate-700"
          >
            <Navigation className="h-3.5 w-3.5 text-[#2F67EC]" />
            {provider[0].toUpperCase() + provider.slice(1)}
          </a>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <a
          href={listing.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-1 text-[11px] font-bold text-[#2456D8]"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Source
        </a>
        <button
          type="button"
          onClick={() => onReportCorrection?.(listing)}
          className="min-h-9 text-[11px] font-bold text-slate-500"
        >
          Report a correction
        </button>
      </div>
    </article>
  );
}
